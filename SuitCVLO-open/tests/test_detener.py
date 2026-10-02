# -*- coding: utf-8 -*-
"""Pruebas del botón Detener y de la validación de rutas (regresión del 500)."""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ['CVLO_MOCK'] = '1'

from tests.test_flujo_mock import crear_fuente  # noqa: E402
import proceso  # noqa: E402


class TestDetener(unittest.TestCase):
    def test_detener_salta_las_lecturas(self):
        base = tempfile.mkdtemp(prefix='cvlo_stop_')
        fotos, pines, kml = crear_fuente(base, [
            ('IMG_7001.jpg', '2026-09-14', 25.70002, -100.3500),
            ('IMG_7002.jpg', '2026-09-14', 25.70004, -100.3500)])
        params = {'modo': 'local', 'ruta_local': fotos, 'salida': os.path.join(base, 'salida'),
                  'pines': pines, 'drive_pics': '', 'kml': kml,
                  'idx': os.path.join(base, 'idxfotos.xlsx'), 'n_fotos': 10, 'radio': 250,
                  'cap': 10, 'pausa': 0, 'trabajo': os.path.join(base, 'trabajo'),
                  '_mock_gps': json.load(open(os.path.join(fotos, 'mock_gps.json'), encoding='utf-8')),
                  '_detener': lambda: True}
        resumen = proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        self.assertTrue(resumen['detenida'])
        self.assertEqual(resumen['leidas'], 0)
        self.assertEqual(resumen['copiadas'], 0)


class TestValidacionRutas(unittest.TestCase):
    """Lo que antes era 500 (PermissionError al abrir una carpeta como archivo)."""

    @classmethod
    def setUpClass(cls):
        os.environ['CVLO_MOCK'] = '1'
        os.environ['CVLO_TRABAJO'] = tempfile.mkdtemp(prefix='cvlo_val_')
        import app as appmod
        appmod.app.config['TESTING'] = True
        cls.cliente = appmod.app.test_client()

    def _post(self, data):
        return self.cliente.post('/api/corridas', data=data, content_type='multipart/form-data')

    def test_web_con_carpeta_devuelve_400(self):
        base = tempfile.mkdtemp(prefix='cvlo_dir_')
        r = self._post({'modo': 'web', 'drive_pics': base, 'salida': base,
                        'pines': base, 'kml': base, 'idx': os.path.join(base, 'i.xlsx'),
                        'n_fotos': '5'})
        self.assertEqual(r.status_code, 400, r.get_data(as_text=True))
        self.assertIn('CARPETA', r.get_json()['error'])

    def test_local_con_archivo_devuelve_400(self):
        base = tempfile.mkdtemp(prefix='cvlo_file_')
        archivo = os.path.join(base, 'foto.jpg')
        open(archivo, 'wb').close()
        r = self._post({'modo': 'local', 'ruta_local': archivo, 'salida': base,
                        'pines': base, 'kml': base, 'idx': os.path.join(base, 'i.xlsx')})
        self.assertEqual(r.status_code, 400, r.get_data(as_text=True))
        self.assertIn('archivo', r.get_json()['error'])

    def test_numero_invalido_devuelve_400(self):
        base = tempfile.mkdtemp(prefix='cvlo_num_')
        r = self._post({'modo': 'local', 'ruta_local': base, 'salida': base,
                        'pines': base, 'kml': base, 'idx': os.path.join(base, 'i.xlsx'),
                        'n_fotos': 'cinco'})
        self.assertEqual(r.status_code, 400, r.get_data(as_text=True))

    def test_detener_inexistente_404(self):
        r = self.cliente.post('/api/corridas/noexiste/detener')
        self.assertEqual(r.status_code, 404)


if __name__ == '__main__':
    unittest.main()
