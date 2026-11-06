"""
SuitMarket API — sidecar Python stdlib (sin pip, sin frameworks).
Sirve index.html + /api/market/{quotes,movers,news} en el puerto 3020.

Hibrido gratis (decision 2026-10-17):
  1. Twelve Data /quote (key gratis OPCIONAL en ../config.json) — indices, ETFs,
     BTC y USD/MXN (dolar de mercado). Presupuesto diario configurable
     (default 750 de los 800 del plan free), reset a medianoche UTC.
     Al agotarse, los simbolos caen a Yahoo sin cortar el servicio.
  2. Yahoo v8 chart (sin key, server-side) — commodities (no estan en el plan
     free de TD) y fallback universal. Cache 10 min por simbolo.
  3. Cache en memoria: TD 15 min, Yahoo 10 min, movers 15 min, news 10 min.
     El frontend refresca cada 30s pero el servidor no vuelve a la fuente
     hasta expirar el TTL — asi se estiran los 800 creditos/dia de TD.

Contrato del frontend (identico al proxy de server.js):
  quotes -> [{symbol, shortName, regularMarketPrice, regularMarketChangePercent, ...}]
  Se ecoa el simbolo PEDIDO (^GSPC, BTC-USD, USD/MXN), no el del proveedor.
  movers -> [] (el frontend ya ordena ETFs+commodities como fallback)
  news   -> [{title, link, publisher, providerPublishTime}]
"""
import json
import os
import sys
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from concurrent.futures import ThreadPoolExecutor
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, '..', 'config.json')
INDEX_PATH = os.path.join(HERE, '..', 'index.html')
SENALES_PATH = os.path.join(HERE, 'senales.json')          # log de alertas (gitignored: chat_id)
TG_ENV_PATH = os.path.join(HERE, '..', '..', 'SuitChatTG', '.env')
TUNEL_URL_PATH = os.path.join(HERE, 'tunel_url.txt')       # URL viva del tunnel (gitignored)
PORT = int(os.environ.get('PORT', '3020'))

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

def load_config():
    try:
        with open(CONFIG_PATH, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

CFG = load_config()
TD_KEY = (CFG.get('twelvedata_api_key') or '').strip()
TD_BUDGET = int(CFG.get('td_daily_budget', 750))
TTL_TD = int(CFG.get('ttl_td_sec', 900))
TTL_YAHOO = int(CFG.get('ttl_yahoo_sec', 600))
TTL_MOVERS = int(CFG.get('ttl_movers_sec', 900))
TTL_NEWS = int(CFG.get('ttl_news_sec', 600))

# simbolo del frontend -> (simbolo Twelve Data o None, simbolo Yahoo)
SYMBOL_MAP = {
    '^GSPC':  ('SPX', '^GSPC'),
    '^DJI':   ('DJI', '^DJI'),
    '^IXIC':  ('IXIC', '^IXIC'),
    '^VIX':   ('VIX', '^VIX'),
    '^RUT':   (None, '^RUT'),
    'USD/MXN': ('USD/MXN', 'USDMXN=X'),
    'BTC-USD': ('BTC/USD', 'BTC-USD'),
    'SPY': ('SPY', 'SPY'), 'QQQ': ('QQQ', 'QQQ'), 'DIA': ('DIA', 'DIA'),
    'IVV': ('IVV', 'IVV'), 'VOO': ('VOO', 'VOO'),
    # commodities: el plan free de TD no los cubre -> Yahoo directo
    'GC=F': (None, 'GC=F'), 'SI=F': (None, 'SI=F'), 'CL=F': (None, 'CL=F'),
    'HG=F': (None, 'HG=F'), 'NG=F': (None, 'NG=F'),
}
MOVERS_WATCHLIST = 'NVDA,TSLA,AAPL,MSFT,AMZN,GOOGL,META,AMD,NFLX,PLTR'
# Watchlist del detector de entradas (gainers + ETFs) — Yahoo, sin costo de creditos TD
SIGNAL_WATCHLIST = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'PLTR',
                    'SPY', 'QQQ', 'DIA', 'IVV', 'VOO']

