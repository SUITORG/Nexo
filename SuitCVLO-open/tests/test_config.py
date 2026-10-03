# -*- coding: utf-8 -*-
"""CVLOCFG.txt: parser de rutas y endpoint GET /api/config."""
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ['CVLO_MOCK'] = '1'

import utilidades as U  # noqa: E402

CONFIG = r'''# SuitCVLO-open — rutas
fotos : C:\Users\rojo-\Downloads\cteCVLO1\Recorrido
salida: C:\Users\rojo-\Downloads\cteCVLO1
Pines : C:\Users\rojo-\Downloads\cteCVLO1\GooMapsPines.txt
KML   : C:\Users\rojo-\Downloads\cteCVLO1\RutaKML.kml
idx   : C:\Users\rojo-\Downloads\cteCVLO1\idxfotos.xlsx

clave_rara: se ignora
linea sin dos puntos
'''


def escribir(texto):
    d = tempfile.mkdtemp(prefix='cvlo_cfg_')
    p = os.path.join(d, 'CVLOCFG.txt')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(texto)
    return p


class TestLeerConfigRutas(unittest.TestCase):
    def test_lee_las_cinco_claves_y_conserva_el_c_dos_barras(self):
        r = U.leer_config_rutas(escribir(CONFIG))
        self.assertEqual(len(r), 5)
        # solo se parte por el PRIMER ':' — si no, 'C:' rompería la ruta
        self.assertEqual(r['fotos'], r'C:\Users\rojo-\Downloads\cteCVLO1\Recorrido')
        self.assertEqual(r['pines'], r'C:\Users\rojo-\Downloads\cteCVLO1\GooMapsPines.txt')
        self.assertEqual(r['idx'], r'C:\Users\rojo-\Downloads\cteCVLO1\idxfotos.xlsx')
        self.assertNotIn('clave_rara', r)

    def test_mayusculas_comentarios_y_vacios(self):
        texto = 'FOTOS: D:\\fotos\n# Pines: esto es comentario\n\nsalida :  D:\\salida  \n'
        self.assertEqual(U.leer_config_rutas(escribir(texto)),
                         {'fotos': 'D:\\fotos', 'salida': 'D:\\salida'})

    def test_archivo_inexistente_devuelve_vacio(self):
        self.assertEqual(U.leer_config_rutas(r'C:\no\existe\CVLOCFG.txt'), {})


class TestApiConfig(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # app fija TRABAJO al importarse: hay que apuntarlo a un temporal ANTES de importarlo,
        # o los tests heredarían la carpeta 'trabajo' real (con reads de corridas previas)
        os.environ.setdefault('CVLO_TRABAJO', tempfile.mkdtemp(prefix='cvlo_app_trabajo_'))
        import app as appmod
        appmod.app.config['TESTING'] = True
        cls.cliente = appmod.app.test_client()

    def test_config_del_proyecto(self):
        r = self.cliente.get('/api/config')
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        d = r.get_json()
        self.assertTrue(d['existe'])
        self.assertTrue(d['archivo'].endswith('CVLOCFG.txt'))
        self.assertEqual(sorted(d['rutas']), ['fotos', 'idx', 'kml', 'pines', 'salida'])
        self.assertTrue(d['rutas']['fotos'].lower().endswith('recorrido'))

    def test_config_se_puede_redirigir_con_la_env(self):
        """La env CVLO_CFG cambia el archivo leído (y si no existe, devuelve vacío)."""
        falso = os.path.join(tempfile.mkdtemp(prefix='cvlo_cfg2_'), 'no-existe.txt')
        with mock.patch('app.switch._env',
                        lambda n, d='': falso if n == 'CVLO_CFG' else ''):
            r = self.cliente.get('/api/config')
        self.assertEqual(r.status_code, 200)
        d = r.get_json()
        self.assertTrue(d['archivo'].endswith('no-existe.txt'))   # se usó la env
        self.assertFalse(d['existe'])                             # y no existe -> vacío
        self.assertEqual(d['rutas'], {})


if __name__ == '__main__':
    unittest.main()
