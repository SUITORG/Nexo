# -*- coding: utf-8 -*-
"""UI mínima: el favicon existe, está enlazado y es un PNG/SVG válidos."""
import os
import sys
import unittest

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)


class TestFavicon(unittest.TestCase):
    def test_archivos_existen_y_son_validos(self):
        svg = os.path.join(BASE, 'static', 'favicon.svg')
        png = os.path.join(BASE, 'static', 'favicon-32.png')
        self.assertTrue(os.path.exists(svg), 'falta static/favicon.svg')
        self.assertTrue(os.path.exists(png), 'falta static/favicon-32.png')
        with open(svg, encoding='utf-8') as f:
            contenido = f.read()
        self.assertIn('<svg', contenido)
        self.assertIn('#2E7D32', contenido)          # el check verde
        with open(png, 'rb') as f:
            cabecera = f.read(8)
        self.assertEqual(cabecera, b'\x89PNG\r\n\x1a\n')

    def test_index_lo_enlaza(self):
        html = open(os.path.join(BASE, 'plantillas', 'index.html'), encoding='utf-8').read()
        self.assertIn('favicon.svg', html)
        self.assertIn('favicon-32.png', html)
        self.assertIn('rel="icon"', html)


if __name__ == '__main__':
    unittest.main()