_cache = {}            # simbolo -> {q, ts, source}
_movers_cache = {'ts': 0, 'data': []}
_news_cache = {'ts': 0, 'data': []}
_td_budget = {'date': '', 'used': 0}
_fetch_lock = threading.Lock()

def http_json(url, timeout=8):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))

def td_available():
    if not TD_KEY:
        return False
    today = time.strftime('%Y-%m-%d', time.gmtime())
    if _td_budget['date'] != today:
        _td_budget['date'] = today
        _td_budget['used'] = 0
    return _td_budget['used'] < TD_BUDGET

def norm_change(pct):
    try:
        return round(float(pct), 2)
    except (TypeError, ValueError):
        return 0.0

def norm_price(p):
    try:
        return float(p)
    except (TypeError, ValueError):
        return None

def yahoo_quote(sym):
    url = (f'https://query1.finance.yahoo.com/v8/finance/chart/'
           f'{urllib.parse.quote(sym)}?interval=1d&range=1d')
    meta = http_json(url)['chart']['result'][0]['meta']
    price = norm_price(meta.get('regularMarketPrice'))
    if price is None:
        return None
    prev = norm_price(meta.get('chartPreviousClose') or meta.get('previousClose'))
    change = price - prev if prev else 0.0
    pct = (change / prev) * 100 if prev else 0.0
    return {
        'symbol': sym,
        'shortName': meta.get('shortName') or sym,
        'longName': meta.get('longName') or meta.get('shortName') or sym,
        'regularMarketPrice': price,
        'regularMarketChange': round(change, 2),
        'regularMarketChangePercent': norm_change(pct),
        'currency': meta.get('currency'),
    }

def td_quotes(syms):
    """Twelve Data /quote singular por simbolo — el param plural rechaza simbolos
    con '/' (BTC/USD, USD/MXN). Mismo costo: 1 credito por simbolo de todas formas."""
    out = {}
    for s in syms:
        # safe='' obligatorio: quote() por defecto deja '/' cruda y TD la rompe
        url = (f'https://api.twelvedata.com/quote?symbol={urllib.parse.quote(s, safe="")}'
               f'&apikey={urllib.parse.quote(TD_KEY)}')
        try:
            data = http_json(url)
        except Exception as e:
            print(f'[TD] fail {s}: {e}', file=sys.stderr)
            continue
        if isinstance(data, dict) and data.get('status') == 'error':
            print(f'[TD] {s}: {data.get("message")}', file=sys.stderr)
        elif isinstance(data, dict) and (data.get('price') or data.get('close')):
            out[s] = data
    return out

def get_quote(requested):
    """Cadena TD -> Yahoo con cache por simbolo. Siempre ecoa el simbolo pedido."""
    now = time.time()
    hit = _cache.get(requested)
    if hit and now - hit['ts'] < (TTL_TD if hit['source'] == 'td' else TTL_YAHOO):
        q = dict(hit['q'])
        q['symbol'] = requested
        return q

    with _fetch_lock:
        hit = _cache.get(requested)
        if hit and now - hit['ts'] < (TTL_TD if hit['source'] == 'td' else TTL_YAHOO):
            q = dict(hit['q'])
            q['symbol'] = requested
            return q
        td_sym, y_sym = SYMBOL_MAP.get(requested, (requested, requested))
        if td_sym and td_available():
            try:
                raw = td_quotes([td_sym]).get(td_sym)
                # /quote de TD: crypto/forex traen 'close' (ultimo), no siempre 'price'
                price = norm_price((raw.get('price') or raw.get('close')) if raw else None)
                if price is not None:
                    _td_budget['used'] += 1
                    q = {
                        'symbol': requested,
                        'shortName': requested,
                        'longName': requested,
                        'regularMarketPrice': price,
                        'regularMarketChange': norm_change(raw.get('change')),
                        'regularMarketChangePercent': norm_change(raw.get('percent_change')),
                        'currency': raw.get('currency'),
                    }
                    _cache[requested] = {'q': q, 'ts': time.time(), 'source': 'td'}
                    return dict(q)
            except Exception as e:
                print(f'[TD] fail {requested}: {e}', file=sys.stderr)
        try:
            q = yahoo_quote(y_sym)
            if q:
                q['symbol'] = requested
                _cache[requested] = {'q': q, 'ts': time.time(), 'source': 'yahoo'}
                return dict(q)
        except Exception as e:
            print(f'[YH] fail {y_sym}: {e}', file=sys.stderr)
        if hit:  # ultimo dato conocido, mas viejo que el TTL
            q = dict(hit['q'])
            q['symbol'] = requested
            q['stale'] = True
            return q
    return None

