# -*- coding: utf-8 -*-
"""SuitCVLO-open — servidor local (Flask).

Uso: python app.py  ->  http://127.0.0.1:3015
Parámetros: rutas de fotos (local o Drive), salida, pines, KML, idxfotos, N fotos.
Sin base de datos: todo se guarda en archivos locales. Sin borrar archivos.
Lectura IA: ver ia/switch.py (Ollama local -> DeepSeek -> OpenRouter -> Gemini).
"""
import json
import os
import sys
import threading
import uuid
from datetime import datetime

from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import RequestEntityTooLarge

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import motor
import proceso
import utilidades as U
from ia import switch

BASE = os.path.dirname(os.path.abspath(__file__))
TRABAJO = os.environ.get('CVLO_TRABAJO') or os.path.join(BASE, 'trabajo')
PUERTO = int(os.environ.get('CVLO_PUERTO') or 3015)

app = Flask(__name__,
            template_folder=os.path.join(BASE, 'plantillas'),
            static_folder=os.path.join(BASE, 'static'))
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024

JOBS = {}
JOBS_LOCK = threading.Lock()


def defaults():
    c = r'C:\Users\rojo-\Downloads\cteCVLO1'
    return {
        'salida': c,
        'pines': os.path.join(c, 'GooMapsPines.txt'),
        'drive': os.path.join(c, 'GooDrPics.txt'),
        'kml': os.path.join(c, 'RutaKML.kml'),
        'idx': os.path.join(c, 'idxfotos.xlsx'),
        'drive_url': 'https://drive.google.com/drive/folders/1npZm7uVY0gkqVm8lEcZpaQ7i3P_JVL8l',
    }


def _job_publico(job):
    return {
        'id': job['id'], 'estado': job['estado'], 'modo': job['modo'],
        'total': job['total'], 'completadas': job['completadas'], 'actual': job['actual'],
        'fotos': job['fotos'][-400:], 'log': job['log'][-120:],
        'resumen': job.get('resumen'), 'error': job.get('error_global'),
        'inicio': job['inicio'], 'fin': job.get('fin'),
        'deteniendo': bool(job.get('detener')),
        'stats': job.get('stats'),
    }


@app.get('/')
def inicio():
    return render_template('index.html', defaults_json=json.dumps(defaults()))


@app.get('/api/estado')
def api_estado():
    return jsonify({'mock': motor.en_mock(), 'defaults': defaults(), 'ia': switch.estado()})


@app.get('/api/ia/modelos')
def api_modelos_ia():
    return jsonify({'modelos': switch.modelos(), 'cadena': list(switch.ORDEN)})


@app.get('/api/ia/estado')
def api_estado_ia():
    return jsonify({'proveedores': switch.estado()})


@app.errorhandler(RequestEntityTooLarge)
def _grande(_e):
    return jsonify({'error': 'La carga excede el tamaño máximo (1 GB).'}), 413


@app.errorhandler(Exception)
def _error_global(e):
    """Cualquier error inesperado responde JSON en vez de un 500 sin detalle."""
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return e
    app.logger.exception('Error en %s %s', request.method, request.path)
    return jsonify({'error': 'Error interno: {}'.format(str(e)[:300])}), 500


