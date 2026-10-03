# -*- coding: utf-8 -*-
"""Utilidades del CVLO Auditor: archivos, zip seguro, nombres."""
import csv
import os
import re
import zipfile

EXTENSIONES_IMAGEN = {'.jpg', '.jpeg', '.png', '.webp', '.heic'}


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


CLAVES_CONFIG = ('fotos', 'salida', 'pines', 'kml', 'idx')


def leer_config_rutas(ruta):
    """CVLOCFG.txt -> {'fotos': ..., 'salida': ..., 'pines': ..., 'kml': ..., 'idx': ...}

    Formato: `clave: valor` por línea (mayúsculas indiferentes), `#` y líneas vacías se ignoran.
    Se parte SOLO por el primer ':' porque las rutas llevan 'C:\\'.
    Si el archivo no existe -> {} (sin error).
    """
    if not ruta or not os.path.exists(ruta):
        return {}
    rutas = {}
    try:
        texto = leer_texto_auto(ruta)
    except Exception:
        return {}
    for linea in texto.splitlines():
        linea = linea.strip()
        if not linea or linea.startswith('#') or ':' not in linea:
            continue
        clave, valor = linea.split(':', 1)
        clave = clave.strip().lower()
        valor = valor.strip().strip('"').strip("'")
        if clave in CLAVES_CONFIG and valor:
            rutas[clave] = valor
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
