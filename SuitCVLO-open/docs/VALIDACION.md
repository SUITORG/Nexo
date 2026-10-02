# VALIDACIÓN — SuitCVLO-open

Fecha: 2026-10-01 · Workflow: `ciclo` F0-F7 · Perfil: `quick` + `security`

## Resultado: **PASA**

| # | Check | Evidencia | Estado |
|---|---|---|---|
| 1 | `python -m py_compile` (7 archivos, sin `SyntaxWarning`) | `py_compile app.py motor.py proceso.py utilidades.py ia/switch.py ia/__init__.py` con `-W error::SyntaxWarning` → sin salida | ✅ |
| 2 | Suite de pruebas | `python -m unittest discover -s tests -t .` → **Ran 38 tests … OK** (13 heredados + 10 de `ia/switch` + 5 de detener/validación de rutas + 10 de la cadena) | ✅ |
| 3 | Smoke HTTP | servidor en `:3015`: `GET /` 200 · `GET /api/estado` 200 · `GET /api/ia/modelos` 200 · `GET /api/corridas` 200 | ✅ |
| 4 | Validación de entrada | `POST /api/corridas` sin salida → 400 `"Falta la Ruta de Salida."`; con `ia_proveedor=wat` → 400 `"Motor IA desconocido: wat"` | ✅ |
| 5 | Sin secretos en el código | scan de `sk-…`, `AIza…`, `service_role`, `APP_KEY` hex en `*.py`/`*.js`/`*.html` → **sin coincidencias** (antes: `motor.py:43`) | ✅ |
| 6 | Sin operaciones destructivas | scan de `os.remove` / `rmtree` / `.unlink(` / `DELETE FROM` / `DROP TABLE` → **sin coincidencias** | ✅ |
| 7 | Puerto registrado | `projects.yaml` → `suitcvlo-open.environment.PORT: 3015`; `AGENTS.md` y `.suit/INDEX.md` actualizados | ✅ |
| 8 | YAML parsea | `yaml.safe_load(projects.yaml)` → 21 proyectos, entrada nueva leída | ✅ |
| 9 | Fuente intacta | `\cvlo-auditor\` nunca fue escrita (todo el trabajo es en `SuitCVLO-open/`) | ✅ |
| 10 | Cadena real end-to-end | `switch.leer(..., proveedor='ollama')` sobre `SuitCVLO/e1.png` → respondió **319 caracteres** con la descripción correcta de la imagen (modelo local con visión) | ✅ |
| 11 | Inventario real | `GET /api/ia/modelos` → **18 modelos**: 17 locales marcados `(local)` (8 con `vision`) + `deepseek-flash (nube)`; OpenRouter/Gemini salen en 0 porque `.env` los deja vacíos (prioridad `.env` > entorno) | ✅ |
| 12 | Cadena sin AutoClaw | scan de `autoclaw`/`AutoGLM`/`AUTOCALW`/`badge-token`/`token_disponible` en `*.py`, `*.js`, `*.html`, `.env.example` → **0 coincidencias** (ADR-038) | ✅ |
| 13 | `Content-Type` (fix del 415) | `_http` manda `application/json` en POST y **no** lo manda en GET → `tests/test_switch.py::SwitchHttpYModelos` | ✅ |
| 14 | Modelo ajeno al proveedor (fix del 404) | `_elegir('ollama','deepseek-flash')` ignora el modelo y usa el local → `test_modelo_ajeno_al_proveedor_se_ignora` | ✅ |
| 15 | Cooldowns no se heredan | `switch.reset()` al crear corrida → `test_reset_borra_cooldowns` | ✅ |
| 16 | Corrida real end-to-end | job `304fee522f6f` (22:54): **`leidas=1`, `copiadas=1`**, `idxfotos.xlsx` 182→**183 filas** (137 ✓), foto en `DIDI PARABUSES MTY\DF_09_ELITE_275\` — Ollama respondió en 456 s | ✅ |
| 17 | Eslabón `huggingface` (ADR-039) | `ORDEN` de 5, 11 modelos de visión descubiertos del router, `_pertece`/`_elegir` con default `Qwen/Qwen2.5-VL-72B-Instruct` → 3 tests nuevos | ✅ |
| 18 | Corrida real con HuggingFace | job `70325a1f3468`: **5 fotos en 20 s** (`leidas=5, copiadas=5`), `idxfotos.xlsx` 183→**188 filas** (142 ✓), ~4 s/foto vs 456 s de Ollama | ✅ |
| 19 | Proveedor forzado no corta la corrida | si el eslabón elegido falla o está en cooldown, `leer()` sigue con el resto de la cadena (invariante 4 del contrato) → 2 tests nuevos | ✅ |

## Pruebas nuevas (`tests/test_switch.py`)

| Test | Qué cubre |
|---|---|
| `test_primer_proveedor_responde` | el primer eslabón responde y no se gastan los demás |
| `test_cascade_baja_al_siguiente` | fallo de Ollama → sigue con OpenRouter; log de cada intento |
| `test_todos_fallan_y_arma_error` | el error final nombra a los 4 eslabones |
| `test_circuito_breaker_bloquea_a_tercero` | 3 fallos → cooldown |
| `test_proveedor_en_cooldown_no_se_prueba` | eslabón en cooldown se salta |
| `test_proveedor_desconocido` | rechaza proveedores fuera de la cadena |
| `test_disponible_falso_no_intenta` | eslabón sin credenciales no se invoca |
| `test_modelos_locales_marcados` | Ollama sale con `(local)` y flag `vision` |
| `test_elegir_vlm_desde_env` | `CVLO_VLM` tiene prioridad |
| `test_elegir_primer_vision_local` | sin `CVLO_VLM` elige el más liviano con visión |

Todas corren **sin red** (dependencias parchadas).

## Pruebas de regresión (`tests/test_detener.py`)

| Test | Qué cubre |
|---|---|
| `test_detener_salta_las_lecturas` | con la bandera activa no se lee ni se copia nada y `detenida=True` |
| `test_web_con_carpeta_devuelve_400` | **el bug del 500**: carpeta en el campo de Drive → 400 legible |
| `test_local_con_archivo_devuelve_400` | archivo en el campo de ruta local → 400 legible |
| `test_numero_invalido_devuelve_400` | `n_fotos=cinco` → 400 en vez de 500 |
| `test_detener_inexistente_404` | endpoint de detener con id desconocido |

## Corridas reales (fuera de unittest)

| Fecha | Job | Motor | Resultado |
|---|---|---|---|
| 2026-10-01 | `3163050a0e39` / `74b7b1e22058` | deepseek | ❌ `415` (faltaba `Content-Type`) → corregido; luego `402` sin saldo |
| 2026-10-01 | `304fee522f6f` | ollama (auto) | ✅ 1 foto en **456 s** → `leidas=1`, xlsx 182→183 |
| 2026-10-02 | `70325a1f3468` | **huggingface** | ✅ **5 fotos en 20 s** (~4 s/foto) → `leidas=5, copiadas=5`, xlsx 183→**188** |
| 2026-10-02 | `03f017a2d245` | huggingface | ⚠️ 7 fotos OK y luego **`402` (créditos mensuales de HF agotados)** → circuit breaker → `leidas=7, copiadas=7`, xlsx →196 |

- Lote: `cteCVLO1\Recorrido` (modo Local), PIN `DF_09_ELITE_275`, grupo `DIDI PARABUSES MTY`.
- Lectura de Ollama medida en serial: **392-456 s/foto** (`qwen3.5`, imagen 1600 px) → por eso la
  lectura local se serializa y `OLLAMA_TIMEOUT_S=900`.
- HuggingFace con `Qwen/Qwen2.5-VL-72B-Instruct`: **5.3 s** en la prueba suelta y ~4 s/foto en corrida;
  leyó anuncio + marca + texto + patrocinador (`GNP SEGUROS`).

## No probado (a criterio del usuario)

- Corrida real desde **Drive/ZIP** (solo se probó el modo Local).
- DeepSeek end-to-end: la key existe y es válida, pero la plataforma responde **`402 Insufficient Balance`**.
- Modelos de HuggingFace distintos al default (11 disponibles).

## Cómo verificar

```bash
cd SuitCVLO-open
python -m unittest discover -s tests -t . -v      # 38 tests
python app.py                                     # abre http://127.0.0.1:3015
```
