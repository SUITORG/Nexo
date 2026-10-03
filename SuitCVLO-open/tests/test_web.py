# -*- coding: utf-8 -*-
"""Modo Web/Drive: tope de descargas, fallos permanentes sin espera y progreso."""
import json
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ['CVLO_MOCK'] = '1'

import proceso  # noqa: E402
from tests.test_flujo_mock import crear_fuente  # noqa: E402


class _Item(object):
    def __init__(self, fid, nombre):
        self.id = fid
        self.path = 'subcarpeta/' + nombre


def _fotos_drive(n, ext='.jpg'):
    return [_Item('fid%02d' % i, 'IMG_%04d%s' % (i, ext)) for i in range(1, n + 1)]


def _bajar(id=None, output=None, quiet=True):
    """gdown.download de mentira: escribe una imagen de 1 byte."""
    with open(output, 'wb') as f:
        f.write(b'\xff\xd8\xff\xe0')
    return output


class BaseWeb(unittest.TestCase):
    """Base: entorno MOCK (GPS por nombre), sin sleeps reales y gdown parchado."""

    def montar(self, items, n_fotos=5, max_descargas=300, download=_bajar):
        base = tempfile.mkdtemp(prefix='cvlo_web_')
        fotos, pines, kml = crear_fuente(base, [])
        mock_gps = {'IMG_%04d.jpg' % i: {'lat': 25.70002, 'lon': -100.3500,
                                         'fecha': '2026-09-14'} for i in range(1, 40)}
        self.params = {
            'modo': 'web', 'drive_pics': 'https://drive.google.com/drive/folders/xyz',
            'ruta_local': '', 'salida': os.path.join(base, 'salida'), 'pines': pines,
            'kml': kml, 'idx': os.path.join(base, 'idxfotos.xlsx'), 'n_fotos': n_fotos,
            'radio': 250, 'cap': 10, 'pausa': 0, 'max_descargas': max_descargas,
            'trabajo': os.path.join(base, 'trabajo'), '_mock_gps': mock_gps,
            '_detener': lambda: False,
        }
        self.log = []
        self.sleeps = []
        self.gdown = mock.MagicMock()
        for p in (mock.patch('motor.en_mock', lambda: True),
                  mock.patch.object(proceso, 'gdown', self.gdown),
                  mock.patch.object(proceso.time, 'sleep', lambda s: self.sleeps.append(s))):
            p.start()
            self.addCleanup(p.stop)
        self.gdown.download_folder.return_value = items
        self.gdown.download.side_effect = download

    def correr(self):
        return proceso.ejecutar_corrida(self.params, lambda c: None, self.log.append)


class TestTopeDescargas(BaseWeb):
    def test_el_tope_corta_y_lo_explica(self):
        self.montar(_fotos_drive(30), n_fotos=5, max_descargas=3)
        self.correr()
        texto = '\n'.join(self.log)
        self.assertEqual(self.gdown.download.call_count, 3)
        self.assertIn('Tope de 3 descargas alcanzado', texto)
        self.assertIn('Modo Local', texto)
        self.assertIn('Descargas nuevas: 3', texto)

    def test_sin_tope_sigue_hasta_las_candidatas(self):
        self.montar(_fotos_drive(30), n_fotos=5, max_descargas=300)
        self.correr()
        texto = '\n'.join(self.log)
        self.assertNotIn('Tope de', texto)
        self.assertEqual(self.gdown.download.call_count, 5)
        self.assertIn('Descargas nuevas: 5', texto)


class TestFalloDePermiso(BaseWeb):
    def test_no_duerme_en_fallos_permanentes(self):
        def sin_permiso(id=None, output=None, quiet=True):
            raise RuntimeError('Failed to retrieve public link of the file. You '
                               'cannot see the file because it is not shared publicly.')
        self.montar(_fotos_drive(20), n_fotos=5, download=sin_permiso)
        self.correr()
        texto = '\n'.join(self.log)
        # ningún sleep(5): reintentar un fallo de permiso es tiempo tirado
        self.assertNotIn(5, self.sleeps)
        self.assertIn('Descargas nuevas: 0 · sin permiso: 20', texto)
        # no inunda el log: solo las primeras 3 y cada 25ª
        self.assertLessEqual(texto.count('descarga sin permiso'), 6)

    def test_en_fallo_de_red_si_espera(self):
        def caida(id=None, output=None, quiet=True):
            raise RuntimeError('urlopen error: connection reset by peer')
        self.montar(_fotos_drive(4), n_fotos=5, download=caida)
        self.correr()
        texto = '\n'.join(self.log)
        self.assertIn(5, self.sleeps)              # espera reintentable
        self.assertIn('errores de red: 4', texto)


class TestProgreso(BaseWeb):
    def test_log_cada_10_descargas(self):
        self.montar(_fotos_drive(30), n_fotos=10, max_descargas=300)
        self.correr()
        texto = '\n'.join(self.log)
        self.assertIn('Fotos en Drive: 30', texto)
        self.assertIn('descargando 10/30 · candidatas', texto)
        self.assertIn('sin permiso 0', texto)

    def test_excluye_las_que_ya_estan_procesadas(self):
        # nombre ya verificado en idxfotos -> no se descarga
        base = tempfile.mkdtemp(prefix='cvlo_web_excl_')
        fotos, pines, kml = crear_fuente(base, [])
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.title = 'idxfotos'
        ws.append(['NombreFoto', 'Descripción de lo que anuncia', 'Dirección', 'Tipo de Anuncio',
                   'Latitud', 'Longitud', 'Referencias visuales o notas', 'Verificado', 'PIN'])
        ws.append(['IMG_0001.jpg', 'x', 'y', 'mupi', 1, 2, 'r', 'ok', 'DF_09_TEST_1'])
        wb.save(os.path.join(base, 'idxfotos.xlsx'))

        self.montar(_fotos_drive(6), n_fotos=5)
        self.params['idx'] = os.path.join(base, 'idxfotos.xlsx')
        self.correr()
        llamadas = [c[1] for c in self.gdown.download.call_args_list]
        self.assertFalse(any('IMG_0001' in str(o) for o in llamadas))


if __name__ == '__main__':
    unittest.main()
