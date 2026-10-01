# -*- coding: utf-8 -*-
import os
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import utilidades as U


class TestUtilidades(unittest.TestCase):

    def test_es_imagen(self):
        self.assertTrue(U.es_imagen('a.HEIC'))
        self.assertTrue(U.es_imagen('a.jpg'))
        self.assertTrue(U.es_imagen('b.PNG'))
        self.assertFalse(U.es_imagen('x.txt'))
        self.assertFalse(U.es_imagen('x'))

    def test_zip_seguro(self):
        base = tempfile.mkdtemp(prefix='cvlo_zip_')
        z = os.path.join(base, 'l.zip')
        with zipfile.ZipFile(z, 'w') as f:
            f.writestr('ok.jpg', b'A')
            f.writestr('../malo.jpg', b'B')
            f.writestr('sub/otra.png', b'C')
            f.writestr('notas.txt', b'D')
            f.writestr('__MACOSX/._x.jpg', b'E')
        destino = os.path.join(base, 'fotos')
        ext = U.extraer_zip_seguro(z, destino)
        nombres = sorted(os.path.basename(p) for p in ext)
        self.assertEqual(nombres, ['malo.jpg', 'ok.jpg', 'otra.png'])
        for p in ext:
            self.assertEqual(os.path.dirname(p), destino)
        self.assertFalse(os.path.exists(os.path.join(base, 'malo.jpg')))

    def test_ruta_libre(self):
        base = tempfile.mkdtemp(prefix='cvlo_libre_')
        with open(os.path.join(base, 'a.jpg'), 'wb') as f:
            f.write(b'x')
        r2 = U.ruta_libre(base, 'a.jpg')
        self.assertEqual(os.path.basename(r2), 'a (2).jpg')

    def test_sanear_carpeta(self):
        self.assertEqual(U.sanear_carpeta('PANELESTACION/METRO'), 'PANELESTACION-METRO')
        self.assertEqual(U.sanear_carpeta('a:b*c?'), 'a-b-c-')
        self.assertEqual(U.sanear_carpeta(''), 'OTROS')

    def test_leer_texto_auto(self):
        base = tempfile.mkdtemp(prefix='cvlo_txt_')
        p = os.path.join(base, 'a.txt')
        with open(p, 'w', encoding='utf-8') as f:
            f.write('coordenadas: 25.7,-100.3')
        self.assertIn('25.7', U.leer_texto_auto(p))


if __name__ == '__main__':
    unittest.main()
