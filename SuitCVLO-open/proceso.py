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
from collections import Counter
from datetime import datetime
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


def _excluidos(salida, idx_verif, reads_dir, reproceso=False):
    """Stems ya cargados en la salida + verificados en idxfotos + leídos.

    En `reproceso` solo excluye lo que YA está completo: los verificados que no se limpiaron
    y las lecturas ya en el formato nuevo. Así las incompletas (sin lectura o con lectura
    antigua) vuelven a ser candidatas **sin mover ni borrar ningún archivo**.
    """
    excl = set()
    if not reproceso and salida and os.path.isdir(salida):
        for raiz, _, archivos in os.walk(salida):
            for a in archivos:
                if a.lower().endswith(('.jpg', '.jpeg', '.png')):
                    excl.add(_stem(a))
    for nom in idx_verif:
        excl.add(_stem(nom))
    if os.path.isdir(reads_dir):
        for f in os.listdir(reads_dir):
            if not f.endswith('.json'):
                continue
            if reproceso:
                rd = U.cargar_json(os.path.join(reads_dir, f)) or {}
                if '\nMARCA:' in (rd.get('texto') or ''):
                    excl.add(_stem(f))          # ya en formato nuevo -> no gastar tokens
            else:
                excl.add(_stem(f))
    return excl


def _objetivos_reproceso(params):
    """(objetivos, sin_origen, sin_lectura, formato_viejo) por stem — solo lectura, sin escribir.

    Objetivo = foto copiada sin lectura NUEVA o con lectura de formato antiguo (MARCA CAMPAÑA),
    y con origen en la ruta activa (si no, no se podría releer).
    """
    ruta_local = params.get('ruta_local') or ''
    salida = params.get('salida') or ''
    reads_dir = os.path.join(params['trabajo'], 'reads')

    con_origen = set()
    if ruta_local and os.path.isdir(ruta_local):
        con_origen = {_stem(f) for f in os.listdir(ruta_local) if U.es_imagen(f)}

    viejo, nuevo = set(), set()
    if os.path.isdir(reads_dir):
        for f in os.listdir(reads_dir):
            if not f.endswith('.json'):
                continue
            texto = (U.cargar_json(os.path.join(reads_dir, f)) or {}).get('texto') or ''
            if '\nMARCA:' in texto:
                nuevo.add(_stem(f))
            elif texto.strip():
                viejo.add(_stem(f))
    copiadas = set()
    if salida and os.path.isdir(salida):
        for _raiz, _sub, archivos in os.walk(salida):
            for a in archivos:
                if a.lower().endswith(('.jpg', '.jpeg', '.png')):
                    copiadas.add(_stem(a))

    incompletas = (copiadas - nuevo) | viejo
    objetivos = sorted(incompletas & con_origen)
    sin_origen = sorted(incompletas - con_origen)
    sin_lectura = sorted((copiadas - nuevo) - viejo)
    return objetivos, sin_origen, sin_lectura, sorted(viejo)


def preparar_reproceso(params, log):
    """Respalda el idxfotos.xlsx y limpia 'Verificado' de las fotos incompletas.

    No mueve ni borra ningún archivo: la copia se queda en la salida (no se sobrescribe) y el
    reads/*.json se reemplaza solo cuando se relee la foto.
    """
    objetivos, sin_origen, sin_lectura, viejo = _objetivos_reproceso(params)
    ruta_idx = params.get('idx') or ''

    respaldo = ''
    if objetivos and ruta_idx and os.path.exists(ruta_idx):
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        respaldo = ruta_idx[:-5] + '_backup_{}.xlsx'.format(ts) if ruta_idx.lower().endswith('.xlsx') \
            else ruta_idx + '_backup_{}.xlsx'.format(ts)
        shutil.copy2(ruta_idx, respaldo)

    limpiadas = 0
    if objetivos and ruta_idx and os.path.exists(ruta_idx):
        wb, ws = motor.idx_abrir_o_crear(ruta_idx)
        pos, _v = motor.idx_filas(ws)
        fila_de = {_stem(n): r for n, r in pos.items()}
        with IDX_LOCK:
            for s in objetivos:
                r = fila_de.get(s)
                if not r:
                    continue
                celda = ws.cell(r, 8)          # columna Verificado
                if str(celda.value or '').strip():
                    celda.value = ''
                    limpiadas += 1
        if limpiadas:
            motor.idx_guardar(wb, ruta_idx)

    log('Reproceso preparado: {} objetivas ({} sin lectura · {} formato antiguo) · '
        '{} sin origen (no se tocan) · {} marcas limpiadas{}'.format(
            len(objetivos), len(sin_lectura), len(viejo), len(sin_origen), limpiadas,
            ' · respaldo ' + os.path.basename(respaldo) if respaldo else ''))
    return {'objetivas': len(objetivos), 'sin_lectura': len(sin_lectura),
            'formato_viejo': len(viejo), 'sin_origen': len(sin_origen),
            'limpiadas': limpiadas, 'respaldo': respaldo}


