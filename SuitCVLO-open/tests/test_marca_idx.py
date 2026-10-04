# -*- coding: utf-8 -*-
"""Columna `Marca` al final del idxfotos.xlsx: la marca que encontró el sistema.

Se rellena con la misma regla que `PROVEEDOR` del info.txt (KML -> IA validada -> regla del PIN)
pero **sin el ' *'** para que se pueda filtrar en Excel. Se escribe:
  - en cada corrida (por foto leída), y
  - en masa con `reescribir_todo(..., idx=...)` (botón "Reescribir info.txt y Marca").
"""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ['CVLO_MOCK'] = '1'

import motor  # noqa: E402
import proceso  # noqa: E402
from openpyxl import Workbook, load_workbook  # noqa: E402
from tests.test_flujo_mock import crear_fuente  # noqa: E402
from tests.test_prioridad_kml import KML_FIXTURE, _kml_en_temp  # noqa: E402

CABECERA_11 = ['NombreFoto', 'Descripción de lo que anuncia', 'Dirección', 'Tipo de Anuncio',
               'Latitud', 'Longitud', 'Referencias visuales o notas', 'Verificado', 'PIN',
               'FechaHoraFoto', 'FechaHoraSubida']


def _hoja_existente(ruta, filas=()):
    """xlsx como el del usuario: 11 columnas (FechaHoraFoto en la 10)."""
    wb = Workbook()
    ws = wb.active
    ws.title = 'Sheet1'
    ws.append(CABECERA_11)
    for f in filas:
        ws.append(list(f) + [''] * (11 - len(f)))
    wb.save(ruta)
    wb.close()


class TestIdxColMarca(unittest.TestCase):

    def test_se_agrega_al_final_sin_tocar_las_existentes(self):
        ruta = os.path.join(tempfile.mkdtemp(prefix='cvlo_colm_'), 'idx.xlsx')
        _hoja_existente(ruta)
        wb, ws = motor.idx_abrir_o_crear(ruta)
        col = motor.idx_col_marca(ws)
        self.assertEqual(col, 12)                                    # al final de las 11
        self.assertEqual(str(ws.cell(1, 12).value), 'Marca')
        self.assertEqual([ws.cell(1, c).value for c in range(1, 12)], CABECERA_11)
        self.assertEqual(motor.idx_col_marca(ws), 12)                # idempotente
        wb.close()

    def test_reutiliza_una_columna_marca_existente(self):
        ruta = os.path.join(tempfile.mkdtemp(prefix='cvlo_colm2_'), 'idx.xlsx')
        _hoja_existente(ruta)
        wb, ws = motor.idx_abrir_o_crear(ruta)
        ws.cell(1, 5).value = 'Marca'                                # ya existe en la 5
        col = motor.idx_col_marca(ws)
        self.assertEqual(col, 5)
        self.assertEqual(ws.max_column, 11)                          # no agregó otra
        wb.close()

    def test_hoja_nueva_la_marca_queda_despues_de_la_fecha(self):
        wb, ws = motor.idx_abrir_o_crear('')                          # hoja nueva (9 columnas)
        col_f = motor.idx_col_fecha(ws)
        col_m = motor.idx_col_marca(ws)
        self.assertEqual(col_f, 10)
        self.assertEqual(col_m, 11)                                  # al final
        self.assertEqual(str(ws.cell(1, 11).value), 'Marca')
        wb.close()


class TestMarcaVista(unittest.TestCase):
    """La columna Marca = lo que se ve en la foto (IA); si no, la del KML; si ninguna, vacía.

    NO usa la cadena de PROVEEDOR: la regla por prefijo (DF_ -> DIDI) no es una marca vista.
    """

    KML_FILA = {'PIN': 'DF_09_TEST_1', 'MARCA': 'AT&T'}   # la fila del PIN dentro del KML

    def test_gana_lo_que_dice_la_foto(self):
        texto = 'ANUNCIO: SI\nMARCA: Bonafont\nCAMPAÑA: Las Favoritas\nQUE ANUNCIA: agua\n'
        self.assertEqual(proceso._marca_vista(texto, self.KML_FILA), 'Bonafont')

    def test_si_la_foto_no_la_trae_usa_la_del_kml(self):
        texto = 'ANUNCIO: SI\nMARCA: no visible\nQUE ANUNCIA: algo\n'
        self.assertEqual(proceso._marca_vista(texto, self.KML_FILA), 'AT&T')

    def test_ni_foto_ni_kml_queda_vacia_sin_inventar_didi(self):
        texto = 'ANUNCIO: SI\nMARCA: no visible\nQUE ANUNCIA: algo\n'
        self.assertEqual(proceso._marca_vista(texto, {'PIN': 'DF_09_TEST_1'}), '')
        self.assertEqual(proceso._marca_vista(texto, {}), '')

    def test_acepta_marca_fuera_de_la_lista_de_conocidas(self):
        """La lista de marcas valida PROVEEDOR, no esta columna: Bonafon vale aunque no esté."""
        texto = 'MARCA: Bonafont\n'
        self.assertEqual(proceso._marca_vista(texto, {}), 'Bonafont')


