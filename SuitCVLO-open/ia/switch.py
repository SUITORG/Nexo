# -*- coding: utf-8 -*-
"""Switch de IA de SuitCVLO-open.

Cadena (inmutable, ver docs/CONTRATO.md):
    ollama (local, VLM) -> openrouter (nube, gratis) -> gemini (nube) -> autoclaw (servicio local -> nube)

- `modelos()` lista los modelos disponibles; los de Ollama salen con sufijo `(local)`.
- `leer(ruta, prompt)` baja por la cadena hasta que un proveedor responde.
- Circuito breaker: 3 fallos seguidos -> 5 min de cooldown por proveedor.
- Sin claves en el código: todo por variables de entorno o `.env` del proyecto.
"""
import base64
import io
import json
import os
import time
import urllib.error
import urllib.request

ORDEN = ('ollama', 'openrouter', 'gemini', 'autoclaw')
FALLOS_PARA_BLOQUEO = 3
COOLDOWN_S = 300
TTL_MODELOS_S = 3600

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_CARGADO = False
_CB = {}          # proveedor -> {'fallos': int, 'hasta': float}
_CACHE = {'t': 0.0, 'openrouter': None}


# ---------------------------------------------------------------- entorno
def _env(nombre, defecto=''):
    global _ENV_CARGADO
    if not _ENV_CARGADO:
        ruta = os.path.join(_BASE, '.env')
        if os.path.exists(ruta):
            for linea in open(ruta, encoding='utf-8', errors='replace'):
                linea = linea.strip()
                if not linea or linea.startswith('#') or '=' not in linea:
                    continue
                k, v = linea.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())
        _ENV_CARGADO = True
    return os.environ.get(nombre) or defecto


def en_mock():
    return _env('CVLO_MOCK') == '1'


