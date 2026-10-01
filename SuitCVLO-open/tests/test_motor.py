# -*- coding: utf-8 -*-
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import motor


class TestMotor(unittest.TestCase):

    def test_quincena(self):
        self.assertEqual(motor.quincena_de('2026-09-14'), '260901')
        self.assertEqual(motor.quincena_de('2026-09-15'), '260901')
        self.assertEqual(motor.quincena_de('2026-09-16'), '260902')
        self.assertEqual(motor.quincena_de('2026-09-20'), '260902')
        self.assertIsNone(motor.quincena_de(None))

    def test_campo(self):
        t = 'ANUNCIO: SI\nMARCA CAMPAÑA: DiDi Élite\nQUE ANUNCIA: promo\n'
        self.assertEqual(motor.campo(t, 'MARCA'), 'DiDi Élite')
        self.assertEqual(motor.campo(t, 'QUE ANUNCIA'), 'promo')

    def test_grupos(self):
        d1 = {'MEDIO': 'PARABUS', 'CAPA': 'DIDI SEPTIEMBRE (1).xlsx'}
        self.assertEqual(motor.grupo_de('DF_09_ELITE_1', d1), 'DIDI PARABUSES MTY')
        d2 = {'MEDIO': 'PANELESTACION/METRO'}
        self.assertEqual(motor.grupo_de('DF_09_LOANS_2', d2), 'DIDI PANELESTACION-METRO MTY')
        d3 = {'MEDIO': 'CARTELERA', 'MARCA': 'AT&T'}
        self.assertEqual(motor.grupo_de('COM-11', d3), 'AT&T CARTELERAS MTY')
        d4 = {'CLIENTE': 'COPPEL MAX'}
        self.assertEqual(motor.grupo_de('PF_COP_09_1', d4), 'COPPEL MAX PARABUSES MTY')
        d5 = {'MEDIO': 'BILLBOARD'}
        self.assertEqual(motor.grupo_de('DF_09_LOANS_3', d5), 'DIDI PANORAMICOS MTY')

    def test_gps_hemisferio(self):
        # foto sintética sin EXIF -> (None, None, None)
        from PIL import Image
        base = tempfile.mkdtemp(prefix='cvlo_gps_')
        p = os.path.join(base, 'x.jpg')
        Image.new('RGB', (10, 10), 'white').save(p)
        lat, lon, fecha = motor.gps_y_fecha(p)
        self.assertIsNone(lat)
        self.assertIsNone(lon)

    def test_idx_crear_y_upsert(self):
        base = tempfile.mkdtemp(prefix='cvlo_idx_')
        ruta = os.path.join(base, 'idxfotos.xlsx')
        wb, ws = motor.idx_abrir_o_crear(ruta)
        pos, verif = motor.idx_filas(ws)
        self.assertEqual(len(pos), 0)
        motor.idx_upsert(ws, pos, ['IMG_1.jpg', 'x', 'd', 't', 1, 2, 'r', '✓', 'P1'])
        motor.idx_upsert(ws, pos, ['IMG_2.jpg', 'y', 'd', 't', 1, 2, 'r', '', 'P1'])
        guardado = motor.idx_guardar(wb, ruta)
        self.assertTrue(os.path.exists(guardado))
        wb2, ws2 = motor.idx_abrir_o_crear(ruta)
        pos2, verif2 = motor.idx_filas(ws2)
        self.assertEqual(len(pos2), 2)
        self.assertIn('IMG_1.jpg', verif2)
        self.assertNotIn('IMG_2.jpg', verif2)
        # upsert reemplaza sin duplicar
        motor.idx_upsert(ws2, pos2, ['IMG_1.jpg', 'z', 'd', 't', 1, 2, 'r', '✓', 'P1'])
        self.assertEqual(ws2.max_row - 1, 2)


if __name__ == '__main__':
    unittest.main()
