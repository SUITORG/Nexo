# -*- coding: utf-8 -*-
"""Prioridad de la fuente (KML manda), marcas conocidas y reescritura de info.txt.

Reglas del usuario (2026-10-04):
  1. El PIN y las coordenadas/dirección del soporte salen del KML; si el KML no tiene el
     PIN, del mapa de pines. Si la foto y el KML difieren en metros, gana el KML.
  1A. KML sin MARCA y foto sin marca -> regla por prefijo de PIN + ' *'.
  2A. Marca de la foto fuera de la lista de conocidas -> se descarta -> regla + ' *'
      (sin archivo de marcas = sin validación).
  2.  En info.txt manda siempre el KML. En idxfotos.xlsx manda la foto.
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
import utilidades as U  # noqa: E402
from tests.test_flujo_mock import crear_fuente  # noqa: E402

TEXTO_IA = ('ANUNCIO: SI\n'
            'MARCA: DiDi\n'
            'CAMPAÑA: Promo verano\n'
            'QUE ANUNCIA: promociona delivery\n'
            'TEXTO VISIBLE: pide y recibe\n'
            'REFERENCIAS UBICACION: esquina\n'
            'TIPO SOPORTE: parabus\nCARA: frente')

# DF_09_TEST_1/2 comparten coordenadas con los pines del fixture (el cruce sigue funcionando);
# DF_09_TEST_1 trae los campos del soporte y una MARCA con HTML crudo (AT&amp;T);
# COM_SOLO_KML solo existe en el KML y trae COORDENADAS (como la capa COMPETENCIA).
KML_FIXTURE = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n'
    '  <Folder><name>CAPA PRUEBA (1).xlsx</name>\n'
    '    <Placemark><name>DF_09_TEST_1</name><ExtendedData>\n'
    '      <Data name="LATITUD"><value>25.7000</value></Data>\n'
    '      <Data name="LONGITUD"><value>-100.3500</value></Data>\n'
    '      <Data name="UBICACIÓN"><value>AVENIDA DESDE EL KML</value></Data>\n'
    '      <Data name="MEDIO"><value>ESPECTACULAR</value></Data>\n'
    '      <Data name="MARCA"><value>AT&amp;T</value></Data>\n'
    '    </ExtendedData></Placemark>\n'
    '    <Placemark><name>DF_09_TEST_2</name><ExtendedData>\n'
    '      <Data name="LATITUD"><value>25.7100</value></Data>\n'
    '      <Data name="LONGITUD"><value>-100.3600</value></Data>\n'
    '    </ExtendedData></Placemark>\n'
    '    <Placemark><name>COM_SOLO_KML</name><ExtendedData>\n'
    '      <Data name="COORDENADAS"><value>25.7200,-100.3700</value></Data>\n'
    '      <Data name="DIRECCIÓN"><value>CALLE DEL KML</value></Data>\n'
    '      <Data name="MARCA"><value>MOVISTAR</value></Data>\n'
    '    </ExtendedData></Placemark>\n'
    '  </Folder>\n'
    '</Document></kml>\n')

PINES_D = {
    'DF_09_TEST_1': {'PIN': 'DF_09_TEST_1', 'lat': 25.7000, 'lon': -100.3500,
                     'MEDIO': 'PARABUS', 'UBICACIÓN': 'CALLE UNO', 'CAPA': 'DIDI PRUEBA'},
    'DF_09_TEST_2': {'PIN': 'DF_09_TEST_2', 'lat': 25.7100, 'lon': -100.3600,
                     'MEDIO': 'BILLBOARD', 'UBICACIÓN': 'CALLE DOS', 'CAPA': 'DIDI PRUEBA'},
}


def _kml_en_temp(base, contenido=KML_FIXTURE):
    ruta = os.path.join(base, 'ruta.kml')
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write(contenido)
    return ruta


def _carga_kml(base):
    return motor.cargar_kml_datos(_kml_en_temp(base))


class TestFuenteCruce(unittest.TestCase):
    """El cruce foto->PIN: con `kml` manda el KML; los PINs del mapa de pines siguen."""

    def test_kml_manda_las_coordenadas_del_cruce(self):
        kml = {'DF_09_TEST_1': dict(PINES_D['DF_09_TEST_1'], lat=25.80, lon=-100.45)}
        # la foto está sobre el punto de los PINES pero el KML lo pone a ~4 km
        pin_pines, _ = proceso._elegir_pin(25.70, -100.35,
                                           proceso._fuente_cruce(PINES_D, {}, 'pines'), 250)
        pin_kml, _ = proceso._elegir_pin(25.70, -100.35,
                                         proceso._fuente_cruce(PINES_D, kml, 'kml'), 250)
        self.assertEqual(pin_pines, 'DF_09_TEST_1')   # como siempre
        self.assertIsNone(pin_kml)                    # el KML manda -> fuera de radio

    def test_pin_solo_del_kml_es_cruzaible(self):
        kml = {'COM_SOLO_KML': {'PIN': 'COM_SOLO_KML', 'lat': 25.7200, 'lon': -100.3700}}
        fuente = proceso._fuente_cruce(PINES_D, kml, 'kml')
        self.assertEqual(sorted(fuente), ['COM_SOLO_KML', 'DF_09_TEST_1', 'DF_09_TEST_2'])
        pin, dm = proceso._elegir_pin(25.7200, -100.3700, fuente, 250)
        self.assertEqual(pin, 'COM_SOLO_KML')
        self.assertLess(dm, 5)
        # con prioridad pines ese PIN no existe
        self.assertIsNone(proceso._elegir_pin(25.7200, -100.3700,
                                              proceso._fuente_cruce(PINES_D, kml, 'pines'), 250)[0])

    def test_prioridad_pines_no_usa_el_kml(self):
        kml = {'X': {'PIN': 'X', 'lat': 1.0, 'lon': 1.0}}
        self.assertEqual(proceso._fuente_cruce(PINES_D, kml, 'pines'), PINES_D)

    def test_coordenadas_desde_el_campo_coordenadas(self):
        """Los 14 PINs de COMPETENCIA traen 'COORDENADAS: lat,lon' en vez de LATITUD."""
        base = tempfile.mkdtemp(prefix='cvlo_coo_')
        d = motor.cargar_kml_datos(_kml_en_temp(base))
        self.assertIn('lat', d['COM_SOLO_KML'])
        self.assertEqual(d['COM_SOLO_KML']['lat'], 25.7200)
        self.assertEqual(d['COM_SOLO_KML']['lon'], -100.3700)
        self.assertEqual(motor.kml_resumen(d)['sin_lat'], 0)

    def test_marca_del_kml_sin_html(self):
        """El KML trae AT&amp;T; al escribirlo tiene que salir AT&T."""
        base = tempfile.mkdtemp(prefix='cvlo_unesc_')
        d = motor.cargar_kml_datos(_kml_en_temp(base))
        self.assertEqual(d['DF_09_TEST_1']['MARCA'], 'AT&T')


class TestBloqueInfo(unittest.TestCase):
    """info.txt: con prioridad kml manda el KML; lo demás lleva ' *'."""

    def _bloque(self, d_pin, kml_pin=None, prioridad='kml', marcas=None, texto=TEXTO_IA,
                lat=25.70002, lon=-100.35002):
        base = tempfile.mkdtemp(prefix='cvlo_blq_')
        kml = _carga_kml(base).get(kml_pin or d_pin.get('PIN', ''), {}) if kml_pin is not False else {}
        return proceso._bloque_info(texto, d_pin, kml, lat, lon, foto='IMG_1.jpg',
                                    prioridad=prioridad, marcas=marcas)

    def test_kml_manda_el_proveedor_sin_estrella(self):
        b = self._bloque(dict(PINES_D['DF_09_TEST_1']))
        self.assertEqual(self._linea(b, 'PROVEEDOR'), 'PROVEEDOR: AT&T')   # sin ' *'
        self.assertEqual(self._linea(b, 'MEDIO'), 'MEDIO: ESPECTACULAR')   # del KML, no PARABUS
        self.assertEqual(self._linea(b, 'UBICACIÓN'), 'UBICACIÓN: AVENIDA DESDE EL KML')
        self.assertEqual(self._linea(b, 'CAMPAÑA'), 'CAMPAÑA: Promo verano')   # sigue siendo de la IA

    def test_lat_lon_del_kml_sobre_la_foto(self):
        """Si la foto y el KML difieren en metros, se queda la lat/long del KML."""
        b = self._bloque(dict(PINES_D['DF_09_TEST_1']))
        self.assertEqual(self._linea(b, 'LATITUD'), 'LATITUD: 25.7000')
        self.assertEqual(self._linea(b, 'LONGITUD'), 'LONGITUD: -100.3500')

    def test_ia_validada_en_la_lista_lleva_estrella(self):
        base = tempfile.mkdtemp(prefix='cvlo_ia1_')
        marcas = U.leer_marcas(_escribir_marcas(base, ['DiDi']))
        kml = motor.cargar_kml_datos(_kml_en_temp(base))['DF_09_TEST_2']   # sin MARCA
        b = proceso._bloque_info(TEXTO_IA, dict(PINES_D['DF_09_TEST_2']), kml,
                                 25.71, -100.36, foto='a.jpg', marcas=marcas)
        self.assertEqual(self._linea(b, 'PROVEEDOR'), 'PROVEEDOR: DiDi *')

    def test_ia_fuera_de_la_lista_usa_la_regla_del_pin(self):
        """2A: marca desconocida -> se descarta; 1A: regla por prefijo + ' *'."""
        base = tempfile.mkdtemp(prefix='cvlo_ia2_')
        marcas = U.leer_marcas(_escribir_marcas(base, ['Coppel']))
        kml = motor.cargar_kml_datos(_kml_en_temp(base))['DF_09_TEST_1']   # MARCA: AT&T
        # caso 1: el KML sí trae marca -> manda la del KML aunque la IA diga otra
        b = proceso._bloque_info(TEXTO_IA, dict(PINES_D['DF_09_TEST_1']), kml,
                                 25.70, -100.35, foto='a.jpg', marcas=marcas)
        self.assertEqual(self._linea(b, 'PROVEEDOR'), 'PROVEEDOR: AT&T')
        # caso 2: KML sin marca -> la IA 'DiDi' no está en la lista -> regla del PIN
        kml2 = motor.cargar_kml_datos(_kml_en_temp(base))['DF_09_TEST_2']
        b2 = proceso._bloque_info(TEXTO_IA, dict(PINES_D['DF_09_TEST_2']), kml2,
                                  25.71, -100.36, foto='a.jpg', marcas=marcas)
        self.assertEqual(self._linea(b2, 'PROVEEDOR'), 'PROVEEDOR: DIDI *')

    def test_sin_archivo_de_marcas_no_valida(self):
        """2A: sin lista -> la marca de la IA se acepta (con ' *' porque no es del KML)."""
        b = self._bloque(dict(PINES_D['DF_09_TEST_2']), marcas=set())
        self.assertEqual(self._linea(b, 'PROVEEDOR'), 'PROVEEDOR: DiDi *')

    def test_foto_sin_marca_y_kml_sin_marca_usa_la_regla(self):
        """1A: escenario C extremo -> DIDI + ' *'."""
        texto = TEXTO_IA.replace('MARCA: DiDi', 'MARCA: no visible')
        b = self._bloque(dict(PINES_D['DF_09_TEST_2']), texto=texto, marcas={'didi'})
        self.assertEqual(self._linea(b, 'PROVEEDOR'), 'PROVEEDOR: DIDI *')

    def test_prioridad_pines_comportamiento_viejo(self):
        """Con prioridad pines todo queda como antes: sin estrella y la foto manda en lat/lon."""
        b = self._bloque(dict(PINES_D['DF_09_TEST_1']), prioridad='pines', marcas={'otra'})
        self.assertEqual(self._linea(b, 'PROVEEDOR'), 'PROVEEDOR: DiDi')     # IA, sin ' *'
        self.assertEqual(self._linea(b, 'MEDIO'), 'MEDIO: PARABUS')          # de los pines
        self.assertEqual(self._linea(b, 'LATITUD'), 'LATITUD: 25.70002')    # EXIF de la foto

    @staticmethod
    def _linea(bloque, campo):
        for l in bloque.splitlines():
            if l.startswith(campo + ':'):
                return l
        return ''


def _escribir_marcas(base, marcas):
    ruta = os.path.join(base, 'marcas.txt')
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write('\n'.join(marcas) + '\n')
    return ruta


class TestCorridaYReescritura(unittest.TestCase):
    """De punta a punta: la corrida escribe info.txt desde el KML y el xlsx no cambia."""

    def _montar(self, prioridad='kml'):
        base = tempfile.mkdtemp(prefix='cvlo_prio_')
        fotos, pines, kml = crear_fuente(base, [
            ('IMG_8001.jpg', '2026-09-14', 25.70002, -100.3500)])
        _kml_en_temp(base)                       # sobrescribe el <kml/> vacío del fixture
        kml = os.path.join(base, 'ruta.kml')
        params = {'modo': 'local', 'ruta_local': fotos, 'salida': os.path.join(base, 'salida'),
                  'pines': pines, 'drive_pics': '', 'kml': kml,
                  'idx': os.path.join(base, 'idxfotos.xlsx'), 'n_fotos': 10, 'radio': 250,
                  'cap': 10, 'pausa': 0, 'trabajo': os.path.join(base, 'trabajo'),
                  'prioridad': prioridad,
                  '_mock_gps': json.load(
                      open(os.path.join(fotos, 'mock_gps.json'), encoding='utf-8'))}
        return base, params

    @staticmethod
    def _info(params):
        ruta = os.path.join(params['salida'], '260901', 'auditoria',
                            'DIDI PARABUSES MTY', 'DF_09_TEST_1', 'info.txt')
        return open(ruta, encoding='utf-8').read()

    def test_corrida_escribe_info_desde_el_kml(self):
        _base, params = self._montar('kml')
        res = proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        self.assertEqual(res['leidas'], 1)
        info = self._info(params)
        self.assertIn('PROVEEDOR: AT&T', info)                  # del KML, sin ' *'
        self.assertIn('MEDIO: ESPECTACULAR', info)              # del KML
        self.assertIn('UBICACIÓN: AVENIDA DESDE EL KML', info)
        self.assertIn('CAMPAÑA: Promo verano', info)            # de la IA (el KML no lo trae)
        self.assertIn('LATITUD: 25.7000\n', info)               # del KML, no el EXIF
        self.assertIn('COORDENADAS: 25.7000, -100.3500', info)  # cabecera desde el KML

    def test_xlsx_sigue_mandando_la_foto(self):
        """2: en idxfotos.xlsx no cambia NADA: mismas columnas, datos de la foto."""
        _base, params = self._montar('kml')
        proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        from openpyxl import load_workbook
        wb = load_workbook(params['idx'])
        ws = wb['idxfotos'] if 'idxfotos' in wb.sheetnames else wb[wb.sheetnames[0]]
        self.assertEqual([ws.cell(1, c).value for c in range(1, 10)], motor.IDX_HEADERS)
        self.assertEqual(ws.cell(2, 1).value, 'img_8001.jpg')
        self.assertEqual(ws.cell(2, 2).value, 'promoción simulada')   # columna 2 = IA (foto)
        self.assertEqual(ws.cell(2, 4).value, 'parabús')               # columna 4 = IA (foto)
        self.assertEqual(ws.cell(2, 8).value, '✓')
        self.assertEqual(ws.cell(2, 9).value, 'DF_09_TEST_1')
        wb.close()

    def test_reescribir_todo_sin_ia_cambia_la_prioridad(self):
        """El botón 'Reescribir info.txt': aplica otra prioridad sin releer ninguna foto."""
        base, params = self._montar('pines')
        proceso.ejecutar_corrida(params, lambda c: None, lambda m: None)
        antes = self._info(params)
        self.assertIn('PROVEEDOR: DiDi\n', antes)      # sin estrella: prioridad pines
        self.assertIn('MEDIO: PARABUS', antes)

        pdatos = motor.cargar_pines(params['pines'])
        kdatos = motor.cargar_kml_datos(params['kml'])
        res = proceso.reescribir_todo(params['salida'], pdatos, kdatos,
                                      os.path.join(params['trabajo'], 'reads'),
                                      prioridad='kml', marcas=set())
        self.assertEqual(res['reescritas'], 1)
        self.assertEqual(res['reads'], 1)
        despues = self._info(params)
        self.assertIn('PROVEEDOR: AT&T', despues)      # ahora manda el KML
        self.assertIn('MEDIO: ESPECTACULAR', despues)
        # el índice no se tocó: una sola fila, verificada
        from openpyxl import load_workbook
        wb = load_workbook(params['idx'])
        ws = wb['idxfotos'] if 'idxfotos' in wb.sheetnames else wb[wb.sheetnames[0]]
        self.assertEqual(ws.max_row, 2)
        wb.close()


class TestApiReescribir(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ.setdefault('CVLO_TRABAJO', tempfile.mkdtemp(prefix='cvlo_app_trabajo_'))
        import app as appmod
        appmod.app.config['TESTING'] = True
        cls.cliente = appmod.app.test_client()

    def test_sin_salida_da_400(self):
        r = self.cliente.post('/api/reescribir-info', data={})
        self.assertEqual(r.status_code, 400)
        self.assertIn('Salida', r.get_json()['error'])

    def test_salida_inexistente_da_400(self):
        r = self.cliente.post('/api/reescribir-info',
                              data={'salida': r'C:\no\existe\carpeta'})
        self.assertEqual(r.status_code, 400)


if __name__ == '__main__':
    unittest.main()