# ---------------------------------------------------------------- http
def _http(url, payload=None, headers=None, timeout=120):
    datos = json.dumps(payload).encode('utf-8') if payload is not None else None
    req = urllib.request.Request(url, data=datos, headers=headers or {},
                                 method='POST' if datos else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            cuerpo = r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode('utf-8', 'replace')[:400]
        raise RuntimeError('HTTP {}: {}'.format(e.code, cuerpo))
    return json.loads(cuerpo) if cuerpo.strip() else {}


# ---------------------------------------------------------------- circuit breaker
def _bloqueado(p):
    d = _CB.get(p) or {}
    return time.time() < float(d.get('hasta') or 0)


def _fallo(p):
    d = _CB.setdefault(p, {'fallos': 0, 'hasta': 0})
    d['fallos'] += 1
    if d['fallos'] >= FALLOS_PARA_BLOQUEO:
        d['hasta'] = time.time() + COOLDOWN_S
        d['fallos'] = 0


def _ok(p):
    if p in _CB:
        _CB[p] = {'fallos': 0, 'hasta': 0}


def estado():
    """[{proveedor, disponible, motivo, cooldown_s}] para la UI."""
    salida = []
    for p in ORDEN:
        disp, motivo = _disponible(p)
        d = _CB.get(p) or {}
        resto = max(0, int(float(d.get('hasta') or 0) - time.time()))
        if resto:
            disp, motivo = False, 'cooldown {} s'.format(resto)
        salida.append({'proveedor': p, 'disponible': disp, 'motivo': motivo})
    return salida


def _disponible(p):
    if p == 'ollama':
        try:
            _http(_env('OLLAMA_URL', 'http://127.0.0.1:11434') + '/api/tags', timeout=3)
            return True, 'ok'
        except Exception as e:
            return False, 'ollama caído ({})'.format(str(e)[:60])
    if p == 'openrouter':
        return (True, 'ok') if _env('OPENROUTER_API_KEY') else (False, 'sin OPENROUTER_API_KEY')
    if p == 'gemini':
        return (True, 'ok') if _env('GEMINI_API_KEY') else (False, 'sin GEMINI_API_KEY')
    if p == 'autoclaw':
        try:
            import motor
            return (True, 'ok') if motor.token_disponible() else (False, 'AutoClaw sin token')
        except Exception as e:
            return False, 'AutoClaw caído ({})'.format(str(e)[:60])
    return False, 'proveedor desconocido'


# ---------------------------------------------------------------- imagen
def _b64(ruta):
    try:
        import pillow_heif
        pillow_heif.register_heif_opener()
    except Exception:
        pass
    from PIL import Image
    im = Image.open(ruta).convert('RGB')
    im.thumbnail((1600, 1600))
    buf = io.BytesIO()
    im.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode('ascii')


# ---------------------------------------------------------------- modelos
def _ollama_modelos():
    try:
        j = _http(_env('OLLAMA_URL', 'http://127.0.0.1:11434') + '/api/tags', timeout=6)
    except Exception:
        return []
    salida = []
    for m in j.get('models') or []:
        caps = m.get('capabilities') or []
        tam = (m.get('details') or {}).get('parameter_size') or ''
        salida.append({'id': m.get('name'), 'nombre': '{} (local)'.format(m.get('name')),
                       'proveedor': 'ollama', 'local': True, 'vision': 'vision' in caps,
                       'detalle': tam})
    return salida


def _openrouter_modelos():
    if _CACHE['openrouter'] is not None and time.time() - _CACHE['t'] < TTL_MODELOS_S:
        return _CACHE['openrouter']
    items = []
    clave = _env('OPENROUTER_API_KEY')
    if clave:
        try:
            j = _http('https://openrouter.ai/api/v1/models',
                      headers={'Authorization': 'Bearer ' + clave}, timeout=25)
            for m in j.get('data') or []:
                ar = m.get('architecture') or {}
                modal = ar.get('input_modalities') or []
                precio = (m.get('pricing') or {}).get('prompt')
                if 'image' in modal and str(precio) in ('0', '0.0'):
                    items.append({'id': m.get('id'), 'nombre': m.get('name') or m.get('id'),
                                  'proveedor': 'openrouter', 'local': False, 'vision': True,
                                  'detalle': 'gratis'})
        except Exception:
            items = []
    _CACHE['openrouter'] = items
    _CACHE['t'] = time.time()
    return items


def modelos():
    """Todos los modelos conocidos. Los locales llevan '(local)' en el nombre."""
    items = _ollama_modelos() + _openrouter_modelos()
    if _env('GEMINI_API_KEY'):
        items.append({'id': _env('GEMINI_VISION_MODEL', 'gemini-2.5-flash'),
                      'nombre': '{} (nube)'.format(_env('GEMINI_VISION_MODEL', 'gemini-2.5-flash')),
                      'proveedor': 'gemini', 'local': False, 'vision': True, 'detalle': 'Google'})
    disp, motivo = _disponible('autoclaw')
    items.append({'id': 'autoglm', 'nombre': 'AutoGLM (AutoClaw)', 'proveedor': 'autoclaw',
                  'local': False, 'vision': True, 'detalle': motivo if not disp else 'ok'})
    return items


def _elegir(proveedor, modelo):
    if proveedor == 'ollama':
        if modelo:
            return modelo
        vlm = _env('CVLO_VLM')
        if vlm:
            return vlm
        for m in _ollama_modelos():
            if m['vision']:
                return m['id']
        raise RuntimeError('Ollama sin modelos con visión (instala: ollama pull qwen3.5)')
    if proveedor == 'openrouter':
        if modelo:
            return modelo
        libre = _env('OPENROUTER_VISION_MODEL')
        if libre:
            return libre
        for m in _openrouter_modelos():
            return m['id']
        raise RuntimeError('OpenRouter sin modelos gratis con visión')
    if proveedor == 'gemini':
        return modelo or _env('GEMINI_VISION_MODEL', 'gemini-2.5-flash')
    return ''


# ---------------------------------------------------------------- lectores
def _ollama(ruta, prompt, modelo):
    url = _env('OLLAMA_URL', 'http://127.0.0.1:11434') + '/api/chat'
    payload = {'model': _elegir('ollama', modelo), 'stream': False,
               'messages': [{'role': 'user', 'content': prompt, 'images': [_b64(ruta)]}],
               'options': {'temperature': 0.1}}
    j = _http(url, payload, timeout=600)
    return ((j.get('message') or {}).get('content') or '').strip()


def _openrouter(ruta, prompt, modelo):
    clave = _env('OPENROUTER_API_KEY')
    payload = {'model': _elegir('openrouter', modelo),
               'messages': [{'role': 'user', 'content': [
                   {'type': 'text', 'text': prompt},
                   {'type': 'image_url',
                    'image_url': {'url': 'data:image/jpeg;base64,' + _b64(ruta)}}]}]}
    j = _http('https://openrouter.ai/api/v1/chat/completions', payload,
              headers={'Authorization': 'Bearer ' + clave}, timeout=240)
    return ((j.get('choices') or [{}])[0].get('message') or {}).get('content') or ''


def _gemini(ruta, prompt, modelo):
    clave = _env('GEMINI_API_KEY')
    m = _elegir('gemini', modelo)
    payload = {'contents': [{'parts': [{'text': prompt},
                                       {'inline_data': {'mime_type': 'image/jpeg',
                                                        'data': _b64(ruta)}}]}],
               'generationConfig': {'temperature': 0.1}}
    url = ('https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}'
           .format(m, clave))
    j = _http(url, payload, timeout=180)
    partes = (((j.get('candidates') or [{}])[0].get('content') or {}).get('parts') or [])
    return ''.join(p.get('text', '') for p in partes).strip()


def _autoclaw(ruta, prompt, modelo):
    import motor
    chico = os.path.join(_env('CVLO_TRABAJO') or os.path.join(_BASE, 'trabajo'),
                         'tmp_ia_' + os.path.basename(ruta) + '.jpg')
    os.makedirs(os.path.dirname(chico), exist_ok=True)
    from PIL import Image
    im = Image.open(ruta).convert('RGB')
    im.thumbnail((1600, 1600))
    im.save(chico, quality=85)
    return motor.reconocer(motor.subir_imagen(chico), prompt)


_LEEME = {'ollama': _ollama, 'openrouter': _openrouter, 'gemini': _gemini, 'autoclaw': _autoclaw}


# ---------------------------------------------------------------- cascade
def leer(ruta, prompt, proveedor='auto', modelo=None, log=None):
    """Lee una foto. `proveedor` = 'auto' (cadena) o uno de ORDEN."""
    def nota(msg):
        (log or (lambda _m: None))(msg)

    orden = ORDEN if proveedor in (None, '', 'auto') else (proveedor,)
    errores = []
    for p in orden:
        if p not in _LEEME:
            errores.append('{}: proveedor desconocido'.format(p))
            continue
        if _bloqueado(p):
            errores.append('{}: en cooldown'.format(p))
            continue
        disp, motivo = _disponible(p)
        if not disp:
            errores.append('{}: {}'.format(p, motivo))
            continue
        try:
            nota('[ia] probando {}...'.format(p))
            texto = _LEEME[p](ruta, prompt, modelo)
            if texto:
                _ok(p)
                nota('[ia] {} respondió ({} caracteres)'.format(p, len(texto)))
                return texto
            raise RuntimeError('respuesta vacía')
        except Exception as e:
            _fallo(p)
            errores.append('{}: {}'.format(p, str(e)[:160]))
            nota('[ia] {} falló: {}'.format(p, str(e)[:160]))
    raise RuntimeError('Sin proveedor IA disponible -> ' + ' | '.join(errores))