def get_movers():
    if time.time() - _movers_cache['ts'] < TTL_MOVERS:
        return _movers_cache['data']
    quotes = []
    for s in MOVERS_WATCHLIST.split(','):
        try:
            q = yahoo_quote(s)
            if q:
                quotes.append(q)
        except Exception:
            pass
    quotes.sort(key=lambda x: x.get('regularMarketChangePercent') or 0, reverse=True)
    _movers_cache['data'] = quotes
    _movers_cache['ts'] = time.time()
    return quotes

def get_news():
    if time.time() - _news_cache['ts'] < TTL_NEWS:
        return _news_cache['data']
    url = ('https://query2.finance.yahoo.com/v1/finance/search?q=stock+market'
           '&quotesCount=0&newsCount=15&enableFuzzyQuery=false')
    data = http_json(url)
    news = [{
        'title': n.get('title'),
        'link': n.get('link'),
        'publisher': n.get('publisher'),
        'providerPublishTime': n.get('providerPublishTime'),
    } for n in data.get('news', [])]
    _news_cache['data'] = news
    _news_cache['ts'] = time.time()
    return news

# ===== Senales de entrada por estructura de mercado (Yahoo, $0) =====
# Patron detectado: tendencia bajista (menor minimo + menor maximo) -> el cierre
# rompe POR ARRIBA el ultimo menor maximo = cambio de caracter / rotura de
# estructura al alza. Stop = bajo el ultimo vale; objetivo = maximo previo
# (o movimiento medido 1:1 si no hay maximo relevante). Filtro semanal:
# cierre semanal actual >= cierre de hace 4 barras. Frescura: senales <= 5 dias.
_signals_cache = {'ts': 0, 'data': None}
TTL_SIGNALS = 3600


def yahoo_bars(sym, rng, interval):
    url = (f'https://query1.finance.yahoo.com/v8/finance/chart/'
           f'{urllib.parse.quote(sym)}?range={rng}&interval={interval}')
    res = http_json(url)['chart']['result'][0]
    ts = res.get('timestamp') or []
    q = res['indicators']['quote'][0]
    # Yahoo cambia el shape entre 'h/l/c' y 'high/low/close' — aceptar ambos (CORRECCIONES)
    hh = q.get('high') or q.get('h')
    ll = q.get('low') or q.get('l')
    cc = q.get('close') or q.get('c')
    vv = q.get('volume') or q.get('vol')
    if not hh or not ll or not cc:
        return []
    bars = []
    for i, t in enumerate(ts):
        h, l, c = hh[i], ll[i], cc[i]
        if h is None or l is None or c is None:
            continue
        bars.append({'d': time.strftime('%Y-%m-%d', time.gmtime(t)), 'h': h, 'l': l, 'c': c,
                     'v': vv[i] if vv else None})
    return bars


