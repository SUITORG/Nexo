# -*- coding: utf-8 -*-
r"""Proceso completo del SuitCVLO-open: corre una tanda sobre N fotos.

Fuentes soportadas: web (Drive URL) | local (ruta) | zip (subido) | carpeta (subida).
Salidas: estructura <SALIDA>\<AAMMPQ>\auditoria\<Marca><Tipo><Ciudad>\<PIN>\ (fotos + info.txt)
y actualización de idxfotos.xlsx. Todo local, sin base de datos, sin borrados.
"""
import json
import os
import shutil
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import gdown

import motor
import utilidades as U

IDX_LOCK = threading.Lock()
_pin_locks = {}
_pin_guard = threading.Lock()


def _lock_pin(pin):
    with _pin_guard:
        if pin not in _pin_locks:
            _pin_locks[pin] = threading.Lock()
        return _pin_locks[pin]


def _stem(nombre):
    return os.path.splitext(os.path.basename(nombre))[0].lower()


def _excluidos(salida, idx_verif, reads_dir):
    """Stems ya cargados en cualquier estructura de salida + verificados en idxfotos + leídos."""
    excl = set()
    if salida and os.path.isdir(salida):
        for raiz, _, archivos in os.walk(salida):
            for a in archivos:
                if a.lower().endswith(('.jpg', '.jpeg', '.png')):
                    excl.add(_stem(a))
    for nom in idx_verif:
        excl.add(_stem(nom))
    if os.path.isdir(reads_dir):
        for f in os.listdir(reads_dir):
            if f.endswith('.json'):
                excl.add(_stem(f))
    return excl


def _elegir_pin(lat, lon, pines, radio):
    mejor = None
    dm = 1e12
    for pin, d in pines.items():
        dd = motor.dist_m(lat, lon, d['lat'], d['lon'])
        if dd < dm:
            dm = dd
            mejor = pin
    if mejor is None or dm > radio:
        return None, dm
    return mejor, dm


def _leer_foto_ia(ruta_jpg, trabajo, proveedor='auto', modelo=None, log=None):
    """Lee la foto con el switch de IA: Ollama -> DeepSeek -> OpenRouter -> Gemini."""
    if motor.en_mock():
        return ('ANUNCIO: SI\nMARCA CAMPAÑA: DiDi\nQUE ANUNCIA: promoción simulada\n'
                'TEXTO VISIBLE: TEXTO SIMULADO\nREFERENCIAS UBICACION: no visible\n'
                'TIPO SOPORTE: parabús\nCARA: frente')
    from ia import switch
    return switch.leer(ruta_jpg, motor.PROMPT_LECTURA, proveedor=proveedor,
                       modelo=modelo, log=log)


def _fila_idx(foto_jpg, texto, pin, d, kml_d, lat, lon, marcada, excede=False):
    que = motor.campo(texto, 'QUE ANUNCIA')
    tipo = motor.campo(texto, 'TIPO SOPORTE')
    refs = motor.campo(texto, 'REFERENCIAS') or 'no visible'
    texto_vis = motor.campo(texto, 'TEXTO VISIBLE')
    direccion = (str(d.get('UBICACIÓN') or d.get('DIRECCIÓN') or kml_d.get('UBICACIÓN') or '') or refs)
    notas = refs
    if texto_vis and texto_vis.lower() not in ('no visible', ''):
        notas = (notas + ' | texto: ' + texto_vis[:120]).strip(' |')
    if excede:
        notas = notas + ' | excede el tope por PIN'
    return [foto_jpg, que, direccion, tipo, lat, lon, notas, marcada, pin]


