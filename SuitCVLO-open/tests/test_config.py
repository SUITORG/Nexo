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


class TestMarcasEnElCfg(unittest.TestCase):
    """`marcas:` sin valor abre una lista inline en el propio CVLOCFG.txt (una por línea)."""

    CFG_INLINE = (
        'fotos : D:\\fotos\n'
        'salida: D:\\salida\n'
        'marcas: \n'
        'coppel\n'
        'coca cola\n'
        'Farmacias del Ahorro\n'
        '\n'
        'idx   : D:\\idx.xlsx\n')

    def test_lista_inline_se_lee_como_marcas(self):
        r = U.leer_config_rutas(escribir(self.CFG_INLINE))
        self.assertIn('marcas', r)
        self.assertEqual(r['salida'], 'D:\\salida')
        self.assertEqual(r['idx'], 'D:\\idx.xlsx')          # después de la lista sigue leyendo
        marcas = U.leer_marcas_texto(r['marcas'])
        self.assertEqual(marcas, {'coppel', 'coca cola', 'farmacias del ahorro'})

    def test_marcas_como_ruta_sigue_siendo_ruta(self):
        r = U.leer_config_rutas(escribir('marcas: mis-marcas.txt\nidx : D:\\i.xlsx\n'))
        self.assertEqual(r['marcas'], 'mis-marcas.txt')      # una sola línea = ruta
        self.assertNotIn('\n', r['marcas'])

    def test_app_elige_inline_ruta_o_semilla(self):
        os.environ.setdefault('CVLO_TRABAJO', tempfile.mkdtemp(prefix='cvlo_app_trabajo_'))
        import app as appmod
        # inline (lo que trae el CVLOCFG del proyecto)
        self.assertEqual(appmod._marcas_cfg({'marcas': 'Coppel\ncoca cola'}),
                         {'coppel', 'coca cola'})
        # ruta de archivo
        d = tempfile.mkdtemp(prefix='cvlo_mfile_')
        p = os.path.join(d, 'marcas.txt')
        with open(p, 'w', encoding='utf-8') as f:
            f.write('Yoplait\nPEPSI\n')
        self.assertEqual(appmod._marcas_cfg({'marcas': p}), {'yoplait', 'pepsi'})
        # sin nada -> la semilla del proyecto
        semilla = appmod._marcas_cfg({})
        self.assertIn('didi', semilla)
        self.assertGreater(len(semilla), 30)


