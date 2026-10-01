# -*- coding: utf-8 -*-
"""Pruebas del switch de IA — sin red, todo parchado."""
import unittest
from unittest import mock

from ia import switch


def _ok(_ruta, _prompt, _modelo):
    return 'TEXTO OK'


def _falla(_ruta, _prompt, _modelo):
    raise RuntimeError('caido')


def _todo_disponible(_p):
    return True, 'ok'


def _nada_disponible(_p):
    return False, 'sin clave'


class SwitchCascade(unittest.TestCase):
    def setUp(self):
        switch._CB.clear()
        switch._CACHE['openrouter'] = None

    @mock.patch.object(switch, '_disponible', _todo_disponible)
    def test_primer_proveedor_responde(self):
        with mock.patch.dict(switch._LEEME, {'ollama': _ok}):
            texto = switch.leer('f.jpg', 'p')
        self.assertEqual(texto, 'TEXTO OK')

    @mock.patch.object(switch, '_disponible', _todo_disponible)
    def test_cascade_baja_al_siguiente(self):
        log = []
        with mock.patch.dict(switch._LEEME, {'ollama': _falla, 'openrouter': _ok}):
            texto = switch.leer('f.jpg', 'p', log=log.append)
        self.assertEqual(texto, 'TEXTO OK')
        self.assertTrue(any('ollama falló' in m for m in log))
        self.assertTrue(any('openrouter respondió' in m for m in log))

    @mock.patch.object(switch, '_disponible', _todo_disponible)
    def test_todos_fallan_y_arma_error(self):
        with mock.patch.dict(switch._LEEME, {p: _falla for p in switch.ORDEN}):
            with self.assertRaises(RuntimeError) as ctx:
                switch.leer('f.jpg', 'p')
        mensaje = str(ctx.exception)
        for p in switch.ORDEN:
            self.assertIn(p, mensaje)

    @mock.patch.object(switch, '_disponible', _todo_disponible)
    def test_circuito_breaker_bloquea_a_tercero(self):
        with mock.patch.dict(switch._LEEME, {'ollama': _falla}):
            for _ in range(switch.FALLOS_PARA_BLOQUEO):
                with self.assertRaises(RuntimeError):
                    switch.leer('f.jpg', 'p', proveedor='ollama')
        self.assertTrue(switch._bloqueado('ollama'))

    @mock.patch.object(switch, '_disponible', _todo_disponible)
    def test_proveedor_en_cooldown_no_se_prueba(self):
        switch._CB['ollama'] = {'fallos': 0, 'hasta': switch.time.time() + 60}
        with mock.patch.dict(switch._LEEME, {'ollama': _ok, 'openrouter': _ok}):
            texto = switch.leer('f.jpg', 'p')
        self.assertEqual(texto, 'TEXTO OK')

    def test_proveedor_desconocido(self):
        with self.assertRaises(RuntimeError):
            switch.leer('f.jpg', 'p', proveedor='no-existe')

    @mock.patch.object(switch, '_disponible', _nada_disponible)
    def test_disponible_falso_no_intenta(self):
        with self.assertRaises(RuntimeError) as ctx:
            switch.leer('f.jpg', 'p', proveedor='gemini')
        self.assertIn('sin clave', str(ctx.exception))


class SwitchModelos(unittest.TestCase):
    @mock.patch.object(switch, '_disponible', _nada_disponible)
    def test_modelos_locales_marcados(self):
        fijo = [{'id': 'qwen3.5:latest', 'nombre': 'qwen3.5:latest (local)',
                 'proveedor': 'ollama', 'local': True, 'vision': True, 'detalle': '14B'}]
        with mock.patch.object(switch, '_ollama_modelos', lambda: fijo), \
             mock.patch.object(switch, '_openrouter_modelos', lambda: []), \
             mock.patch.object(switch, '_env', lambda n, d='': d):
            items = switch.modelos()
        self.assertTrue(any('(local)' in i['nombre'] for i in items))
        self.assertTrue(all(i['local'] for i in items if i['proveedor'] == 'ollama'))

    @mock.patch.object(switch, '_env', lambda n, d='': {'CVLO_VLM': 'mi-vlm'}.get(n, d))
    def test_elegir_vlm_desde_env(self):
        self.assertEqual(switch._elegir('ollama', None), 'mi-vlm')

    @mock.patch.object(switch, '_env', lambda n, d='': d)
    def test_elegir_primer_vision_local(self):
        fijo = [{'id': 'a:latest', 'vision': False}, {'id': 'b:latest', 'vision': True}]
        with mock.patch.object(switch, '_ollama_modelos', lambda: fijo):
            self.assertEqual(switch._elegir('ollama', None), 'b:latest')


if __name__ == '__main__':
    unittest.main()