class TestCorridaEscribeMarca(unittest.TestCase):

    def _montar(self, prioridad='kml'):
        base = tempfile.mkdtemp(prefix='cvlo_marca_')
        fotos, pines, kml = crear_fuente(base, [('IMG_9001.jpg', '2026-09-14', 25.70002, -100.3500)])
        _kml_en_temp(base)
        idx = os.path.join(base, 'idxfotos.xlsx')
        _hoja_existente(idx)
        params = {'modo': 'local', 'ruta_local': fotos, 'salida': os.path.join(base, 'salida'),
                  'pines': pines, 'drive_pics': '', 'kml': os.path.join(base, 'ruta.kml'),
                  'idx': idx, 'n_fotos': 10, 'radio': 250, 'cap': 10, 'pausa': 0,
                  'trabajo': os.path.join(base, 'trabajo'), 'prioridad': prioridad,
                  '_mock_gps': json.load(open(os.path.join(fotos, 'mock_gps.json'), encoding='utf-8'))}
        return base, params

    @staticmethod
    def _marca_de_fila(params, nombre='img_9001.jpg'):
        wb = load_workbook(params['idx'])
        ws = wb[wb.sheetnames[0]]
        col = motor.idx_col_marca(ws)
        val = ''
        for r in range(2, ws.max_row + 1):
            if str(ws.cell(r, 1).value).lower() == nombre:
                val = ws.cell(r, col).value
                break
        wb.close()
        return col, val

    def test_corrida_escribe_la_marca_que_se_ve(self):
        """La IA (mock) dice DiDi y el KML trae AT&T -> gana la foto, no el KML."""
        _base, params = self._montar('kml')
        proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        col, marca = self._marca_de_fila(params)
        self.assertEqual(col, 12)
        self.assertEqual(marca, 'DiDi')

    def test_corrida_con_prioridad_pines_escribe_la_marca_de_la_ia(self):
        _base, params = self._montar('pines')
        proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        _col, marca = self._marca_de_fila(params)
        self.assertEqual(marca, 'DiDi')            # la prioridad no cambia esta columna

    def test_las_columnas_existentes_quedan_intactas(self):
        _base, params = self._montar('kml')
        proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        wb = load_workbook(params['idx'])
        ws = wb[wb.sheetnames[0]]
        self.assertEqual([ws.cell(1, c).value for c in range(1, 12)], CABECERA_11)
        self.assertEqual(ws.cell(2, 1).value, 'img_9001.jpg')
        self.assertEqual(ws.cell(2, 2).value, 'promoción simulada')   # columna 2 = foto/IA
        wb.close()


class TestReescribirRellenaMarca(unittest.TestCase):

    def test_reescribir_rellena_la_marca_sin_ia(self):
        base = tempfile.mkdtemp(prefix='cvlo_marca2_')
        fotos, pines, kml = crear_fuente(base, [('IMG_9101.jpg', '2026-09-14', 25.70002, -100.3500)])
        _kml_en_temp(base)
        idx = os.path.join(base, 'idxfotos.xlsx')
        params = {'modo': 'local', 'ruta_local': fotos, 'salida': os.path.join(base, 'salida'),
                  'pines': pines, 'drive_pics': '', 'kml': os.path.join(base, 'ruta.kml'),
                  'idx': idx, 'n_fotos': 10, 'radio': 250, 'cap': 10, 'pausa': 0,
                  'trabajo': os.path.join(base, 'trabajo'), 'prioridad': 'pines',
                  '_mock_gps': json.load(open(os.path.join(fotos, 'mock_gps.json'), encoding='utf-8'))}
        proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        resumen = proceso.reescribir_todo(
            params['salida'], motor.cargar_pines(pines), motor.cargar_kml_datos(kml),
            os.path.join(params['trabajo'], 'reads'), prioridad='kml', marcas=set(), idx=idx)
        self.assertEqual(resumen['marcas'], 1)
        wb = load_workbook(idx)
        ws = wb[wb.sheetnames[0]]
        col = motor.idx_col_marca(ws)
        self.assertEqual(ws.cell(2, col).value, 'DiDi')   # la marca de la foto, no la del KML
        self.assertEqual(col, 11)                         # hoja nueva: 9 + fecha(10) + Marca(11)
        wb.close()

    def test_sin_lectura_no_inventa_marca(self):
        """Una fila sin lectura guardada no se rellena (y no se crea la columna por gusto)."""
        base = tempfile.mkdtemp(prefix='cvlo_marca3_')
        fotos, pines, kml = crear_fuente(base, [])
        idx = os.path.join(base, 'idxfotos.xlsx')
        _hoja_existente(idx, filas=[('otra.jpg', 'x', 'd', 't', 1, 2, 'r', '✓', 'DF_09_TEST_1')])
        res = proceso.reescribir_todo(os.path.join(base, 'salida'),
                                      motor.cargar_pines(pines), {},
                                      os.path.join(base, 'trabajo', 'reads'), idx=idx)
        self.assertEqual(res['marcas'], 0)
        self.assertEqual(res['reads'], 0)
        wb = load_workbook(idx)
        ws = wb[wb.sheetnames[0]]
        self.assertEqual(ws.max_column, 11)                       # no agregó columna sin datos
        self.assertEqual([ws.cell(1, c).value for c in range(1, 12)], CABECERA_11)
        wb.close()


if __name__ == '__main__':
    unittest.main()
