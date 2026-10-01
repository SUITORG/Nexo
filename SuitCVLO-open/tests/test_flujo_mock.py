# -*- coding: utf-8 -*-
"""E2E en modo MOCK: proceso completo + API de la app."""
import json
import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ['CVLO_MOCK'] = '1'

from PIL import Image
from openpyxl import load_workbook

import motor
import proceso


def crear_fuente(base, fotos_datos):
    """fotos_datos: [(nombre, fecha, lat, lon)] + mock_gps.json + pines.xlsx."""
    fotos = os.path.join(base, 'fotos')
    os.makedirs(fotos, exist_ok=True)
    mock = {}
    for i, (nombre, fecha, lat, lon) in enumerate(fotos_datos):
        Image.new('RGB', (320, 240), (240 - i * 10, 240, 240)).save(os.path.join(fotos, nombre), quality=90)
        mock[nombre] = {'lat': lat, 'lon': lon, 'fecha': fecha}
    with open(os.path.join(fotos, 'mock_gps.json'), 'w', encoding='utf-8') as f:
        json.dump(mock, f)
    # pines
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = 'Pines'
    ws.append(['PIN', 'LATITUD', 'LONGITUD', 'MEDIO', 'FORMATO', 'ID', 'UBICACIÓN', 'CIUDAD', 'CAPA'])
    ws.append(['DF_09_TEST_1', 25.7000, -100.3500, 'PARABUS', 'FIJO', 'T-1', 'CALLE UNO', 'MTY', 'DIDI PRUEBA'])
    ws.append(['DF_09_TEST_2', 25.7100, -100.3600, 'BILLBOARD', 'FIJO', 'T-2', 'CALLE DOS', 'MTY', 'DIDI PRUEBA'])
    pines = os.path.join(base, 'pines.xlsx')
    wb.save(pines)
    kml = os.path.join(base, 'ruta.kml')
    open(kml, 'w', encoding='utf-8').write('<kml/>')
    return fotos, pines, kml


