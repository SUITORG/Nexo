# VALIDACIÓN — SuitCVLO-open

Fecha: 2026-10-01 · Workflow: `ciclo` F0-F7 · Perfil: `quick` + `security`

## Resultado: **PASA**

| # | Check | Evidencia | Estado |
|---|---|---|---|
| 1 | `python -m py_compile` (7 archivos, sin `SyntaxWarning`) | `py_compile app.py motor.py proceso.py utilidades.py ia/switch.py ia/__init__.py` con `-W error::SyntaxWarning` → sin salida | ✅ |
| 2 | Suite de pruebas | `python -m unittest discover -s tests -t .` → **Ran 23 tests … OK** (13 heredados de `cvlo-auditor` + 10 nuevos de `ia/switch`) | ✅ |
| 3 | Smoke HTTP | servidor en `:3015`: `GET /` 200 · `GET /api/estado` 200 · `GET /api/ia/modelos` 200 · `GET /api/corridas` 200 | ✅ |
| 4 | Validación de entrada | `POST /api/corridas` sin salida → 400 `"Falta la Ruta de Salida."`; con `ia_proveedor=wat` → 400 `"Motor IA desconocido: wat"` | ✅ |
| 5 | Sin secretos en el código | scan de `sk-…`, `AIza…`, `service_role`, `APP_KEY` hex en `*.py`/`*.js`/`*.html` → **sin coincidencias** (antes: `motor.py:43`) | ✅ |
| 6 | Sin operaciones destructivas | scan de `os.remove` / `rmtree` / `.unlink(` / `DELETE FROM` / `DROP TABLE` → **sin coincidencias** | ✅ |
| 7 | Puerto registrado | `projects.yaml` → `suitcvlo-open.environment.PORT: 3015`; `AGENTS.md` y `.suit/INDEX.md` actualizados | ✅ |
| 8 | YAML parsea | `yaml.safe_load(projects.yaml)` → 21 proyectos, entrada nueva leída | ✅ |
| 9 | Fuente intacta | `\cvlo-auditor\` nunca fue escrita (todo el trabajo es en `SuitCVLO-open/`) | ✅ |
| 10 | Cadena real end-to-end | `switch.leer(..., proveedor='ollama')` sobre `SuitCVLO/e1.png` → respondió **319 caracteres** con la descripción correcta de la imagen (modelo local con visión) | ✅ |
| 11 | Inventario real | `GET /api/ia/modelos` → **30 modelos**: 17 locales marcados `(local)` (8 con `vision`) + 12 OpenRouter gratis con visión + AutoGLM | ✅ |

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

## No probado (a criterio del usuario)

- Corrida real contra un lote de fotos de Drive/ZIP (requiere tu carpeta `cteCVLO1` y datos).
- Calidad de lectura de cada modelo de OpenRouter (auto-descubiertos, no verificados uno a uno).

## Cómo verificar

```bash
cd SuitCVLO-open
python -m unittest discover -s tests -t . -v      # 23 tests
python app.py                                     # abre http://127.0.0.1:3015
```