def detect_structure(bars, max_age_days=5, w=3):
    """Devuelve la senal o None. Barras ascendentes: [{d,h,l,c}]."""
    if not bars or len(bars) < 30:
        return None
    # swings: fractal de w barras a cada lado
    piv = []
    for i in range(w, len(bars) - w):
        hi = max(bars[k]['h'] for k in range(i - w, i + w + 1))
        lo = min(bars[k]['l'] for k in range(i - w, i + w + 1))
        if bars[i]['h'] == hi:
            piv.append({'i': i, 'd': bars[i]['d'], 't': 'H', 'v': bars[i]['h']})
        if bars[i]['l'] == lo:
            piv.append({'i': i, 'd': bars[i]['d'], 't': 'L', 'v': bars[i]['l']})
    # fusiona swings consecutivos del mismo tipo (queda el mas extremo)
    merged = []
    for p in piv:
        if merged and merged[-1]['t'] == p['t']:
            more_extreme = (p['t'] == 'H' and p['v'] >= merged[-1]['v']) or (p['t'] == 'L' and p['v'] <= merged[-1]['v'])
            if more_extreme:
                merged[-1] = p
        else:
            merged.append(p)
    lows = [p for p in merged if p['t'] == 'L']
    highs = [p for p in merged if p['t'] == 'H']
    if len(lows) < 2:
        return None
    l_last, l_prev = lows[-1], lows[-2]
    if not (l_last['v'] < l_prev['v']):          # hace falta menor minimo
        return None
    betw = [h for h in highs if l_prev['i'] < h['i'] < l_last['i']]
    if not betw:
        return None
    h_break = betw[-1]                            # ultimo menor maximo = nivel a romper
    stop = l_last['v']
    if h_break['v'] <= stop:
        return None
    trig, trig_i = None, None
    for idx in range(l_last['i'] + 1, len(bars)):  # primer cierre que rompe el nivel
        if bars[idx]['c'] > h_break['v']:
            trig, trig_i = bars[idx], idx
            break
    if trig is None:
        return None
    age = (time.time() - time.mktime(time.strptime(trig['d'], '%Y-%m-%d'))) / 86400
    if age > max_age_days:
        return None                                # senal vieja: no sirve para entrar
    entrada = trig['c']
    if entrada <= stop:
        return None
    prior = [h for h in highs if h['i'] < l_prev['i'] and h['v'] > h_break['v']]
    target = prior[-1]['v'] if prior else h_break['v'] + (h_break['v'] - stop)
    if target <= entrada:
        target = entrada + (entrada - stop)        # fallback movimiento medido 1:1
    # confirmacion por volumen (Wyckoff/VSA): volumen de la rompicion vs promedio de las
    # ultimas 20 barras previas — >=1.5x = confirmada
    vol = ratio = None
    prev = [b['v'] for b in bars[max(0, trig_i - 20):trig_i] if b.get('v')]
    if prev and trig.get('v'):
        avg = sum(prev) / len(prev)
        if avg > 0:
            ratio = round(trig['v'] / avg, 1)
            vol = bool(ratio >= 1.5)
    # estado vivo: que paso con el precio DESPUES de la senal
    last_close = bars[-1]['c']
    if last_close < stop:
        estado, pnl = 'invalidada', round((last_close - entrada) / entrada * 100, 1)
    elif last_close >= target:
        estado, pnl = 'objetivo', round((last_close - entrada) / entrada * 100, 1)
    else:
        estado, pnl = 'curso', round((last_close - entrada) / entrada * 100, 1)
    return {
        'fecha': trig['d'], 'rompe': round(h_break['v'], 2), 'entrada': round(entrada, 2),
        'stop': round(stop, 2), 'target': round(target, 2),
        'rrr': round((target - entrada) / (entrada - stop), 2),
        'volRatio': ratio, 'volOK': vol, 'estado': estado, 'pnl': pnl,
        'swings': [{'t': p['t'], 'd': p['d'], 'v': round(p['v'], 2)} for p in merged[-6:]],
    }


def weekly_ok(wbars):
    if not wbars or len(wbars) < 5:
        return None
    return wbars[-1]['c'] >= wbars[-5]['c']        # cierre actual vs hace 4 semanas