class TestFlujoMock(unittest.TestCase):

    def test_corrida_completa(self):
        base = tempfile.mkdtemp(prefix='cvlo_e2e_')
        fotos, pines, kml = crear_fuente(base, [
            ('IMG_0001.jpg', '2026-09-14', 25.70002, -100.3500),
            ('IMG_0002.jpg', '2026-09-14', 25.70006, -100.3500),
            ('IMG_0003.jpg', '2026-09-20', 25.71002, -100.3600)])
        salida = os.path.join(base, 'salida')
        idx = os.path.join(base, 'idxfotos.xlsx')
        trabajo = os.path.join(base, 'trabajo')

        params = {'modo': 'local', 'ruta_local': fotos, 'salida': salida, 'pines': pines,
                  'drive_pics': '', 'kml': kml, 'idx': idx, 'n_fotos': 10, 'radio': 250,
                  'cap': 10, 'pausa': 0, 'trabajo': trabajo,
                  '_mock_gps': json.load(open(os.path.join(fotos, 'mock_gps.json'), encoding='utf-8'))}
        eventos = []
        resumen = proceso.ejecutar_corrida(params, lambda c: eventos.append(c), lambda m: eventos.append(m))

        self.assertEqual(resumen['leidas'], 3)
        self.assertEqual(resumen['copiadas'], 3)
        # estructura 260901 y 260902 (según fecha de foto)
        f1 = os.path.join(salida, '260901', 'auditoria', 'DIDI PARABUSES MTY', 'DF_09_TEST_1')
        f3 = os.path.join(salida, '260902', 'auditoria', 'DIDI PANORAMICOS MTY', 'DF_09_TEST_2')
        self.assertTrue(os.path.exists(os.path.join(f1, 'IMG_0001.jpg')))
        self.assertTrue(os.path.exists(os.path.join(f1, 'IMG_0002.jpg')))
        self.assertTrue(os.path.exists(os.path.join(f3, 'IMG_0003.jpg')))
        self.assertTrue(os.path.exists(os.path.join(f1, 'info.txt')))
        info = open(os.path.join(f1, 'info.txt'), encoding='utf-8').read()
        self.assertIn('PIN: DF_09_TEST_1', info)
        self.assertIn('CAMPAÑA:', info)
        # idxfotos creado con 3 filas verificadas
        wb = load_workbook(idx)
        ws = wb['idxfotos']
        self.assertEqual(ws.max_row - 1, 3)
        verif = [ws.cell(r, 8).value for r in range(2, ws.max_row + 1)]
        self.assertEqual(sum(1 for v in verif if v), 3)

        # segunda corrida: no repite nada
        params2 = dict(params)
        params2['_mock_gps'] = params['_mock_gps']
        resumen2 = proceso.ejecutar_corrida(params2, lambda c: None, lambda m: None)
        self.assertEqual(resumen2['leidas'], 0)

    def test_tope_por_pin(self):
        base = tempfile.mkdtemp(prefix='cvlo_cap_')
        fotos, pines, kml = crear_fuente(base, [
            ('IMG_1001.jpg', '2026-09-14', 25.70002, -100.3500),
            ('IMG_1002.jpg', '2026-09-14', 25.70004, -100.3500),
            ('IMG_1003.jpg', '2026-09-14', 25.70006, -100.3500)])
        salida = os.path.join(base, 'salida')
        idx = os.path.join(base, 'idxfotos.xlsx')
        params = {'modo': 'local', 'ruta_local': fotos, 'salida': salida, 'pines': pines,
                  'drive_pics': '', 'kml': kml, 'idx': idx, 'n_fotos': 10, 'radio': 250,
                  'cap': 2, 'pausa': 0, 'trabajo': os.path.join(base, 'trabajo'),
                  '_mock_gps': json.load(open(os.path.join(fotos, 'mock_gps.json'), encoding='utf-8'))}
        resumen = proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        self.assertEqual(resumen['leidas'], 3)
        self.assertEqual(resumen['copiadas'], 2)
        self.assertEqual(resumen['excedidas'], 1)
        wb = load_workbook(idx)
        ws = wb['idxfotos']
        blancos = [r for r in range(2, ws.max_row + 1) if not ws.cell(r, 8).value]
        self.assertEqual(len(blancos), 1)
        nota = str(ws.cell(blancos[0], 7).value or '')
        self.assertIn('excede', nota)


class TestApiMock(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        os.environ['CVLO_MOCK'] = '1'
        os.environ['CVLO_TRABAJO'] = tempfile.mkdtemp(prefix='cvlo_app_trabajo_')
        import app as appmod
        cls.appmod = appmod
        appmod.app.config['TESTING'] = True
        cls.cliente = appmod.app.test_client()

    def test_api_local(self):
        base = tempfile.mkdtemp(prefix='cvlo_api_')
        fotos, pines, kml = crear_fuente(base, [('IMG_2001.jpg', '2026-09-14', 25.70002, -100.3500)])
        salida = os.path.join(base, 'salida')
        idx = os.path.join(base, 'idxfotos.xlsx')
        r = self.cliente.post('/api/corridas', data={
            'modo': 'local', 'ruta_local': fotos, 'salida': salida, 'pines': pines,
            'kml': kml, 'idx': idx, 'n_fotos': '5'}, content_type='multipart/form-data')
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True)[:200])
        jid = r.get_json()['id']
        estado = None
        tope = time.time() + 60
        while time.time() < tope:
            estado = self.cliente.get('/api/corridas/' + jid).get_json()
            if estado['estado'] in ('listo', 'error'):
                break
            time.sleep(0.3)
        self.assertEqual(estado['estado'], 'listo', estado.get('error'))
        self.assertEqual(estado['completadas'], 1)
        self.assertTrue(estado['resumen'] is not None)
        self.assertEqual(estado['resumen']['leidas'], 1)
        # salud
        self.assertEqual(self.cliente.get('/api/estado').status_code, 200)
        self.assertEqual(self.cliente.get('/').status_code, 200)


if __name__ == '__main__':
    unittest.main()
