# -*- coding: utf-8 -*-
"""Utilidades del CVLO Auditor: archivos, zip seguro, nombres."""
import csv
import os
import re
import zipfile

EXTENSIONES_IMAGEN = {'.jpg', '.jpeg', '.png', '.webp', '.heic'}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # carpeta del proyecto


def es_imagen(nombre):
    return os.path.splitext(nombre)[1].lower() in EXTENSIONES_IMAGEN


def nombre_limpio(nombre):
    return os.path.basename(str(nombre).replace('\\', '/')).strip()


def extraer_zip_seguro(ruta_zip, destino):
    """Extrae SOLO imágenes del ZIP hacia ``destino`` (anti zip-slip: solo nombre base)."""
    os.makedirs(destino, exist_ok=True)
    extraidos = []
    with zipfile.ZipFile(ruta_zip) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            nombre = nombre_limpio(info.filename)
            if not nombre or nombre.startswith('__') or nombre.startswith('._') or nombre.startswith('.'):
                continue
            if not es_imagen(nombre):
                continue
            ruta = os.path.join(destino, nombre)
            with z.open(info) as origen, open(ruta, 'wb') as salida:
                salida.write(origen.read())
            extraidos.append(ruta)
    return extraidos


def ruta_libre(destino, nombre):
    base, ext = os.path.splitext(nombre)
    candidata = os.path.join(destino, nombre)
    i = 2
    while os.path.exists(candidata):
        candidata = os.path.join(destino, '{} ({}){}'.format(base, i, ext))
        i += 1
    return candidata


def carpeta_libre(raiz, nombre):
    candidata = os.path.join(raiz, nombre)
    i = 2
    while os.path.exists(candidata):
        candidata = os.path.join(raiz, '{} ({})'.format(nombre, i))
        i += 1
    return candidata


def ordenar_por_nombre(rutas):
    return sorted(rutas, key=lambda p: os.path.basename(p).lower())


def sanear_nombre(nombre, defecto='lote'):
    nombre = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', str(nombre or '')).strip().strip('.')
    return nombre or defecto


def sanear_carpeta(nombre, defecto='OTROS'):
    """Sanea para nombre de carpeta (cambia / y \\ por -)."""
    nombre = re.sub(r'[\\/:*?"<>|\x00-\x1f]', '-', str(nombre or '')).strip().strip('.')
    return nombre or defecto


def leer_texto_auto(ruta):
    """Lee un texto tolerando codificaciones (utf-8 / cp1252 / latin-1)."""
    with open(ruta, 'rb') as f:
        datos = f.read()
    for enc in ('utf-8-sig', 'utf-8'):
        try:
            texto = datos.decode(enc)
            if '\ufffd' not in texto:
                return texto
        except Exception:
            continue
    try:
        return datos.decode('cp1252')
    except Exception:
        return datos.decode('latin-1', errors='replace')


CLAVES_CONFIG = ('fotos', 'salida', 'pines', 'kml', 'idx', 'prioridad', 'marcas')


def prioridad_valida(valor):
    """'kml' | 'pines' -> tal cual (minúsculas). Cualquier otra cosa -> 'kml' (defecto)."""
    v = str(valor or '').strip().lower()
    return v if v in ('kml', 'pines') else 'kml'


def normaliza_marca(m):
    """'DiDi Élite' -> 'didi elite' (sin acentos, sin mayúsculas, espacios colapsados)."""
    import unicodedata
    s = str(m or '').strip()
    if not s:
        return ''
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', s).strip().lower()


def _marcas_de_texto(texto):
    """Lista de marcas (una por línea, `#` = comentario) -> set normalizado."""
    out = set()
    for linea in (texto or '').splitlines():
        linea = linea.strip()
        if not linea or linea.startswith('#'):
            continue
        n = normaliza_marca(linea)
        if n:
            out.add(n)
    return out


def leer_marcas(ruta):
    """Archivo de marcas conocidas -> set normalizado.

    Sin archivo o sin marcas -> set() vacío = **sin validación** (la marca de la foto se
    acepta tal cual). Sirve para validar `PROVEEDOR` cuando el KML no trae `MARCA`.
    """
    if not ruta or not os.path.exists(ruta):
        return set()
    try:
        texto = leer_texto_auto(ruta)
    except Exception:
        return set()
    return _marcas_de_texto(texto)


def leer_marcas_texto(texto):
    """Lista de marcas escrita **dentro** del CVLOCFG (bajo `marcas:`) -> set normalizado."""
    return _marcas_de_texto(texto)


def marcas_destino(ruta_cfg, cfg):
    """(tipo, ruta) de la lista que hay que alimentar: ('inline', cfg) | ('archivo', ruta).

    Ojo: una lista inline de UNA sola marca no se distingue de una ruta por el contenido,
    por eso `leer_config_rutas` marca el caso con `_marcas_inline`.
    """
    cfg = cfg or {}
    valor = (cfg.get('marcas') or '').strip()
    if valor and (cfg.get('_marcas_inline') or '\n' in valor):
        return ('inline', ruta_cfg)
    if valor:
        return ('archivo', valor if os.path.isabs(valor) else os.path.join(BASE_DIR, valor))
    return ('archivo', os.path.join(BASE_DIR, 'marcas-conocidas.txt'))