def get_signals():
    if _signals_cache['data'] is not None and time.time() - _signals_cache['ts'] < TTL_SIGNALS:
        return _signals_cache['data']
    out = []

    def one(sym):
        try:
            daily = yahoo_bars(sym, '6mo', '1d')
            weekly = yahoo_bars(sym, '1y', '1wk')
            sig = detect_structure(daily)
            if sig:
                sig['sym'] = sym
                sig['weeklyOk'] = weekly_ok(weekly)
                out.append(sig)
        except Exception:
            pass

    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(one, SIGNAL_WATCHLIST))
    out.sort(key=lambda s: s['fecha'], reverse=True)
    _signals_cache['data'] = out
    _signals_cache['ts'] = time.time()
    return out


# ===== TUNNEL cloudflared: webhook publico para alertas de TradingView =====
_tunel = {'url': None}


def _tunel_loop():
    """Quick tunnel cloudflared -> http://127.0.0.1:3020 (para TradingView webhooks).
    URL viva en tunel_url.txt y /api/market/webhook-url; auto-heal si muere.
    Sin cloudflared instalado solo loguea y reintenta (webhook local sigue funcionando)."""
    import subprocess
    import re
    while True:
        try:
            proc = subprocess.Popen(
                ['cloudflared', 'tunnel', '--url', 'http://127.0.0.1:' + str(PORT)],
                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
                text=True, encoding='utf-8', errors='replace')
            url = None
            for line in proc.stderr:
                m = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
                if m:
                    url = m.group(0)
                    break
            if url:
                _tunel['url'] = url
                try:
                    with open(TUNEL_URL_PATH, 'w', encoding='utf-8') as f:
                        f.write(url)
                except OSError:
                    pass
                print('[TUNEL] webhook publico: ' + url + '/api/market/webhook', flush=True)
            proc.wait()
        except Exception as e:
            print('[TUNEL] fallo: ' + str(e), file=sys.stderr)
            time.sleep(30)
        _tunel['url'] = None
        time.sleep(5)


