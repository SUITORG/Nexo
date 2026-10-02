# VALIDACIÓN — SuitCVLO-open

Fecha: 2026-10-01 · Workflow: `ciclo` F0-F7 · Perfil: `quick` + `security`

## Resultado: **PASA**

| # | Check | Evidencia | Estado |
|---|---|---|---|
| 1 | `python -m py_compile` (7 archivos, sin `SyntaxWarning`) | `py_compile app.py motor.py proceso.py utilidades.py ia/switch.py ia/__init__.py` con `-W error::SyntaxWarning` → sin salida | ✅ |
| 2 | Suite de pruebas | `python -m unittest discover -s tests -t .` → **Ran 28 tests … OK** (13 heredados de `cvlo-auditor` + 10 de `ia/switch` + 5 de detener/validación de rutas) | ✅ |
| 3 | Smoke HTTP | servidor en `:3015`: `GET /` 200 · `GET /api/estado` 200 · `GET /api/ia/modelos` 200 · `GET /api/corridas` 200 | ✅ |
| 4 | Validación de entrada | `POST /api/corridas` sin salida → 400 `"Falta la Ruta de Salida."`; con `ia_proveedor=wat` → 400 `"Motor IA desconocido: wat"` | ✅ |
| 5 | Sin secretos en el código | scan de `sk-…`, `AIza…`, `service_role`, `APP_KEY` hex en `*.py`/`*.js`/`*.html` → **sin coincidencias** (antes: `motor.py:43`) | ✅ |
| 6 | Sin operaciones destructivas | scan de `os.remove` / `rmtree` / `.unlink(` / `DELETE FROM` / `DROP TABLE` → **sin coincidencias** | ✅ |
| 7 | Puerto registrado | `projects.yaml` → `suitcvlo-open.environment.PORT: 3015`; `AGENTS.md` y `.suit/INDEX.md` actualizados | ✅ |
| 8 | YAML parsea | `yaml.safe_load(projects.yaml)` → 21 proyectos, entrada nueva leída | ✅ |
| 9 | Fuente intacta | `\cvlo-auditor\` nunca fue escrita (todo el trabajo es en `SuitCVLO-open/`) | ✅ |
| 10 | Cadena real end-to-end | `switch.leer(..., proveedor='ollama')` sobre `SuitCVLO/e1.png` → respondió **319 caracteres** con la descripción correcta de la imagen (modelo local con visión) | ✅ |
| 11 | Inventario real | `GET /api/ia/modelos` → **29 modelos**: 17 locales marcados `(local)` (8 con `vision`) + 12 en nube (OpenRouter gratis con visión); `deepseek` aparece en cuanto haya `DEEPSEEK_API_KEY` | ✅ |
| 12 | Cadena sin AutoClaw | scan de `autoclaw`/`AutoGLM`/`AUTOCALW`/`badge-token`/`token_disponible` en `*.py`, `*.js`, `*.html`, `.env.example` → **0 coincidencias** (ADR-038) | ✅ |

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

## Corrida real (2026-10-01, fuera de unittest)

- Lote: `cteCVLO1\Recorrido`, 2 fotos nuevas → `IMG_0464.HEIC` y `IMG_0465.HEIC` (PIN `DF_09_AVAILABILITY_291`).
- Cadena observada: Ollama *timeout* (paralelo) → OpenRouter `401` → **AutoClaw respondió** (hoy eliminado).
- Tiempo medido de Ollama **serial**: 392 s/foto (`qwen3.5`, imagen 1600 px) → por eso la lectura
  local se serializó y `OLLAMA_TIMEOUT_S=900`.

## No probado (a criterio del usuario)

- Corrida real desde **Drive/ZIP** (solo se probó el modo Local).
- Calidad de lectura de cada modelo de OpenRouter (auto-descubiertos, no verificados uno a uno).
- DeepSeek end-to-end (pendiente de generar `DEEPSEEK_API_KEY`).

## Cómo verificar

```bash
cd SuitCVLO-open
python -m unittest discover -s tests -t . -v      # 28 tests
python app.py                                     # abre http://127.0.0.1:3015
```
