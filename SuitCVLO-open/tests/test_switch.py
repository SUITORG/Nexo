# -*- coding: utf-8 -*-
"""Pruebas del switch de IA — sin red, todo parchado."""
import os
import time
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


class SwitchHttpYModelos(unittest.TestCase):
    """Regresión del 415 de DeepSeek y del 404 de Ollama con modelo ajeno."""

    @mock.patch('urllib.request.urlopen')
    def test_post_manda_content_type_json(self, urlopen):
        resp = mock.MagicMock()
        resp.__enter__.return_value.read.return_value = b'{"ok":1}'
        urlopen.return_value = resp
        self.assertEqual(switch._http('https://x/api', {'a': 1},
                                      headers={'Authorization': 'Bearer k'}), {'ok': 1})
        req = urlopen.call_args[0][0]
        self.assertEqual(req.get_header('Content-type'), 'application/json')
        self.assertEqual(req.get_header('Authorization'), 'Bearer k')

    @mock.patch('urllib.request.urlopen')
    def test_get_sin_content_type(self, urlopen):
        resp = mock.MagicMock()
        resp.__enter__.return_value.read.return_value = b'{"models":[]}'
        urlopen.return_value = resp
        switch._http('https://x/api')
        req = urlopen.call_args[0][0]
        self.assertIsNone(req.get_header('Content-type'))

    def test_modelo_ajeno_al_proveedor_se_ignora(self):
        loc = [{'id': 'qwen3.5:latest', 'vision': True}]
        with mock.patch.object(switch, '_ollama_modelos', lambda: loc):
            # bug del 404: 'deepseek-flash' no existe en Ollama
            self.assertNotEqual(switch._elegir('ollama', 'deepseek-flash'), 'deepseek-flash')
            self.assertEqual(switch._elegir('ollama', 'qwen3.5:latest'), 'qwen3.5:latest')
            self.assertTrue(switch._pertece('ollama', 'qwen3.5:latest'))
            self.assertFalse(switch._pertece('ollama', 'deepseek-flash'))

    def test_pertece_deepseek_y_gemini(self):
        with mock.patch.object(switch, '_env', lambda n, d='': d):
            self.assertTrue(switch._pertece('deepseek', 'deepseek-flash'))
            self.assertFalse(switch._pertece('deepseek', 'qwen3.5'))
            self.assertTrue(switch._pertece('gemini', 'gemini-2.5-flash'))
            self.assertFalse(switch._pertece('gemini', 'deepseek-flash'))
            self.assertFalse(switch._pertece('deepseek', None))

    def test_reset_borra_cooldowns(self):
        switch._CB['deepseek'] = {'fallos': 3, 'hasta': time.time() + 300}
        self.assertTrue(switch._bloqueado('deepseek'))
        switch.reset()
        self.assertFalse(switch._bloqueado('deepseek'))
        self.assertEqual(switch._CB, {})

    def test_cadena_incluye_huggingface(self):
        self.assertEqual(switch.ORDEN,
                         ('opencode', 'ollama', 'huggingface', 'deepseek', 'openrouter', 'gemini'))
        self.assertIn('huggingface', switch._LEEME)
        self.assertIn('opencode', switch._LEEME)

    @mock.patch.object(switch, '_env', lambda n, d='': d)
    def test_huggingface_prefiere_modelo_con_ocr(self):
        fijo = [{'id': 'google/gemma-3-4b-it'}, {'id': 'google/gemma-3-12b-it'},
                {'id': 'Qwen/Qwen2.5-VL-72B-Instruct'}]
        with mock.patch.object(switch, '_huggingface_modelos', lambda: fijo):
            self.assertEqual(switch._elegir('huggingface', None), 'Qwen/Qwen2.5-VL-72B-Instruct')
            self.assertEqual(switch._elegir('huggingface', 'google/gemma-3-12b-it'),
                             'google/gemma-3-12b-it')
            self.assertTrue(switch._pertece('huggingface', 'Qwen/Qwen2.5-VL-72B-Instruct'))
            self.assertFalse(switch._pertece('huggingface', 'deepseek-flash'))

    @mock.patch.object(switch, '_env', lambda n, d='': d)
    def test_huggingface_sin_modelos_usa_default(self):
        with mock.patch.object(switch, '_huggingface_modelos', lambda: []):
            self.assertEqual(switch._elegir('huggingface', None), 'Qwen/Qwen2.5-VL-72B-Instruct')
            self.assertFalse(switch._pertece('huggingface', 'nada'))

    @mock.patch.object(switch, '_disponible', _todo_disponible)
    def test_proveedor_forzado_falla_y_sigue_la_cadena(self):
        log = []
        with mock.patch.dict(switch._LEEME, {'huggingface': _falla, 'ollama': _ok}):
            texto = switch.leer('f.jpg', 'p', proveedor='huggingface', log=log.append)
        self.assertEqual(texto, 'TEXTO OK')
        self.assertTrue(any('sigo con el resto' in m for m in log))

    @mock.patch.object(switch, '_disponible', _todo_disponible)
    def test_proveedor_forzado_en_cooldown_sigue_la_cadena(self):
        switch._CB['huggingface'] = {'fallos': 3, 'hasta': time.time() + 300}
        try:
            with mock.patch.dict(switch._LEEME, {'ollama': _ok}):
                self.assertEqual(switch.leer('f.jpg', 'p', proveedor='huggingface'), 'TEXTO OK')
        finally:
            switch._CB.clear()

    def test_env_se_recarga_si_cambia_el_archivo(self):
        import shutil
        import tempfile
        tmp = tempfile.mkdtemp(prefix='cvlo_env_')
        ruta = os.path.join(tmp, '.env')
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write('CLAVE_DE_PRUEBA=uno\n')
        try:
            with mock.patch.object(switch, '_BASE', tmp), \
                 mock.patch.object(switch, '_ENV_MTIME', -1):
                self.assertEqual(switch._env('CLAVE_DE_PRUEBA'), 'uno')
                with open(ruta, 'w', encoding='utf-8') as f:
                    f.write('CLAVE_DE_PRUEBA=dos\n')
                os.utime(ruta, (time.time() + 10, time.time() + 10))
                # sin reiniciar ni limpiar caché: el cambio de mtime recarga
                self.assertEqual(switch._env('CLAVE_DE_PRUEBA'), 'dos')
        finally:
            os.environ.pop('CLAVE_DE_PRUEBA', None)
            shutil.rmtree(tmp, ignore_errors=True)

    @mock.patch.object(switch, '_env', lambda n, d='': d)
    def test_openrouter_prefiere_modelo_gratis(self):
        fijo = [{'id': 'stealth/space-bunny-alpha'}, {'id': 'deepseek/deepseek-v4-flash:free'}]
        with mock.patch.object(switch, '_openrouter_modelos', lambda: fijo):
            self.assertEqual(switch._elegir('openrouter', None), 'deepseek/deepseek-v4-flash:free')