def _fuente_cruce(pines, kml_datos, prioridad):
    """Qué coordenadas gana al elegir el PIN: 'kml' (defecto) o 'pines'.

    Con `kml`: manda el KML, pero un PIN que solo existe en el mapa de pines sigue
    siendo cruzaible (regla: "el KML tiene PIN -> de ahí; si no, del mapa de pines").
    Con `pines`: comportamiento antiguo (el KML no participa en el cruce).
    """
    if prioridad == 'pines':
        return pines
    fuente = {}
    for pin, d in kml_datos.items():
        if 'lat' in d and 'lon' in d:
            fuente[pin] = d
    for pin, d in pines.items():
        fuente.setdefault(pin, d)
    return fuente


def _elegir_pin(lat, lon, cruze, radio):
    mejor = None
    dm = 1e12
    for pin, d in cruze.items():
        if 'lat' not in d or 'lon' not in d:
            continue
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
        return ('ANUNCIO: SI\nMARCA: DiDi\nCAMPAÑA: Promo verano\nQUE ANUNCIA: promoción simulada\n'
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


_NO_MARCA = ('', 'no visible', 'no se distingue', 'sin marca', 'no legible')


def _es_sin_marca(v):
    return str(v or '').strip().lower() in _NO_MARCA


def _pri(*vals):
    """Primer valor con contenido (como string)."""
    for v in vals:
        v = str(v or '').strip()
        if v:
            return v
    return ''


def _proveedor_de(texto, d, kml_d, prioridad, marcas):
    """PROVEEDOR del bloque. Devuelve (valor, estrella).

    prioridad='kml' (reglas 1A/2A): manda el KML -> sin estrella; si el KML no lo trae,
    la marca detectada por la IA **solo si está en la lista de marcas conocidas** (+ ' *');
    si no, la regla por prefijo de PIN (+ ' *'). La estrella significa "no viene del KML".
    prioridad='pines': comportamiento original (IA -> pines -> regla, sin estrella).
    """
    if prioridad == 'kml':
        m_kml = str((kml_d or {}).get('MARCA') or '').strip()
        if not _es_sin_marca(m_kml):
            return m_kml, ''
        m_ia = motor.campo(texto, 'MARCA').strip()
        if not _es_sin_marca(m_ia) and (not marcas or U.normaliza_marca(m_ia) in marcas):
            return m_ia, ' *'
        return (motor.marca_de(d.get('PIN', ''), d) or 'no disponible'), ' *'
    p = motor.campo(texto, 'MARCA').strip()
    if not _es_sin_marca(p):
        return p, ''
    p = str(d.get('MARCA') or '').strip()
    if p:
        return p, ''
    return motor.marca_de(d.get('PIN', ''), d) or 'no disponible', ''


def _bloque_info(texto, d, kml_d, lat, lon, foto='', con_comentario=True,
                 prioridad='kml', marcas=None):
    kml_d = kml_d or {}
    a, b = (kml_d, d) if prioridad == 'kml' else (d, kml_d)   # quién manda en cada campo

    # PROVEEDOR = el anunciante/marca
    proveedor_base, estrella = _proveedor_de(texto, d, kml_d, prioridad, marcas)
    proveedor = proveedor_base + estrella

    # CAMPAÑA = el eslogan; las lecturas viejas no traen el campo -> se queda con la marca
    campana = motor.campo(texto, 'CAMPAÑA').strip()
    if not campana:
        campana = proveedor_base
    tipo_foto = motor.campo(texto, 'TIPO SOPORTE')
    # con prioridad kml las coordenadas del bloque salen del KML aunque la foto difiera
    if prioridad == 'kml':
        lat = _pri(kml_d.get('LATITUD'), lat)
        lon = _pri(kml_d.get('LONGITUD'), lon)
    partes = ['FOTO: %s' % (foto or 'no disponible'),
              'CAMPAÑA: %s' % campana]
    if con_comentario:
        # el mensaje del anuncio: qué promociona (y si hace falta, el texto literal que se ve)
        mensaje = motor.campo(texto, 'QUE ANUNCIA').strip()
        if mensaje.lower() in ('', 'no visible', 'no se distingue', 'no aplica'):
            mensaje = motor.campo(texto, 'TEXTO VISIBLE').strip()
        partes.append('COMENTARIO: %s' % (mensaje or 'no disponible'))
    partes += ['PLAZA: MTY',
               'PROVEEDOR: %s' % proveedor,
               'RAZÓN SOCIAL: ',
               'MEDIO: %s' % _pri(a.get('MEDIO'), b.get('MEDIO'), tipo_foto),
               'FORMATO: %s' % _pri(a.get('FORMATO'), b.get('FORMATO')),
               'ID: %s' % _pri(a.get('ID'), b.get('ID'), d.get('CODIGO MUPI')),
               'UBICACIÓN: %s' % _pri(a.get('UBICACIÓN'), a.get('DIRECCIÓN'),
                                      b.get('UBICACIÓN'), b.get('DIRECCIÓN')),
               'LATITUD: %s' % lat,
               'LONGITUD: %s' % lon]
    return '\n'.join(partes)


def _cargar_reads(reads_dir):
    """trabajo/reads/*.json -> dict stem -> registro de lectura."""
    reads = {}
    if os.path.isdir(reads_dir):
        for f in os.listdir(reads_dir):
            if f.endswith('.json'):
                rd = U.cargar_json(os.path.join(reads_dir, f))
                if rd:
                    reads[_stem(f)] = rd
    return reads


def _reescribir_info(pin, d, kml_d, carpeta, reads, comentario=True,
                     prioridad='kml', marcas=None):
    kml_d = kml_d or {}
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
        bloques.append(_bloque_info(texto, d, kml_d, lat, lon, foto=f,
                                    con_comentario=comentario,
                                    prioridad=prioridad, marcas=marcas))
    if prioridad == 'kml':
        grupo = _pri(kml_d.get('CAPA'), d.get('CAPA'))
        lat_c = _pri(kml_d.get('LATITUD'), d.get('LATITUD'))
        lon_c = _pri(kml_d.get('LONGITUD'), d.get('LONGITUD'))
    else:
        grupo = d.get('CAPA', '')
        lat_c = d.get('LATITUD', '')
        lon_c = d.get('LONGITUD', '')
    encab = ['GRUPO: %s' % grupo,
             'PIN: ' + pin,
             'COORDENADAS: %s, %s' % (lat_c, lon_c)]
    partes = encab[:]
    for b in bloques:
        partes.append('-' * 40)
        partes.append(b)
    partes.append('COMENTARIOS:')
    partes.append('NOTA: Fotos del recorrido cruzadas al PIN; datos por foto '
                  '(foto -> pines -> KML).' if prioridad != 'kml' else
                  'NOTA: Fotos del recorrido cruzadas al PIN; datos del soporte desde el KML '
                  '(si el KML no lo trae, del mapa de pines).')
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

    # prioridad de la fuente (CVLOCFG/UI) + marcas conocidas para PROVEEDOR
    prioridad = U.prioridad_valida(params.get('prioridad'))
    marcas = params.get('_marcas') or set()
    cruze = _fuente_cruce(pines, kml_datos, prioridad)
    log('Prioridad de fuente: {} · PINs cruzables: {} (KML {})'
        .format(prioridad, len(cruze), len(kml_datos)))

    # conteo por capa del KML (TODOS los placemarks, incluidos los que cargar_pines descarta)
    resumen_kml = motor.kml_resumen(kml_datos)
    capas = Counter(resumen_kml['capas'])
    con_cara = resumen_kml['cara']

    wb, ws = motor.idx_abrir_o_crear(params.get('idx', ''))
    col_fecha = motor.idx_col_fecha(ws)     # FechaHoraSubida (respeta una cabecera ya existente)
    col_marca = motor.idx_col_marca(ws)     # Marca (al final): la que encontró el sistema
    pos, verif = motor.idx_filas(ws)
    log('idxfotos: {} filas ({} verificadas) · FechaHoraSubida en columna {} · Marca en columna {}'
        .format(len(pos), len(verif), col_fecha, col_marca))

    excluidos = _excluidos(salida, verif, reads_dir,
                           reproceso=bool(params.get('_reproceso')))
    log('Excluidas (cargadas/verificadas/leídas): {}'.format(len(excluidos)))

    reads = _cargar_reads(reads_dir)

    # ---------- armar candidatas ----------
    candidatas = []  # dicts: foto(ruta local), nombre, lat, lon, fecha, pin, dist
    cont = {'con_gps': 0, 'sin_gps': 0, 'fuera_radio': 0}
    nombres_sin_gps = []          # se registran en el índice con 'No GPS'
    fuente = 0                    # fotos en la ruta/carpetra de origen

    def evaluar(ruta_local, nombre_orig):
        g = motor.gps_y_fecha(ruta_local, mock_gps=params.get('_mock_gps'))
        lat, lon, fecha = g
        if lat is None or lon is None:
            cont['sin_gps'] += 1
            if nombre_orig not in nombres_sin_gps:
                nombres_sin_gps.append(nombre_orig)
            return None
        cont['con_gps'] += 1
        pin, dm = _elegir_pin(lat, lon, cruze, radio)
        if pin is None:
            cont['fuera_radio'] += 1
            return None
        origen = 'kml' if (prioridad == 'kml' and pin in kml_datos) else 'pines'
        return {'foto': ruta_local, 'nombre': nombre_orig, 'lat': lat, 'lon': lon,
                'fecha': fecha, 'pin': pin, 'dist': round(dm), 'origen': origen}

    modo = params.get('modo')  # web | local | zip | carpeta
    if modo in ('local', 'zip', 'carpeta'):
        carpeta_src = params['ruta_local']
        archivos = U.ordenar_por_nombre([os.path.join(carpeta_src, f) for f in os.listdir(carpeta_src)
                                         if U.es_imagen(f)])
        fuente = len(archivos)
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
        fuente = len(items)
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

    # fotos sin GPS: quedan registradas en el índice con 'No GPS' en la columna Verificado
    if nombres_sin_gps:
        with IDX_LOCK:
            for nombre in nombres_sin_gps:
                motor.idx_upsert(ws, pos,
                                 [nombre, '', '', '', '', '', 'sin GPS en EXIF', 'No GPS', ''])
        log('Sin GPS: {} fotos marcadas como No GPS en el índice'.format(len(nombres_sin_gps)))

    progreso({'stats': {'fuente': fuente, 'pines': len(pines),
                        'con_gps': cont['con_gps'], 'sin_gps': cont['sin_gps'],
                        'fuera_radio': cont['fuera_radio'],
                        'capas': dict(capas), 'kml': sum(capas.values()),
                        'cara': con_cara}})
    log('Candidatas a leer: {}'.format(len(candidatas)))
    if candidatas:
        de_kml = sum(1 for c in candidatas if c.get('origen') == 'kml')
        log('Cruce: {} candidatas con PIN del KML · {} con PIN solo de pines'
            .format(de_kml, len(candidatas) - de_kml))
    progreso({'total': len(candidatas), 'fotos_estado': [{'nombre': c['nombre'], 'estado': 'pendiente'} for c in candidatas]})

    # ---------- procesar ----------
    resumen = {'leidas': 0, 'copiadas': 0, 'excedidas': 0, 'grupos': set(), 'pines': set(), 'idx': params.get('idx', '')}

    def procesar(idx_, c):
        nombre = c['nombre']
        stem = _stem(nombre)
        if detenido():
            return stem, 'detenido', None, None
        # el PIN puede venir del KML (prioridad kml) aunque el mapa de pines no lo traiga
        d = dict(pines.get(c['pin']) or kml_datos.get(c['pin']) or {})
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
                # hora de subida en SU columna: nunca escribe sobre una columna ajena
                ws.cell(pos[foto_jpg], col_fecha).value = datetime.now().strftime('%Y-%m-%d %H:%M')
                # marca encontrada (misma regla que PROVEEDOR del info.txt, sin el ' *')
                marca, _est = _proveedor_de(texto, d, kml_d, prioridad, marcas)
                ws.cell(pos[foto_jpg], col_marca).value = marca
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
        d = dict(pines.get(pin) or kml_datos.get(pin) or {})
        d['PIN'] = pin
        _reescribir_info(pin, d, kml_datos.get(pin, {}), carpeta, reads,
                         comentario=params.get('comentario', True),
                         prioridad=prioridad, marcas=marcas)

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


def reescribir_todo(salida, pines, kml_datos, reads_dir, prioridad='kml',
                    marcas=None, comentario=True, log=None, idx=''):
    """Reescribe TODOS los info.txt de la salida con las lecturas ya guardadas
    y rellena la columna `Marca` del idxfotos.xlsx.

    No llama a la IA, no copia ni borra nada: solo regenera el texto de cada carpeta de PIN
    y la marca de cada fila que tenga lectura (servicio del botón "Reescribir info.txt y Marca"
    y para aplicar un cambio de prioridad al entregable existente).
    Devuelve {'reescritas', 'reads', 'marcas', 'prioridad'}.
    """
    log = log or (lambda m: None)
    reads = _cargar_reads(reads_dir)
    carpetas = []
    for raiz, _sub, archivos in os.walk(salida):
        if any(f.lower().endswith(('.jpg', '.jpeg', '.png')) for f in archivos):
            carpetas.append(raiz)
    reescritas = 0
    for carpeta in sorted(carpetas):
        pin = os.path.basename(carpeta)
        d = dict(pines.get(pin) or kml_datos.get(pin) or {})
        d['PIN'] = pin
        _reescribir_info(pin, d, kml_datos.get(pin, {}), carpeta, reads,
                         comentario=comentario, prioridad=prioridad, marcas=marcas)
        reescritas += 1

    marcas_escritas = 0
    if idx and reads and os.path.exists(idx):
        try:
            wb, ws = motor.idx_abrir_o_crear(idx)
            col = motor.idx_col_marca(ws)
            pos, _verif = motor.idx_filas(ws)
            for nombre, r in pos.items():
                rd = reads.get(os.path.splitext(str(nombre))[0].lower())
                if not rd:
                    continue
                pin = str(rd.get('pin') or '')
                d = dict(pines.get(pin) or kml_datos.get(pin) or {})
                d['PIN'] = pin
                marca, _est = _proveedor_de(rd.get('texto') or '', d,
                                            kml_datos.get(pin, {}), prioridad, marcas)
                if not marca:
                    continue
                ws.cell(r, col).value = marca
                marcas_escritas += 1
            motor.idx_guardar(wb, idx)
            wb.close()
        except Exception as e:
            log('ERROR rellenando la columna Marca: {}'.format(str(e)[:150]))

    log('info.txt reescritos: {} · marcas escritas: {} ({} lecturas guardadas)'
        .format(reescritas, marcas_escritas, len(reads)))
    return {'reescritas': reescritas, 'reads': len(reads),
            'marcas': marcas_escritas, 'prioridad': prioridad}