def marcas_agregar(tipo, ruta, nuevas):
    """Agrega marcas nuevas a la lista en uso. No duplica (compara normalizado).

    tipo='archivo' -> se apendan (se crea si no existe); tipo='inline' -> se insertan dentro
    del bloque `marcas:` del CFG, respetando el resto del archivo y el fin de línea original.
    Devuelve {'agregadas': [...], 'total': n, 'archivo': ruta}.
    """
    faltantes = [str(m).strip() for m in (nuevas or []) if str(m or '').strip()]
    if tipo == 'inline':
        texto = leer_texto_auto(ruta) if os.path.exists(ruta) else ''
        existentes = _marcas_de_texto(texto)
        faltantes = [m for m in faltantes if normaliza_marca(m) not in existentes]
        if not faltantes:
            return {'agregadas': [], 'total': len(existentes), 'archivo': ruta}
        salto = '\r\n' if '\r\n' in texto else '\n'
        lineas = texto.splitlines()
        ini = fin = None
        for i, l in enumerate(lineas):
            s = l.strip()
            if s.partition(':')[0].strip().lower() == 'marcas':
                ini = i
                fin = i + 1
                break
        if ini is None:
            return {'agregadas': [], 'total': len(existentes), 'archivo': ruta}
        while fin < len(lineas):
            s = lineas[fin].strip()
            if not s:
                break                           # la lista termina en línea en blanco
            if s.partition(':')[0].strip().lower() in CLAVES_CONFIG:
                break                           # llegó otra clave
            fin += 1
        lineas[fin:fin] = faltantes
        with open(ruta, 'w', encoding='utf-8', newline='') as f:
            f.write(salto.join(lineas) + salto)
        return {'agregadas': faltantes, 'total': len(existentes) + len(faltantes), 'archivo': ruta}

    existentes = leer_marcas(ruta)
    faltantes = [m for m in faltantes if normaliza_marca(m) not in existentes]
    if faltantes:
        os.makedirs(os.path.dirname(ruta) or '.', exist_ok=True)
        with open(ruta, 'a', encoding='utf-8', newline='') as f:
            for m in faltantes:
                f.write(m + '\n')
    return {'agregadas': faltantes, 'total': len(existentes) + len(faltantes), 'archivo': ruta}


def leer_config_rutas(ruta):
    """CVLOCFG.txt -> {'fotos': ..., 'salida': ..., 'pines': ..., 'kml': ..., 'idx': ...,
    'prioridad': ..., 'marcas': ...}

    Formato: `clave: valor` por línea (mayúsculas indiferentes), `#` y líneas vacías se ignoran.
    Se parte SOLO por el primer ':' porque las rutas llevan 'C:\\'.
    `marcas:` **sin valor** abre una lista inline: las líneas siguientes (hasta una en blanco)
    se toman como marcas conocidas, una por línea.
    Si el archivo no existe -> {} (sin error).
    """
    if not ruta or not os.path.exists(ruta):
        return {}
    rutas = {}
    en_marcas = False
    try:
        texto = leer_texto_auto(ruta)
    except Exception:
        return {}
    for linea in texto.splitlines():
        linea = linea.strip()
        if not linea:
            en_marcas = False          # la lista inline termina en una línea en blanco
            continue
        if linea.startswith('#'):
            continue
        clave, sep, valor = linea.partition(':')
        if sep and clave.strip().lower() in CLAVES_CONFIG:
            clave = clave.strip().lower()
            valor = valor.strip().strip('"').strip("'")
            en_marcas = (clave == 'marcas' and not valor)   # 'marcas:' -> lista inline
            if en_marcas:
                rutas['_marcas_inline'] = '1'   # marca que la lista está en este archivo
            if valor:
                rutas[clave] = valor
            continue
        if en_marcas:                  # línea de la lista de marcas (sin 'clave:')
            rutas['marcas'] = (rutas['marcas'] + '\n' + linea) if 'marcas' in rutas else linea
    return rutas


def leer_tsv(ruta):
    filas = []
    if os.path.exists(ruta):
        with open(ruta, encoding='utf-8', errors='replace') as f:
            for linea in f:
                filas.append(linea.rstrip('\n').split('\t'))
    return filas


def guardar_json(ruta, datos):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8') as f:
        import json as _json
        _json.dump(datos, f, ensure_ascii=False, indent=1)


def cargar_json(ruta, defecto=None):
    import json as _json
    if not os.path.exists(ruta):
        return defecto
    try:
        with open(ruta, encoding='utf-8') as f:
            return _json.load(f)
    except Exception:
        return defecto