def _bloque_info(texto, d, kml_d, lat, lon):
    marca_foto = motor.campo(texto, 'MARCA') or motor.marca_de(d.get('PIN', ''), d)
    if marca_foto.strip().lower() in ('', 'no visible', 'no se distingue', 'sin marca', 'no legible'):
        marca_foto = motor.marca_de(d.get('PIN', ''), d)
    tipo_foto = motor.campo(texto, 'TIPO SOPORTE')
    return '\n'.join([
        'CAMPAÑA: %s' % marca_foto,
        'PLAZA: MTY',
        'PROVEEDOR: ',
        'RAZÓN SOCIAL: ',
        'MEDIO: %s' % (d.get('MEDIO') or kml_d.get('MEDIO', '') or tipo_foto),
        'FORMATO: %s' % (d.get('FORMATO') or kml_d.get('FORMATO', '')),
        'ID: %s' % (d.get('ID') or d.get('CODIGO MUPI') or kml_d.get('ID', '')),
        'UBICACIÓN: %s' % (d.get('UBICACIÓN') or d.get('DIRECCIÓN') or kml_d.get('UBICACIÓN', '')),
        'LATITUD: %s' % (lat if lat is not None else ''),
        'LONGITUD: %s' % (lon if lon is not None else ''),
    ])