# ===== TELEGRAM: alertas al bot de SuitChatTG (token en SuitChatTG/.env) =====
def _tg_token():
    env = (os.environ.get('TELEGRAM_BOT_TOKEN') or '').strip()
    if env:
        return env
    try:
        with open(TG_ENV_PATH, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('TELEGRAM_BOT_TOKEN='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    except OSError:
        pass
    return ''


def _senales_load():
    try:
        with open(SENALES_PATH, encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return {'chat_id': None, 'items': []}


def _senales_save(db):
    try:
        with open(SENALES_PATH, 'w', encoding='utf-8') as f:
            json.dump(db, f, ensure_ascii=False, indent=1)
    except OSError as e:
        print('[TG] no pude guardar senales.json: ' + str(e), file=sys.stderr)


def _tg_chat_id(db):
    """chat_id persistido en senales.json; si no, lo descubre via SuitChatTG (/api/sessions)."""
    if db.get('chat_id'):
        return str(db['chat_id'])
    try:
        s = http_json('http://127.0.0.1:3011/api/sessions', timeout=3)
        ses = (s or {}).get('sesiones') or {}
        if ses:
            cid = str(next(iter(ses)))
            db['chat_id'] = cid
            _senales_save(db)
            return cid
    except Exception:
        pass
    return None


def tg_alerta(texto, meta=None):
    """Registra la alerta en senales.json (max 50) e intenta enviarla a Telegram.
    Best-effort: sin token/chat_id solo queda registrada como 'local'."""
    db = _senales_load()
    item = {
        'ts': datetime.now(ZoneInfo('America/New_York')).isoformat(timespec='minutes'),
        'texto': texto,
        'meta': meta or {},
        'tg': False,
    }
    token = _tg_token()
    cid = _tg_chat_id(db)
    if token and cid:
        try:
            req = urllib.request.Request(
                'https://api.telegram.org/bot' + token + '/sendMessage',
                data=json.dumps({'chat_id': cid, 'text': texto}).encode('utf-8'),
                headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=8) as r:
                item['tg'] = bool(json.loads(r.read().decode('utf-8')).get('ok'))
        except Exception as e:
            print('[TG] envio fallo: ' + str(e), file=sys.stderr)
    db['items'] = ([item] + list(db.get('items') or []))[:50]
    _senales_save(db)
    return item


# ===== ALERTA 3: toast de Windows para senales nuevas confirmadas (vol >=1.5x) =====
# Corre en hilo daemon: solo en ventana post-cierre NY (16:10 ET, lun-vie), cada 15 min.
# ASCII puro en el texto (evita problemas de encoding en -Command de PowerShell).
def _windows_alert(title, body):
    ps = (
        "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;"
        "$t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);"
        "$n = $t.GetElementsByTagName('text');"
        "$n.Item(0).AppendChild($t.CreateTextNode('" + title + "')) | Out-Null;"
        "$n.Item(1).AppendChild($t.CreateTextNode('" + body + "')) | Out-Null;"
        "$toast = [Windows.UI.Notifications.ToastNotification]::new($t); $toast.Tag = 'suitmarket';"
        "try { [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe').Show($toast) }"
        "catch { };"
        "[System.Media.SystemSounds]::Exclamation.Play();"
        "Start-Sleep -Seconds 1"
    )
    try:
        import subprocess
        r = subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
                           capture_output=True, timeout=20, creationflags=0x08000000)  # CREATE_NO_WINDOW
        if r.returncode == 0:
            return True
    except Exception as e:
        print(f'[ALERT] toast fallo: {e}', file=sys.stderr)
    # fallback: balloon de NotifyIcon (siempre disponible en Win10/11)
    try:
        import subprocess
        ps2 = ("Add-Type -AssemblyName System.Windows.Forms;"
               "$n = New-Object System.Windows.Forms.NotifyIcon;"
               "$n.Icon = [System.Drawing.SystemIcons]::Information;"
               "$n.Visible = $true; $n.ShowBalloonTip(8000, '" + title + "', '" + body + "', 'Info');"
               "Start-Sleep -Seconds 9; $n.Dispose();")
        subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps2],
                       capture_output=True, timeout=25, creationflags=0x08000000)
        return True
    except Exception as e:
        print(f'[ALERT] balloon fallo: {e}', file=sys.stderr)
        return False


_alert_notified = set()
_estado_sent = {}         # 'sym|fecha' -> ultimo estado notificado (objetivo/invalidada)
ALERT_TICK = 900          # 15 min
ALERT_TTL_KEYS = 200      # corte de memoria del set


