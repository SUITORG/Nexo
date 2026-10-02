# -*- coding: utf-8 -*-
"""Switch de IA de SuitCVLO-open.

Cadena (inmutable, ver docs/CONTRATO.md):
    ollama (local, VLM) -> huggingface (nube, gratis) -> deepseek (nube, 5M tokens gratis al registrar)
    -> openrouter (nube, gratis) -> gemini (nube)

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

ORDEN = ('colab', 'ollama', 'huggingface', 'deepseek', 'openrouter', 'gemini')
FALLOS_PARA_BLOQUEO = 3
COOLDOWN_S = 300
TTL_MODELOS_S = 3600

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_CARGADO = False
_ENV_MTIME = -1
_CB = {}          # proveedor -> {'fallos': int, 'hasta': float}
_CACHE = {'t': 0.0, 't_hf': 0.0, 'openrouter': None, 'huggingface': None}

# eslabón `colab`: el notebook carga el modelo de visión y lo registra aquí (GPU gratis)
VLM_FN = None
VLM_NOMBRE = ''


# ---------------------------------------------------------------- entorno
def _env(nombre, defecto=''):
    """Lee el .env del proyecto (manda sobre el entorno). Se recarga solo si cambia el archivo:
    puedes pegar una key y el siguiente request la usa, sin reiniciar."""
    global _ENV_CARGADO, _ENV_MTIME
    ruta = os.path.join(_BASE, '.env')
    try:
        mtime = os.path.getmtime(ruta) if os.path.exists(ruta) else 0
    except OSError:
        mtime = 0
    if (not _ENV_CARGADO) or mtime != _ENV_MTIME:
        _ENV_MTIME = mtime
        _ENV_CARGADO = True
        if mtime:
            for linea in open(ruta, encoding='utf-8', errors='replace'):
                linea = linea.strip()
                if not linea or linea.startswith('#') or '=' not in linea:
                    continue
                k, v = linea.split('=', 1)
                os.environ[k.strip()] = v.strip()      # el .env del proyecto manda sobre el entorno
    return os.environ.get(nombre) or defecto


_env('OLLAMA_URL')   # carga el .env del proyecto al importar (antes de cualquier petición)


def en_mock():
    return _env('CVLO_MOCK') == '1'


# ---------------------------------------------------------------- http
def _http(url, payload=None, headers=None, timeout=120):
    datos = json.dumps(payload).encode('utf-8') if payload is not None else None
    h = {'Content-Type': 'application/json'} if datos else {}
    h.update(headers or {})
    req = urllib.request.Request(url, data=datos, headers=h,
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
    if p == 'colab':
        return (True, 'ok') if VLM_FN else (False, 'sin modelo cargado (ejecuta la celda del modelo)')
    if p == 'ollama':
        try:
            _http(_env('OLLAMA_URL', 'http://127.0.0.1:11434') + '/api/tags', timeout=3)
            return True, 'ok'
        except Exception as e:
            return False, 'ollama caído ({})'.format(str(e)[:60])
    if p == 'huggingface':
        return (True, 'ok') if (_env('HF_TOKEN') or _env('HUGGINGFACE_API_KEY')) \
            else (False, 'sin HF_TOKEN')
    if p == 'deepseek':
        return (True, 'ok') if _env('DEEPSEEK_API_KEY') else (False, 'sin DEEPSEEK_API_KEY')
    if p == 'openrouter':
        return (True, 'ok') if _env('OPENROUTER_API_KEY') else (False, 'sin OPENROUTER_API_KEY')
    if p == 'gemini':
        return (True, 'ok') if _env('GEMINI_API_KEY') else (False, 'sin GEMINI_API_KEY')
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
                       'detalle': tam, 'bytes': m.get('size') or 0})
    return salida


def _openrouter_modelos():
    if _CACHE['openrouter'] is not None and time.time() - _CACHE['t'] < TTL_MODELOS_S:
        return _CACHE['openrouter']
    items = []
    clave = _env('OPENROUTER_API_KEY')
    if not clave:
        _CACHE['openrouter'] = None    # sin key: no cachear, para que al pegarla se consulte ya
        return items
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


_CLAVES_VISION = ('vl', 'vision', 'llava', 'gemma-3', 'pixtral', 'internvl', 'ernie-4.5')


def _huggingface_modelos():
    """Modelos con visión del router de HuggingFace (TTL 1 h)."""
    if _CACHE['huggingface'] is not None and time.time() - _CACHE['t_hf'] < TTL_MODELOS_S:
        return _CACHE['huggingface']
    items = []
    clave = _env('HF_TOKEN') or _env('HUGGINGFACE_API_KEY')
    if clave:
        try:
            j = _http('https://router.huggingface.co/v1/models',
                      headers={'Authorization': 'Bearer ' + clave}, timeout=25)
            for m in j.get('data') or []:
                mid = m.get('id') or ''
                if any(k in mid.lower() for k in _CLAVES_VISION):
                    items.append({'id': mid, 'nombre': '{} (nube)'.format(mid),
                                  'proveedor': 'huggingface', 'local': False,
                                  'vision': True, 'detalle': 'HF'})
        except Exception:
            items = []
    _CACHE['huggingface'] = items[:20]
    _CACHE['t_hf'] = time.time()
    return _CACHE['huggingface']


def registrar_vlm(fn, nombre='modelo-local (GPU)'):
    """El notebook carga el modelo de visión y lo registra: entra como primer eslabón."""
    global VLM_FN, VLM_NOMBRE
    VLM_FN, VLM_NOMBRE = fn, nombre
    return nombre


def modelos():
    """Todos los modelos conocidos. Los locales llevan '(local)' en el nombre."""
    items = []
    if VLM_FN:
        items.append({'id': VLM_NOMBRE, 'nombre': '{} (local)'.format(VLM_NOMBRE),
                      'proveedor': 'colab', 'local': True, 'vision': True, 'detalle': 'GPU Colab'})
    items += _ollama_modelos()
    items += _huggingface_modelos()
    if _env('DEEPSEEK_API_KEY'):
        m = _env('DEEPSEEK_VISION_MODEL', 'deepseek-flash')
        items.append({'id': m, 'nombre': '{} (nube)'.format(m), 'proveedor': 'deepseek',
                      'local': False, 'vision': True, 'detalle': '5M tokens gratis'})
    items += _openrouter_modelos()
    if _env('GEMINI_API_KEY'):
        items.append({'id': _env('GEMINI_VISION_MODEL', 'gemini-2.5-flash'),
                      'nombre': '{} (nube)'.format(_env('GEMINI_VISION_MODEL', 'gemini-2.5-flash')),
                      'proveedor': 'gemini', 'local': False, 'vision': True, 'detalle': 'Google'})
    return items


def _elegir(proveedor, modelo):
    if not _pertece(proveedor, modelo):
        modelo = None            # modelo ajeno al proveedor -> usa el default del proveedor
    if proveedor == 'colab':
        return modelo or VLM_NOMBRE
    if proveedor == 'ollama':
        if modelo:
            return modelo
        vlm = _env('CVLO_VLM')
        if vlm:
            return vlm
        # sin CVLO_VLM: el modelo con visión más liviano (arranca más rápido)
        candidatos = [m for m in _ollama_modelos() if m['vision']]
        if candidatos:
            return min(candidatos, key=lambda m: m.get('bytes') or 1 << 62)['id']
        raise RuntimeError('Ollama sin modelos con visión (instala: ollama pull qwen3.5)')
    if proveedor == 'huggingface':
        if modelo:
            return modelo
        por_defecto = _env('HF_VISION_MODEL')
        if por_defecto:
            return por_defecto
        # preferencia: mejor OCR para letreros, si está disponible en el router
        ids = [m['id'] for m in _huggingface_modelos()]
        for pref in ('Qwen/Qwen2.5-VL-72B-Instruct', 'Qwen/Qwen3-VL-30B-A3B-Instruct',
                     'google/gemma-3-12b-it'):
            if pref in ids:
                return pref
        return ids[0] if ids else 'Qwen/Qwen2.5-VL-72B-Instruct'
    if proveedor == 'deepseek':
        return modelo or _env('DEEPSEEK_VISION_MODEL', 'deepseek-flash')
    if proveedor == 'openrouter':
        if modelo:
            return modelo
        libre = _env('OPENROUTER_VISION_MODEL')
        if libre:
            return libre
        ids = [m['id'] for m in _openrouter_modelos()]
        # preferencia: mejor OCR en español, si está en el tier gratis
        for pref in ('deepseek/deepseek-v4-flash:free', 'google/gemma-4-26b-a4b-it:free',
                     'nvidia/nemotron-nano-12b-v2-vl:free', 'openrouter/free'):
            if pref in ids:
                return pref
        if ids:
            return ids[0]
        raise RuntimeError('OpenRouter sin modelos gratis con visión')
    if proveedor == 'gemini':
        return modelo or _env('GEMINI_VISION_MODEL', 'gemini-2.5-flash')
    return ''


def _pertece(proveedor, modelo):
    """¿El modelo pedido pertenece a este proveedor? Evita mandar 'deepseek-flash' a Ollama."""
    if not modelo:
        return False
    if proveedor == 'colab':
        return bool(VLM_FN) and modelo in (VLM_NOMBRE, 'colab')
    if proveedor == 'ollama':
        return any(m['id'] == modelo for m in _ollama_modelos())
    if proveedor == 'huggingface':
        return any(m['id'] == modelo for m in _huggingface_modelos())
    if proveedor == 'deepseek':
        return modelo == _env('DEEPSEEK_VISION_MODEL', 'deepseek-flash')
    if proveedor == 'openrouter':
        return any(m['id'] == modelo for m in _openrouter_modelos())
    if proveedor == 'gemini':
        return str(modelo).startswith('gemini')
    return False


def reset():
    """Nueva corrida: borra los cooldowns heredados de la corrida anterior."""
    _CB.clear()


# ---------------------------------------------------------------- lectores
def _colab(ruta, prompt, modelo):
    if not VLM_FN:
        raise RuntimeError('Modelo de Colab no cargado (ejecuta la celda "Cargar modelo")')
    return (VLM_FN(ruta, prompt) or '').strip()


def _ollama(ruta, prompt, modelo):
    url = _env('OLLAMA_URL', 'http://127.0.0.1:11434') + '/api/chat'
    payload = {'model': _elegir('ollama', modelo), 'stream': False,
               'messages': [{'role': 'user', 'content': prompt, 'images': [_b64(ruta)]}],
               'options': {'temperature': 0.1}}
    # CPU solo: una inferencia a la vez tarda ~6-7 min; en paralelo se pasa del tiempo.
    j = _http(url, payload, timeout=float(_env('OLLAMA_TIMEOUT_S', '900')))
    return ((j.get('message') or {}).get('content') or '').strip()


def _huggingface(ruta, prompt, modelo):
    clave = _env('HF_TOKEN') or _env('HUGGINGFACE_API_KEY')
    payload = {'model': _elegir('huggingface', modelo),
               'messages': [{'role': 'user', 'content': [
                   {'type': 'text', 'text': prompt},
                   {'type': 'image_url',
                    'image_url': {'url': 'data:image/jpeg;base64,' + _b64(ruta)}}]}]}
    j = _http('https://router.huggingface.co/v1/chat/completions', payload,
              headers={'Authorization': 'Bearer ' + clave}, timeout=300)
    return ((j.get('choices') or [{}])[0].get('message') or {}).get('content') or ''


def _deepseek(ruta, prompt, modelo):
    clave = _env('DEEPSEEK_API_KEY')
    payload = {'model': _elegir('deepseek', modelo),
               'messages': [{'role': 'user', 'content': [
                   {'type': 'text', 'text': prompt},
                   {'type': 'image_url',
                    'image_url': {'url': 'data:image/jpeg;base64,' + _b64(ruta)}}]}]}
    j = _http('https://api.deepseek.com/chat/completions', payload,
              headers={'Authorization': 'Bearer ' + clave}, timeout=240)
    return ((j.get('choices') or [{}])[0].get('message') or {}).get('content') or ''


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


_LEEME = {'colab': _colab, 'ollama': _ollama, 'huggingface': _huggingface, 'deepseek': _deepseek,
          'openrouter': _openrouter, 'gemini': _gemini}


# ---------------------------------------------------------------- cascade
def leer(ruta, prompt, proveedor='auto', modelo=None, log=None):
    """Lee una foto. `proveedor` = 'auto' (cadena) o uno de ORDEN."""
    def nota(msg):
        (log or (lambda _m: None))(msg)

    # proveedor forzado: si falla, sigo con el resto (invariante: no cortar la corrida)
    if proveedor in (None, '', 'auto'):
        orden = ORDEN
    else:
        orden = (proveedor,) + tuple(p for p in ORDEN if p != proveedor)
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
            if proveedor not in (None, '', 'auto') and p == proveedor and len(orden) > 1:
                nota('[ia] {} agotado → sigo con el resto de la cadena'.format(p))
    raise RuntimeError('Sin proveedor IA disponible -> ' + ' | '.join(errores))
