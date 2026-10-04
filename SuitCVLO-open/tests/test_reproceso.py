# -*- coding: utf-8 -*-
"""Reproceso de fotos incompletas: preview, respaldo, limpieza de Verificado y releído."""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ['CVLO_MOCK'] = '1'

import motor  # noqa: E402
import proceso  # noqa: E402
from tests.test_flujo_mock import crear_fuente  # noqa: E402


class TestReproceso(unittest.TestCase):
    """Estado inicial: 3 fotos leídas; luego se vuelven incompletas 7601 (sin lectura) y 7602 (formato viejo)."""

    def _montar(self):
        base = tempfile.mkdtemp(prefix='cvlo_repro_')
        fotos, pines, kml = crear_fuente(base, [
            ('IMG_7601.jpg', '2026-09-14', 25.70002, -100.3500),
            ('IMG_7602.jpg', '2026-09-14', 25.70004, -100.3500),
            ('IMG_7603.jpg', '2026-09-14', 25.70006, -100.3500)])
        params = {'modo': 'local', 'ruta_local': fotos, 'salida': os.path.join(base, 'salida'),
                  'pines': pines, 'drive_pics': '', 'kml': kml,
                  'idx': os.path.join(base, 'idxfotos.xlsx'), 'n_fotos': 10, 'radio': 250,
                  'cap': 10, 'pausa': 0, 'trabajo': os.path.join(base, 'trabajo'),
                  '_mock_gps': json.load(open(os.path.join(fotos, 'mock_gps.json'), encoding='utf-8'))}
        proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)   # corrida 1: las 3 completas

        reads = os.path.join(base, 'trabajo', 'reads')
        os.remove(os.path.join(reads, 'img_7601.json'))                   # 7601 -> sin lectura
        viejo = os.path.join(reads, 'img_7602.json')
        d = json.load(open(viejo, encoding='utf-8'))
        d['texto'] = 'ANUNCIO: SI\nMARCA CAMPAÑA: DiDi\nQUE ANUNCIA: promo\n'   # 7602 -> formato viejo
        json.dump(d, open(viejo, 'w', encoding='utf-8'), ensure_ascii=False)
        return base, params

    @staticmethod
    def _filas(params):
        """{nombre en minúsculas: fila} del idxfotos."""
        wb, ws = motor.idx_abrir_o_crear(params['idx'])
        pos, _v = motor.idx_filas(ws)
        out = {n.lower(): r for n, r in pos.items()}
        wb.close()
        return out

    @staticmethod
    def _hoja(params):
        wb, ws = motor.idx_abrir_o_crear(params['idx'])
        return wb, ws

    def test_preview_cuenta_solo_las_incompletas(self):
        _base, params = self._montar()
        obj, sin_origen, sin_lectura, viejo = proceso._objetivos_reproceso(params)
        self.assertEqual(obj, ['img_7601', 'img_7602'])   # 7603 tiene lectura nueva -> no
        self.assertEqual(len(sin_lectura), 1)
        self.assertEqual(len(viejo), 1)
        self.assertEqual(sin_origen, [])

    def test_preparar_respalda_y_limpia_solo_las_objetivas(self):
        base, params = self._montar()
        res = proceso.preparar_reproceso(params, lambda m: None)
        self.assertEqual(res['objetivas'], 2)
        self.assertEqual(res['limpiadas'], 2)
        self.assertEqual(res['sin_origen'], 0)
        # respaldo creado junto al xlsx
        self.assertTrue(res['respaldo'])
        self.assertTrue(os.path.exists(res['respaldo']))

        wb, ws = self._hoja(params)
        pos, _v = motor.idx_filas(ws)
        fila = {k.lower(): v for k, v in pos.items()}
        self.assertEqual(str(ws.cell(fila['img_7601.jpg'], 8).value or ''), '')   # limpiada
        self.assertEqual(str(ws.cell(fila['img_7602.jpg'], 8).value or ''), '')   # limpiada
        self.assertEqual(str(ws.cell(fila['img_7603.jpg'], 8).value or ''), '✓')  # intacta
        wb.close()

    def test_corrida_con_reproceso_relee_sin_duplicar_filas(self):
        base, params = self._montar()
        proceso.preparar_reproceso(params, lambda m: None)
        antes = self._filas(params)
        params2 = dict(params, _reproceso=True)
        res = proceso.ejecutar_corrida(params2, lambda c: None, lambda m: None)

        self.assertEqual(res['leidas'], 2)                 # 7601 y 7602 releídas; 7603 no
        despues = self._filas(params)
        self.assertEqual(len(despues), len(antes))         # MISMO número de filas (sin duplicados)
        self.assertEqual(set(despues), set(antes))
        # y la releída vuelve a quedar verificada
        wb, ws = self._hoja(params)
        pos, _v = motor.idx_filas(ws)
        fila = {k.lower(): v for k, v in pos.items()}
        self.assertEqual(str(ws.cell(fila['img_7601.jpg'], 8).value or ''), '✓')
        wb.close()

    def test_fotos_sin_origen_no_se_tocan(self):
        base, params = self._montar()
        # una "copia huérfana": existe en la salida pero no en la ruta de fotos
        origen = None
        for raiz, _s, archivos in os.walk(params['salida']):
            for a in archivos:
                if a.lower().endswith('.jpg'):
                    origen = os.path.join(raiz, a)
                    break
            if origen:
                break
        self.assertIsNotNone(origen)
        import shutil
        destino = os.path.join(params['salida'], 'huérfana.jpg')
        shutil.copy2(origen, destino)

        obj, sin_origen, _sl, _v = proceso._objetivos_reproceso(params)
        self.assertIn('huérfana', [p for p in obj + sin_origen if 'huérfana' in p][0])
        self.assertEqual(len(sin_origen), 1)
        self.assertNotIn('huérfana', obj)                  # no se toca

    def test_sin_reproceso_se_comporta_como_antes(self):
        """Regresión: por defecto siguen excluyendo copias y lecturas."""
        _base, params = self._montar()
        excl_norm = proceso._excluidos(params['salida'], set(),
                                       os.path.join(params['trabajo'], 'reads'))
        self.assertIn('img_7601', excl_norm)               # copiada -> excluida
        self.assertIn('img_7603', excl_norm)               # leída -> excluida
        excl_rep = proceso._excluidos(params['salida'], set(),
                                      os.path.join(params['trabajo'], 'reads'), reproceso=True)
        self.assertNotIn('img_7601', excl_rep)             # copiada -> ya no excluye
        self.assertNotIn('img_7602', excl_rep)             # lectura vieja -> candidata
        self.assertIn('img_7603', excl_rep)                # lectura nueva -> sigue excluida


if __name__ == '__main__':
    unittest.main()