def _alert_loop():
    """Hilo daemon: post-cierre NY (16:10 ET lun-vie) revisa senales cada 15 min y
    avisa SOLO de las nuevas confirmadas por volumen. get_signals respeta su cache de
    1h -> como maximo 1 escaneo Yahoo real por hora dentro de la ventana."""
    time.sleep(25)  # dejar que el server termine de arrancar
    while True:
        try:
            et = datetime.now(ZoneInfo('America/New_York'))
            in_window = et.weekday() < 5 and (et.hour > 16 or (et.hour == 16 and et.minute >= 10))
            if in_window:
                for s in get_signals():
                    key = s.get('sym', '?') + '|' + s.get('fecha', '?')
                    # salida: avisar cuando alcance objetivo o toque stop (solo si la
                    # entrada se notifico = volOK). Un aviso por estado, no cada 15 min.
                    if s.get('volOK') and s.get('estado') in ('objetivo', 'invalidada'):
                        if _estado_sent.get(key) != s.get('estado'):
                            _estado_sent[key] = s.get('estado')
                            if len(_estado_sent) > ALERT_TTL_KEYS:
                                _estado_sent.clear()
                            if s['estado'] == 'objetivo':
                                titulo = 'SuitMarket - OBJETIVO ALCANZADO: ' + str(s.get('sym'))
                                cuerpo = ('vender en ' + str(s.get('target')) + ' | +' + str(s.get('pnl')) + '%'
                                          + ' | entrada ' + str(s.get('entrada')) + ' | R:R ' + str(s.get('rrr')))
                            else:
                                titulo = 'SuitMarket - STOP TOCADO: ' + str(s.get('sym'))
                                cuerpo = ('salir en ' + str(s.get('stop')) + ' | ' + str(s.get('pnl')) + '%'
                                          + ' | entrada ' + str(s.get('entrada')))
                            _windows_alert(titulo, cuerpo)
                            tg_alerta(titulo + '\n' + cuerpo,
                                      {'sym': s.get('sym'), 'fecha': s.get('fecha'),
                                       'estado': s.get('estado'), 'origen': 'suitmarket'})
                    if key in _alert_notified:
                        continue
                    _alert_notified.add(key)
                    if len(_alert_notified) > ALERT_TTL_KEYS:
                        _alert_notified.clear()  # set chico; re-notificar tras corte es aceptable
                    if s.get('volOK'):
                        titulo = 'SuitMarket - Entrada confirmada: ' + str(s.get('sym'))
                        cuerpo = ('rompio ' + str(s.get('rompe')) + ' | vol ' + str(s.get('volRatio')) + 'x'
                                  + ' | R:R ' + str(s.get('rrr')) + ' | diario'
                                  + ' | entrada ' + str(s.get('entrada'))
                                  + ' | objetivo ' + str(s.get('target')) + ' (vender)'
                                  + ' | stop ' + str(s.get('stop')))
                        _windows_alert(titulo, cuerpo)
                        tg_alerta(titulo + '\n' + cuerpo,
                                  {'sym': s.get('sym'), 'fecha': s.get('fecha'),
                                   'vol': s.get('volRatio'), 'rrr': s.get('rrr'), 'origen': 'suitmarket'})
        except Exception as e:
            print(f'[ALERT] ciclo fallo: {e}', file=sys.stderr)
        time.sleep(ALERT_TICK)


def start_alert_thread():
    t = threading.Thread(target=_alert_loop, daemon=True)
    t.start()
    return t

# ===== Screener Yahoo (gainers/losers del dia, con marketCap) — para SuitBoard =====
_screener_cache = {}  # scrId -> {ts, data}
TTL_SCREENER = 600