@app.post('/api/corridas')
def api_crear():
    form = request.form
    modo = (form.get('modo') or 'local').strip().lower()
    try:
        n_fotos = int(form.get('n_fotos') or 50)
        radio = float(form.get('radio') or 250)
        cap = int(form.get('cap') or 10)
        pausa = float(form.get('pausa') or 1.0)
        max_descargas = int(form.get('max_descargas') or 300)
    except (TypeError, ValueError):
        return jsonify({'error': 'Parámetros numéricos inválidos (N fotos, radio, tope o pausa).'}), 400
    salida = (form.get('salida') or '').strip()
    pines = (form.get('pines') or '').strip()
    kml = (form.get('kml') or '').strip()
    idx = (form.get('idx') or '').strip()
    drive = (form.get('drive_pics') or '').strip()
    ruta_local = (form.get('ruta_local') or '').strip()
    ia_proveedor = (form.get('ia_proveedor') or 'auto').strip().lower()
    ia_modelo = (form.get('ia_modelo') or '').strip()
    comentario = (form.get('comentario') or '1').strip().lower() not in ('0', 'false', 'no')

    if not salida:
        return jsonify({'error': 'Falta la Ruta de Salida.'}), 400
    if not pines:
        return jsonify({'error': 'Falta la Ruta de GoogleMapsPines.'}), 400
    if not idx:
        return jsonify({'error': 'Falta la Ruta de idxfotos.xlsx.'}), 400
    if ia_proveedor not in ('auto',) + tuple(switch.ORDEN):
        return jsonify({'error': 'Motor IA desconocido: {}'.format(ia_proveedor)}), 400

    jid = uuid.uuid4().hex[:12]
    switch.reset()   # nueva corrida: no arrastrar los cooldowns de la anterior
    entrada = os.path.join(TRABAJO, 'corridas', jid)
    os.makedirs(entrada, exist_ok=True)

    # --- fuente de fotos ---
    if modo in ('zip', 'carpeta'):
        destino = os.path.join(entrada, 'fotos')
        os.makedirs(destino, exist_ok=True)
        archivo_zip = request.files.get('archivo_zip')
        if archivo_zip is not None and archivo_zip.filename:
            ruta_zip = os.path.join(entrada, U.sanear_nombre(archivo_zip.filename, 'lote.zip'))
            archivo_zip.save(ruta_zip)
            try:
                U.extraer_zip_seguro(ruta_zip, destino)
            except Exception as e:
                return jsonify({'error': 'ZIP inválido: {}'.format(str(e)[:150])}), 400
        for f in request.files.getlist('archivos'):
            if f is None or not f.filename:
                continue
            nombre = U.nombre_limpio(f.filename)
            if not U.es_imagen(nombre):
                continue
            f.save(U.ruta_libre(destino, nombre))
        ruta_local = destino
    elif modo == 'web':
        # aceptar URL directa o un .txt que la contenga (GooDrPics.txt)
        u = drive
        if u and os.path.isdir(u):
            return jsonify({'error': 'Modo Web: "{}" es una CARPETA. Indica la ruta del archivo '
                                     'GooDrPics.txt (o pega la URL de Drive).'.format(u)}), 400
        if u and os.path.isfile(u):
            try:
                texto = U.leer_texto_auto(u)
            except Exception as e:
                return jsonify({'error': 'No pude leer "{}": {}'.format(u, str(e)[:150])}), 400
            import re
            m = re.search(r'https?://\S+', texto)
            u = m.group(0) if m else ''
        if not u or 'http' not in u:
            return jsonify({'error': 'Modo Web: indica una URL de Drive válida (o la ruta del archivo GooDrPics.txt).'}), 400
        drive = u
        if motor.en_mock():
            return jsonify({'error': 'MODO_MOCK: la fuente web no está disponible en pruebas.'}), 400
    else:
        if not ruta_local:
            return jsonify({'error': 'Modo Local: falta la ruta de fotos.'}), 400
        if os.path.isfile(ruta_local):
            return jsonify({'error': 'Modo Local: "{}" es un archivo. Indica la CARPETA que contiene las fotos.'
                           .format(ruta_local)}), 400
        if not os.path.isdir(ruta_local):
            return jsonify({'error': 'Modo Local: la ruta de fotos no existe: {}'.format(ruta_local)}), 400
        modo = 'local'

    mock_gps = None
    if motor.en_mock() and ruta_local:
        mgp = os.path.join(ruta_local, 'mock_gps.json')
        if os.path.exists(mgp):
            mock_gps = U.cargar_json(mgp, {})

    job = {
        'id': jid, 'modo': modo, 'estado': 'en cola', 'total': 0, 'completadas': 0, 'actual': '',
        'fotos': [], 'log': [], 'resumen': None, 'error_global': None, 'detener': False,
        'inicio': datetime.now().isoformat(timespec='seconds'), 'fin': None,
    }
    with JOBS_LOCK:
        JOBS[jid] = job

    params = {
        'modo': modo, 'ruta_local': ruta_local, 'salida': salida, 'pines': pines,
        'drive_pics': drive, 'kml': kml, 'idx': idx, 'n_fotos': n_fotos,
        'radio': radio, 'cap': cap, 'pausa': pausa, 'max_descargas': max_descargas,
        'comentario': comentario,
        'ia_proveedor': ia_proveedor, 'ia_modelo': ia_modelo,
        'trabajo': TRABAJO,
        '_mock_gps': mock_gps,
        '_detener': lambda: bool(job.get('detener')),
    }

    def progreso(cambios):
        with JOBS_LOCK:
            job.update(cambios)

    def log(mensaje):
        with JOBS_LOCK:
            job['log'].append('{}  {}'.format(datetime.now().strftime('%H:%M:%S'), mensaje))
            job['log'] = job['log'][-300:]

    def correr():
        try:
            resumen = proceso.ejecutar_corrida(params, progreso, log)
            resumen['grupos'] = list(resumen.get('grupos') or [])
            resumen['pines'] = list(resumen.get('pines') or [])
            progreso({'estado': 'listo', 'resumen': resumen, 'fin': datetime.now().isoformat(timespec='seconds')})
            log('Corrida terminada.')
        except Exception as e:
            progreso({'estado': 'error', 'error_global': str(e)[:400],
                      'fin': datetime.now().isoformat(timespec='seconds')})
            log('ERROR: {}'.format(str(e)[:250]))

    threading.Thread(target=correr, name='cvlo-' + jid, daemon=True).start()
    return jsonify({'id': jid})


@app.get('/api/corridas/<jid>')
def api_job(jid):
    with JOBS_LOCK:
        job = JOBS.get(jid)
    if not job:
        return jsonify({'error': 'no existe'}), 404
    return jsonify(_job_publico(job))


@app.post('/api/corridas/<jid>/detener')
def api_detener(jid):
    with JOBS_LOCK:
        job = JOBS.get(jid)
        if not job:
            return jsonify({'error': 'no existe'}), 404
        if job['estado'] in ('listo', 'error'):
            return jsonify({'estado': job['estado'], 'aviso': 'La corrida ya terminó.'})
        job['detener'] = True
        job['log'].append('{}  Detener solicitado: se corta al terminar la foto en curso.'
                          .format(datetime.now().strftime('%H:%M:%S')))
    return jsonify({'estado': 'deteniendo'})


@app.get('/api/corridas')
def api_lista():
    with JOBS_LOCK:
        items = [{'id': j['id'], 'modo': j['modo'], 'estado': j['estado'], 'inicio': j['inicio'],
                  'completadas': j['completadas'], 'total': j['total']} for j in JOBS.values()]
    items.sort(key=lambda x: x['inicio'], reverse=True)
    return jsonify({'corridas': items[:20]})


if __name__ == '__main__':
    print('SuitCVLO-open')
    print('  URL: http://127.0.0.1:{}'.format(PUERTO))
    print('  MODO_MOCK: {}'.format('ACTIVADO' if motor.en_mock() else 'desactivado'))
    if not os.environ.get('CVLO_NO_ABRIR'):
        import webbrowser
        threading.Timer(1.5, lambda: webbrowser.open('http://127.0.0.1:{}'.format(PUERTO))).start()
    app.run(host='127.0.0.1', port=PUERTO, threaded=True, use_reloader=False)