class TestAlimentarMarcas(unittest.TestCase):
    """Botón "Agregar marcas vistas": alimenta la lista en uso desde las lecturas guardadas."""

    def _reads(self):
        d = tempfile.mkdtemp(prefix='cvlo_reads_m_')
        datos = {
            'a': 'ANUNCIO: SI\nMARCA: Bonafont\nQUE ANUNCIA: agua\n',
            'b': 'ANUNCIO: SI\nMARCA: pepsi\nQUE ANUNCIA: refresco\n',       # igual que Pepsi
            'c': 'ANUNCIO: SI\nMARCA: Bebida (marca no legible)\n',           # basura
            'd': 'ANUNCIO: SI\nMARCA: no visible\n',                          # basura
            'e': 'ANUNCIO: SI\nMARCA: Bonafont\n',                            # duplicada
            'f': 'ANUNCIO: SI\nQUE ANUNCIA: sin campo marca\n',               # sin marca
            'g': 'MARCA: Yoplait - "Esto es Vida"\n',                         # eslogan (comillas)
            'h': 'MARCA: Nueva Carretera La Gloria-Colombia / Nuevo León / más\n',  # frase larga
        }
        import json
        for k, t in datos.items():
            with open(os.path.join(d, k + '.json'), 'w', encoding='utf-8') as f:
                json.dump({'texto': t, 'pin': 'DF_09_TEST_1'}, f)
        return d

    def test_marcas_vistas_lee_reads_y_descarta_basura(self):
        import proceso
        vistas = proceso.marcas_vistas(self._reads())
        self.assertEqual(sorted(vistas, key=str.lower), ['Bonafont', 'pepsi'])

    def test_destino_inline_archivo_o_semilla(self):
        cfg_path = os.path.join(tempfile.mkdtemp(prefix='cvlo_dst_'), 'CVLOCFG.txt')
        self.assertEqual(U.marcas_destino(cfg_path, {}),
                         ('archivo', os.path.join(U.BASE_DIR, 'marcas-conocidas.txt')))
        self.assertEqual(U.marcas_destino(cfg_path, {'marcas': r'D:\m.txt'}),
                         ('archivo', r'D:\m.txt'))
        self.assertEqual(U.marcas_destino(cfg_path, {'marcas': 'coppel\ncoca cola'}),
                         ('inline', cfg_path))

    def test_agregar_a_archivo_no_duplica_y_crea_el_archivo(self):
        ruta = os.path.join(tempfile.mkdtemp(prefix='cvlo_agr_'), 'marcas.txt')
        r1 = U.marcas_agregar('archivo', ruta, ['Pepsi', 'Bonafont'])
        self.assertEqual(r1['agregadas'], ['Pepsi', 'Bonafont'])
        r2 = U.marcas_agregar('archivo', ruta, ['pepsi', 'Nu'])   # pepsi ya está
        self.assertEqual(r2['agregadas'], ['Nu'])
        self.assertEqual(U.leer_marcas(ruta), {'pepsi', 'bonafont', 'nu'})
        self.assertEqual(r2['total'], 3)

    def test_agregar_al_inline_respeta_el_resto_del_cfg(self):
        texto = ('fotos : D:\\fotos\n'
                 'prioridad: kml\n'
                 'marcas: \n'
                 'coppel\n'
                 '\n'
                 'idx   : D:\\i.xlsx\n')
        p = os.path.join(tempfile.mkdtemp(prefix='cvlo_inl_'), 'CVLOCFG.txt')
        with open(p, 'w', encoding='utf-8', newline='') as f:
            f.write(texto)
        r = U.marcas_agregar('inline', p, ['COPPEL', 'Bonafont', 'Nu'])
        self.assertEqual(r['agregadas'], ['Bonafont', 'Nu'])       # COPPEL ya estaba
        despues = open(p, encoding='utf-8').read()
        self.assertIn('coppel\nBonafont\nNu\n', despues)           # dentro del bloque
        self.assertIn('fotos : D:\\fotos', despues)                # el resto intacto
        self.assertIn('prioridad: kml', despues)
        self.assertIn('idx   : D:\\i.xlsx', despues)               # después del bloque
        self.assertEqual(U.leer_config_rutas(p)['idx'], r'D:\i.xlsx')

    def test_api_marcas_actualizar(self):
        os.environ.setdefault('CVLO_TRABAJO', tempfile.mkdtemp(prefix='cvlo_app_trabajo_'))
        import json
        import app as appmod
        appmod.app.config['TESTING'] = True
        cliente = appmod.app.test_client()
        base = tempfile.mkdtemp(prefix='cvlo_api_m_')
        reads = os.path.join(base, 'reads')
        os.makedirs(reads)
        with open(os.path.join(reads, 'x.json'), 'w', encoding='utf-8') as f:
            json.dump({'texto': 'MARCA: Bonafont', 'pin': 'DF_1'}, f)
        cfg = os.path.join(base, 'CVLOCFG.txt')
        with open(cfg, 'w', encoding='utf-8') as f:
            f.write('salida: D:\\s\nmarcas: \nBonafont\n\nidx: D:\\i.xlsx\n')
        with mock.patch.object(appmod, 'TRABAJO', base):
            r = cliente.post('/api/marcas/actualizar', data={'cfg_ruta': cfg})
        self.assertEqual(r.status_code, 200, r.get_data(as_text=True))
        d = r.get_json()
        self.assertEqual(d['vistas'], 1)
        self.assertEqual(d['agregadas'], [])          # Bonafont ya estaba en el CFG
        self.assertEqual(d['tipo'], 'inline')


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