def get_screener(scr, count=25):
    cached = _screener_cache.get(scr)
    if cached and time.time() - cached['ts'] < TTL_SCREENER:
        return cached['data']
    url = (f'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved'
           f'?scrIds={urllib.parse.quote(scr)}&count={max(5, min(int(count), 25))}&lang=en-US&region=US&formatted=false')
    # Yahoo screener es lento en frio (8-15s) — timeout amplio + un reintento
    last = None
    for attempt in range(2):
        try:
            j = http_json(url, timeout=20)
            quotes = (j.get('finance', {}).get('result') or [{}])[0].get('quotes') or []
            out = [{
                'symbol': q.get('symbol'),
                'name': q.get('shortName') or q.get('longName') or q.get('symbol'),
                'price': q.get('regularMarketPrice'),
                'changePct': q.get('regularMarketChangePercent'),
                'marketCap': q.get('marketCap'),
            } for q in quotes if q.get('symbol')]
            if out:
                _screener_cache[scr] = {'ts': time.time(), 'data': out}
                return out
        except Exception as e:
            last = e
    print(f'[SCREENER] {scr} fallo tras reintento: {last}', file=sys.stderr)
    if cached:                     # cache vencida mejor que nada
        return cached['data']
    raise (last or RuntimeError('screener vacio'))

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # silencioso: un line por fetch se imprime desde el dominio

    def _send(self, obj, code=200):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')  # SuitBoard (file://) consume gainers/quotes
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path == '/':
            try:
                with open(INDEX_PATH, 'rb') as f:
                    body = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(body)
            except OSError:
                self._send({'error': 'index.html no encontrado'}, 500)
            return
        if path == '/api/market/quotes':
            qs = urllib.parse.parse_qs(parsed.query)
            symbols = [s.strip() for s in (qs.get('symbols') or [''])[0].split(',') if s.strip()]
            if not symbols:
                return self._send({'error': 'symbols requerido'}, 400)
            quotes = [q for q in (get_quote(s) for s in symbols) if q]
            return self._send(quotes)
        if path == '/api/market/movers':
            return self._send(get_movers())
        if path == '/api/market/news':
            try:
                return self._send(get_news())
            except Exception as e:
                return self._send({'error': str(e)}, 500)
        if path == '/api/market/signals':
            try:
                return self._send(get_signals())
            except Exception as e:
                return self._send({'error': str(e)}, 500)
        if path == '/api/market/screener':
            qs2 = urllib.parse.parse_qs(parsed.query)
            scr = (qs2.get('scr') or ['day_gainers'])[0]
            cnt = (qs2.get('count') or ['25'])[0]
            try:
                return self._send(get_screener(scr, cnt))
            except Exception as e:
                return self._send({'error': str(e)}, 500)
        if path == '/api/market/senales':
            try:
                return self._send(_senales_load())
            except Exception as e:
                return self._send({'error': str(e)}, 500)
        if path == '/api/market/webhook-url':
            return self._send({'url': _tunel.get('url'),
                               'local': 'http://127.0.0.1:' + str(PORT) + '/api/market/webhook'})
        if path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        self._send({'error': 'not found'}, 404)

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if path == '/api/market/senales/test':
            try:
                item = tg_alerta('SuitMarket - prueba de alerta ' + time.strftime('%H:%M:%S'),
                                 {'origen': 'test'})
                return self._send({'ok': True, 'tg_enviado': bool(item.get('tg'))})
            except Exception as e:
                return self._send({'error': str(e)}, 500)
        # Webhook de TradingView (JSON o texto plano en el body de la alerta)
        if path in ('/api/market/webhook', '/webhook/tv'):
            try:
                n = int(self.headers.get('Content-Length') or 0)
                txt = (self.rfile.read(n) if n else b'').decode('utf-8', 'replace')
                meta = {'origen': 'tradingview'}
                try:
                    d = json.loads(txt)
                    if isinstance(d, dict):
                        partes = []
                        for k in ('accion', 'action', 'sym', 'symbol', 'ticker',
                                  'precio', 'price', 'mensaje', 'message', 'msg'):
                            if d.get(k) is not None:
                                partes.append(str(k) + '=' + str(d[k]))
                        texto = 'TradingView - ' + (' | '.join(partes) if partes else txt[:200])
                        meta['sym'] = str(d.get('sym') or d.get('symbol') or d.get('ticker') or '')
                        meta['precio'] = d.get('precio') if d.get('precio') is not None else d.get('price')
                    else:
                        texto = 'TradingView - ' + str(d)[:200]
                except ValueError:
                    texto = 'TradingView - ' + (txt[:200] or '(vacio)')
                item = tg_alerta(texto, meta)
                return self._send({'ok': True, 'tg': bool(item.get('tg'))})
            except Exception as e:
                return self._send({'error': str(e)}, 500)
        self._send({'error': 'not found'}, 404)

if __name__ == '__main__':
    src = f'Twelve Data (key {"OK, budget " + str(TD_BUDGET) + "/dia" if TD_KEY else "sin key — deshabilitado"})'
    print(f'SuitMarket API :{PORT} — fuentes: {src} + Yahoo (fallback/commodities/news/signals)')
    print(f'Caché: TD {TTL_TD}s · Yahoo {TTL_YAHOO}s · movers {TTL_MOVERS}s · news {TTL_NEWS}s · signals {TTL_SIGNALS}s')
    print('Alerta: ON — ventana post-cierre NY (16:10 ET lun-vie), cada 15 min, solo senales confirmadas (vol)')
    start_alert_thread()
    threading.Thread(target=_tunel_loop, daemon=True, name='tunel').start()
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