class SwitchOpencode(unittest.TestCase):
    """Eslabón OpenCode (la suscripción que ya paga el usuario).

    Es el único de su catálogo (86 modelos) con capacidad de imagen.
    """

    def test_ordencadena_empieza_por_opencode(self):
        self.assertEqual(switch.ORDEN[0], 'opencode')

    @mock.patch.object(switch, '_clave_opencode', lambda: 'sk-opencode-1234567890')
    @mock.patch.object(switch, '_env', lambda n, d='': d)
    def test_disponible_y_modelo_por_defecto(self):
        self.assertEqual(switch._disponible('opencode'), (True, 'ok'))
        self.assertEqual(switch._elegir('opencode', None), 'deepseek-v4-flash-vision-exp')
        self.assertTrue(switch._pertece('opencode', 'deepseek-v4-flash-vision-exp'))
        self.assertFalse(switch._pertece('opencode', 'qwen3.5:latest'))

    @mock.patch.object(switch, '_clave_opencode', lambda: '')
    def test_sin_key_no_esta_disponible(self):
        disp, motivo = switch._disponible('opencode')
        self.assertFalse(disp)
        self.assertIn('OPENCODE_API_KEY', motivo)

    @mock.patch.object(switch, '_env', lambda n, d='': d)
    def test_lee_la_key_del_auth_de_opencode(self):
        import json
        import shutil
        import tempfile
        tmp = tempfile.mkdtemp(prefix='cvlo_auth_')
        ruta = os.path.join(tmp, 'auth.json')
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump({'opencode-go': {'type': 'api', 'key': 'go-key-de-prueba'}}, f)
        try:
            with mock.patch.object(switch.os.path, 'expanduser', lambda _p: ruta):
                self.assertEqual(switch._clave_opencode(), 'go-key-de-prueba')
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    @mock.patch.object(switch, '_clave_opencode', lambda: 'k')
    @mock.patch.object(switch, '_env', lambda n, d='': d)
    def test_modelos_incluye_el_de_vision(self):
        with mock.patch.object(switch, '_ollama_modelos', lambda: []), \
             mock.patch.object(switch, '_huggingface_modelos', lambda: []), \
             mock.patch.object(switch, '_openrouter_modelos', lambda: []):
            op = [m for m in switch.modelos() if m['proveedor'] == 'opencode']
        self.assertEqual(len(op), 1)
        self.assertEqual(op[0]['id'], 'deepseek-v4-flash-vision-exp')
        self.assertTrue(op[0]['vision'])

    def test_opencode_manda_user_agent_session_y_sin_razonamiento(self):
        """Sin User-Agent Cloudflare devuelve 403 (1010); sin x-opencode-session, 400."""
        import json
        resp = mock.MagicMock()
        resp.__enter__.return_value.read.return_value = \
            b'{"choices":[{"message":{"content":"ok"}}]}'
        with mock.patch('urllib.request.urlopen', return_value=resp) as urlopen, \
             mock.patch.object(switch, '_clave_opencode', lambda: 'k'), \
             mock.patch.object(switch, '_env', lambda n, d='': d), \
             mock.patch.object(switch, '_b64', lambda _r: 'AAA'):
            self.assertEqual(switch._opencode('f.jpg', 'p', None), 'ok')
            req = urlopen.call_args[0][0]
        self.assertEqual(req.get_header('User-agent'), 'SuitCVLO-open/1.0')
        self.assertTrue(req.get_header('X-opencode-session'))
        cuerpo = json.loads(req.data.decode())
        self.assertEqual(cuerpo['thinking'], {'type': 'disabled'})
        self.assertEqual(cuerpo['model'], 'deepseek-v4-flash-vision-exp')

    @mock.patch.object(switch, '_clave_opencode', lambda: 'k')
    def test_opencode_puede_reactivar_el_razonamiento(self):
        import json
        resp = mock.MagicMock()
        resp.__enter__.return_value.read.return_value = b'{"choices":[{"message":{"content":"ok"}}]}'
        fake_env = lambda n, d='': os.environ.get(n) or d
        with mock.patch('urllib.request.urlopen', return_value=resp) as urlopen, \
             mock.patch.object(switch, '_env', fake_env), \
             mock.patch.object(switch, '_b64', lambda _r: 'AAA'), \
             mock.patch.dict(os.environ, {'OPENCODE_THINKING': 'enabled'}):
            switch._opencode('f.jpg', 'p', None)
            cuerpo = json.loads(urlopen.call_args[0][0].data.decode())
        self.assertNotIn('thinking', cuerpo)


if __name__ == '__main__':
    unittest.main()