def _reescribir_info(pin, d, kml_d, carpeta, reads):
    fotos = sorted(f for f in os.listdir(carpeta)
                   if f.lower().endswith(('.jpg', '.jpeg', '.png')))
    bloques = []
    for f in fotos:
        rd = reads.get(_stem(f))
        texto = (rd or {}).get('texto', '')
        lat = (rd or {}).get('lat')
        lon = (rd or {}).get('lon')
        if lat is None:
            lat = d.get('LATITUD', '')
        if lon is None:
            lon = d.get('LONGITUD', '')
        bloques.append(_bloque_info(texto, d, kml_d, lat, lon))
    encab = ['GRUPO: %s' % (d.get('CAPA', '') or ''),
             'PIN: ' + pin,
             'COORDENADAS: %s, %s' % (d.get('LATITUD', ''), d.get('LONGITUD', ''))]
    partes = encab[:]
    for b in bloques:
        partes.append('----------------------------------------')
        partes.append(b)
    partes.append('COMENTARIOS:')
    partes.append('NOTA: Fotos del recorrido cruzadas al PIN; datos por foto (foto -> pines -> KML).')
    with open(os.path.join(carpeta, 'info.txt'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(partes) + '\n')


def ejecutar_corrida(params, progreso, log):
    """Corre una tanda. params: dict con las rutas y opciones de la UI."""
    trabajo = params['trabajo']
    reads_dir = os.path.join(trabajo, 'reads')
    cache_dir = os.path.join(trabajo, 'cache')
    os.makedirs(reads_dir, exist_ok=True)
    os.makedirs(cache_dir, exist_ok=True)

    salida = params['salida']
    os.makedirs(salida, exist_ok=True)
    radio = float(params.get('radio') or 250)
    cap = int(params.get('cap') or 10)
    pausa = float(params.get('pausa') or 1.0)
    n_fotos = int(params.get('n_fotos') or 50)

    def detenido():
        f = params.get('_detener')
        try:
            return bool(f and f())
        except Exception:
            return False

    # datos base
    pines = motor.cargar_pines(params['pines'])
    log('Pines cargados: {}'.format(len(pines)))
    kml_datos = motor.cargar_kml_datos(params.get('kml', ''))

    wb, ws = motor.idx_abrir_o_crear(params.get('idx', ''))
    pos, verif = motor.idx_filas(ws)
    log('idxfotos: {} filas ({} verificadas)'.format(len(pos), len(verif)))

    excluidos = _excluidos(salida, verif, reads_dir)
    log('Excluidas (cargadas/verificadas/leídas): {}'.format(len(excluidos)))

    reads = {}
    if os.path.isdir(reads_dir):
        for f in os.listdir(reads_dir):
            if f.endswith('.json'):
                rd = U.cargar_json(os.path.join(reads_dir, f))
                if rd:
                    reads[_stem(f)] = rd

    # ---------- armar candidatas ----------
    candidatas = []  # dicts: foto(ruta local), nombre, lat, lon, fecha, pin, dist

    def evaluar(ruta_local, nombre_orig):
        g = motor.gps_y_fecha(ruta_local, mock_gps=params.get('_mock_gps'))
        lat, lon, fecha = g
        if lat is None or lon is None:
            return None
        pin, dm = _elegir_pin(lat, lon, pines, radio)
        if pin is None:
            return None
        return {'foto': ruta_local, 'nombre': nombre_orig, 'lat': lat, 'lon': lon,
                'fecha': fecha, 'pin': pin, 'dist': round(dm)}

    modo = params.get('modo')  # web | local | zip | carpeta
    if modo in ('local', 'zip', 'carpeta'):
        carpeta_src = params['ruta_local']
        archivos = U.ordenar_por_nombre([os.path.join(carpeta_src, f) for f in os.listdir(carpeta_src)
                                         if U.es_imagen(f)])
        log('Fotos en la fuente local: {}'.format(len(archivos)))
        for p in archivos:
            if detenido():
                log('Detener: se corta el armado de candidatas.')
                break
            if _stem(p) in excluidos:
                continue
            c = evaluar(p, os.path.basename(p))
            if c:
                candidatas.append(c)
            if len(candidatas) >= n_fotos:
                break
    else:
        # web: Drive
        url = params.get('drive_pics', '')
        res = gdown.download_folder(url, skip_download=True, quiet=True)
        items = []
        for x in res or []:
            ruta = str(getattr(x, 'path', None) or '')
            fid = getattr(x, 'id', None)
            if ruta and fid and ruta.lower().endswith(('.heic', '.jpg', '.jpeg')):
                items.append((fid, U.nombre_limpio(ruta)))
        items.sort(key=lambda t: t[1].lower())
        log('Fotos en Drive: {}'.format(len(items)))

        tope = int(params.get('max_descargas') or 300)
        descargas = 0
        sin_permiso = 0
        errores_red = 0
        FALLAS_PERMANENTES = ('public link', 'not publicly accessible', 'permission', '403')

        for fid, nombre in items:
            if len(candidatas) >= n_fotos:
                break
            if detenido():
                log('Detener: se corta la descarga de Drive.')
                break
            if descargas >= tope:
                log('Tope de {} descargas alcanzado (candidatas {}/{}): sube el límite en '
                    'Opciones avanzadas o usa Modo Local con Google Drive.'.format(
                        tope, len(candidatas), n_fotos))
                break
            if _stem(nombre) in excluidos:
                continue
            local = os.path.join(cache_dir, nombre)
            if not os.path.exists(local):
                try:
                    gdown.download(id=fid, output=local, quiet=True)
                except Exception as e:
                    msg = str(e).replace('\n', ' ')
                    # un fallo de permisos no se arregla esperando: no se duerme
                    if any(m in msg.lower() for m in FALLAS_PERMANENTES):
                        sin_permiso += 1
                        if sin_permiso <= 3 or sin_permiso % 25 == 0:
                            log('descarga sin permiso {}: {}'.format(nombre, msg[:70]))
                    else:
                        errores_red += 1
                        log('descarga falló {}: {}'.format(nombre, msg[:70]))
                        time.sleep(5)
                    continue
                descargas += 1
                time.sleep(max(0.5, pausa))
                if descargas % 10 == 0:
                    log('descargando {}/{} · candidatas {}/{} · sin permiso {}'.format(
                        descargas, len(items), len(candidatas), n_fotos, sin_permiso))
            if not os.path.exists(local) or os.path.getsize(local) == 0:
                continue
            c = evaluar(local, nombre)
            if c:
                candidatas.append(c)
        log('Descargas nuevas: {} · sin permiso: {} · errores de red: {}'.format(
            descargas, sin_permiso, errores_red))

    log('Candidatas a leer: {}'.format(len(candidatas)))
    progreso({'total': len(candidatas), 'fotos_estado': [{'nombre': c['nombre'], 'estado': 'pendiente'} for c in candidatas]})

    # ---------- procesar ----------
    resumen = {'leidas': 0, 'copiadas': 0, 'excedidas': 0, 'grupos': set(), 'pines': set(), 'idx': params.get('idx', '')}

    def procesar(idx_, c):
        nombre = c['nombre']
        stem = _stem(nombre)
        if detenido():
            return stem, 'detenido', None, None
        d = dict(pines[c['pin']])
        d['PIN'] = c['pin']
        kml_d = kml_datos.get(c['pin'], {})
        try:
            from PIL import Image
            im = Image.open(c['foto']).convert('RGB')
            texto = _leer_foto_ia(c['foto'], trabajo, params.get('ia_proveedor', 'auto'),
                                  params.get('ia_modelo'), log)
            # destino
            pq = motor.quincena_de(c['fecha']) or datetime_quincena()
            grupo = motor.grupo_de(c['pin'], d)
            carpeta = os.path.join(salida, pq, 'auditoria', grupo, c['pin'])
            os.makedirs(carpeta, exist_ok=True)
            foto_jpg = stem + '.jpg'
            with _lock_pin(c['pin']):
                existe = len([f for f in os.listdir(carpeta) if f.lower().endswith('.jpg')])
                marcada = ''
                if existe < cap:
                    destino = os.path.join(carpeta, foto_jpg)
                    if not os.path.exists(destino):
                        im.save(destino, quality=92)
                    marcada = '✓'
                    resumen['copiadas'] += 1
                else:
                    marcada = ''
                    resumen['excedidas'] += 1
            # registro
            rd = {'foto': nombre, 'pin': c['pin'], 'dist': c['dist'], 'lat': c['lat'], 'lon': c['lon'],
                  'fecha': c['fecha'], 'texto': texto, 'grupo': grupo, 'pq': pq, 'marcada': marcada}
            U.guardar_json(os.path.join(reads_dir, stem + '.json'), rd)
            reads[stem] = rd
            resumen['leidas'] += 1
            resumen['grupos'].add(grupo)
            resumen['pines'].add(c['pin'])
            # idxfotos
            fila = _fila_idx(foto_jpg, texto, c['pin'], d, kml_d, c['lat'], c['lon'], marcada, excede=(marcada == ''))
            with IDX_LOCK:
                motor.idx_upsert(ws, pos, fila)
            return stem, 'listo', None, carpeta
        except Exception as e:
            return stem, 'error', str(e)[:200], None

    def datetime_quincena():
        from datetime import datetime as _dt
        return '{:02d}{:02d}01'.format(_dt.now().year % 100, _dt.now().month)

    resultados = []
    carpetas = set()
    # Ollama local corre en CPU: serializar para que cada foto tenga todo el equipo.
    max_workers = 1 if params.get('ia_proveedor', 'auto') in ('auto', 'ollama') else 3
    log('Paralelismo de lectura: {} foto(s) a la vez'.format(max_workers))
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futuros = {ex.submit(procesar, i, c): i for i, c in enumerate(candidatas)}
        hechas = 0
        for fu in as_completed(futuros):
            stem, estado, error, carpeta = fu.result()
            hechas += 1
            resultados.append({'nombre': stem, 'estado': estado, 'error': error})
            if carpeta:
                carpetas.add(carpeta)
            progreso({'completadas': hechas, 'actual': stem, 'fotos_estado': resultados})
            log('[{}] {} {}'.format(hechas, stem, estado if not error else 'ERROR: ' + error))

    # reescribir info.txt una vez por la carpeta de PIN (evita carreras)
    for carpeta in sorted(carpetas):
        pin = os.path.basename(carpeta)
        d = dict(pines.get(pin, {}))
        d['PIN'] = pin
        _reescribir_info(pin, d, kml_datos.get(pin, {}), carpeta, reads)

    # guardar idxfotos
    try:
        ruta_idx = motor.idx_guardar(wb, params.get('idx', ''))
        resumen['idx'] = ruta_idx
    except Exception as e:
        log('ERROR guardando idxfotos: {}'.format(str(e)[:150]))

    resumen['grupos'] = sorted(resumen['grupos'])
    resumen['pines'] = sorted(resumen['pines'])
    resumen['detenida'] = detenido()
    return resumen
