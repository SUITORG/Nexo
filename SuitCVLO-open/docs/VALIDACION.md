# VALIDACIÓN — SuitCVLO-open

Fecha: 2026-10-01 · Workflow: `ciclo` F0-F7 · Perfil: `quick` + `security`

## Resultado: **PASA**

| # | Check | Evidencia | Estado |
|---|---|---|---|
| 1 | `python -m py_compile` (7 archivos, sin `SyntaxWarning`) | `py_compile app.py motor.py proceso.py utilidades.py ia/switch.py ia/__init__.py` con `-W error::SyntaxWarning` → sin salida | ✅ |
| 2 | Suite de pruebas | `python -m unittest discover -s tests -t .` → **Ran 81 tests … OK** (… + 5 de reproceso) | ✅ |
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
| 20 | `.env` en caliente | `_env()` recarga el archivo cuando cambia su mtime → **pegar una key no exige reiniciar**; y sin key no se cachea la lista de modelos → `test_env_se_recarga_si_cambia_el_archivo` | ✅ |
| 21 | Eslabón `opencode` (ADR-041) | key leída de `~/.local/share/opencode/auth.json`, `User-Agent` (sin él Cloudflare da **403/1010**), `x-opencode-session` (sin él **400**), `thinking` desactivado → 7 tests nuevos | ✅ |
| 22 | Corrida real con OpenCode | job `a04e35917445`: **2 fotos leídas en 4 s**, `leidas=2`, `copiadas=1` (la otra por tope del PIN), `idxfotos.xlsx` 215→**217 filas**; coste medido **USD 0.000277/foto** (1201 in / 162 out) | ✅ |
| 23 | Producción intacta | el `idxfotos.xlsx` real del usuario (hoja `Sheet1`, columna 10 = `FechaHoraFoto`) **no se modificó**: `SuitCVLO-open` solo escribe columnas 1-9 | ✅ |
| 24 | Tope de descargas | `max_descargas` en *Opciones avanzadas* → el bucle corta y lo explica (`Tope de 5 descargas alcanzado… usa Modo Local`) → 2 tests | ✅ |
| 25 | Fallos de permiso sin espera | `Cannot retrieve the public link` **no duerme 5 s** (fallo permanente) y no inunda el log; los de red sí esperan → 2 tests | ✅ |
| 26 | Progreso de descargas | log `descargando 10/30 · candidatas 4/10 · sin permiso 0` cada 10 → 1 test · excluye las ya verificadas → 1 test | ✅ |
| 27 | Corrida real Modo Web con tope | job `de702879cfe1` (22:32): listó 3653 en **4 min**, bajó **5** y **cortó** con el mensaje del tope; **0 candidatas de 5** → confirma que en Web hay que bajar para leer el GPS | ✅ |
| 28 | `COMENTARIO` en `info.txt` | cada bloque de foto lleva el mensaje del anuncio (`QUE ANUNCIA` → si falta, `TEXTO VISIBLE` → si falta, `no disponible`) y va **antes** de la sección `COMENTARIOS:` → 1 test + corrida real | ✅ |
| 29 | `FechaHoraSubida` en el xlsx real | `idx_col_fecha()` reconoce `FechaHoraSubida`/`FechaCarga`, **no crea columnas nuevas** y no toca `FechaHoraFoto` → 1 test + corrida real: `max_column` sigue en **11** y la fila 230 quedó con `2026-10-03 10:30` | ✅ |
| 30 | `FOTO:` en cada bloque | primer campo de cada bloque con el nombre del archivo → 1 test + corrida real: **12 bloques = 12 `FOTO:`** | ✅ |
| 31 | Switch de `COMENTARIO` | checkbox en *Opciones avanzadas* (default ON) → `app.js` → `app.py` → `_bloque_info(con_comentario=…)` → 1 test (OFF no escribe `COMENTARIO:` pero sí `FOTO:`) + corrida real con ON | ✅ |
| 32 | `PROVEEDOR` = marca / `CAMPAÑA` = eslogan | prompt de **7 → 8 líneas** (`MARCA:` + `CAMPAÑA:` separados), cadena IA → pines → `marca_de()`; las lecturas viejas (`MARCA CAMPAÑA`) siguen funcionando por *startswith* → 3 tests + corrida real: `CAMPAÑA: Mientras Vivimos…` / `PROVEEDOR: Banamex / La Gran Caravana` | ✅ |
| 33 | Reparación de codificación (bug propio) | mi `Set-Content` de PowerShell había doble-codificado `motor.py` (26 mojibake, prompt y cabeceras rotos) → reparado con la inversa `bytes latin-1/cp1252 → UTF-8`; **0 mojibake** en todo el proyecto y `UBICACIÓN` del KML volvió a llenarse | ✅ |
| 34 | Línea de estadísticas en pantalla | `progreso({'stats'})` → `_job_publico` → `.nota` bajo la barra: `fuente · con GPS · sin GPS · fuera de radio · PINs` → 1 test | ✅ |
| 35 | `No GPS` en el chequequeo | las fotos sin GPS se registran en el xlsx con `Verificado='No GPS'`, `Referencias='sin GPS en EXIF'` y PIN vacío; quedan excluidas de corridas futuras → 2 tests + corrida real: **7 filas** (IMG_8823–8829), columnas intactas | ✅ |
| 36 | PINs por capa + con CARA | 2ª línea bajo la barra: `KML 300 PINs: … · con CARA 12` (nombres de capa limpios: sin `.xlsx`); `CARA` añadida a la extracción del KML → 1 test + corrida real | ✅ |
| 37 | Doc de decisiones | `docs/DECISIONES-TECNOLOGICAS-OOH.md` — números medidos, YOLO vs VLM, umbral de re-evalución y **hallazgo de los 14 PINs** (+ fila en `GuiaTotal/PENDIENTES.md`) | ✅ |
| 38 | Botón "Ver info de las fuentes" | `GET /api/fuentes` (**0,5 s** con tus datos reales: 1696 fotos · 286 pines · KML 300/3 capas/12 CARA · índice 294/210/7) + `GET /api/fuentes/gps` (**21 s**, `con 1273 · sin 0 · fuera 1251`) + panel `.log` a 2 tiempos → 5 tests | ✅ |
| 39 | Rendimiento del índice | `_leer_idx` pasaba de `ws.cell()` (O(n²) en `read_only`, **6,5 s**) a `iter_rows` → **0,1 s**; endpoint total de **17 s a 0,5 s** | ✅ |
| 40 | Errores del endpoint | ruta inexistente → `400 "La ruta de fotos no existe…"` · pines ilegibles → `400 "No pude leer los pines…"` (verificado con curl) | ✅ |
| 41 | Panel reescrito | sin `OPCIONES` · nueva línea **`AVANCE 12% · 210 de 1696 fotos`** · bloque **`FUENTES`** con el aporte de cada origen (`aporta: UBICACIÓN 286 · MEDIO 287 · COMENTARIOS 222 · …`) · `kml_resumen` gana `campos` y extrae `COMENTARIOS` | ✅ |
| 42 | Favicon | `static/favicon.svg` (mupi + check verde) + `favicon-32.png` (Pillow) enlazados en el `<head>` → 2 tests | ✅ |
| 43 | Consistencia y modo Web | **bug propio**: no se enviaba `salida` → el panel daba 1407 con GPS frente a los 1273 reales (ahora **1273** = mismo criterio que la corrida); y sin ruta local no se pide el GPS → `n/d (sin ruta local)` en vez de un 400 · **verificado en navegador: 0 errores en consola** | ✅ |
| 44 | Parser de `CVLOCFG.txt` | `utilidades.leer_config_rutas()` → 5 claves con `C:\` intacto (parte solo por el 1er `:`), mayúsculas indiferentes, `#`/vacíos ignorados, desconocidas fuera, archivo ausente → `{}` → 3 tests | ✅ |
| 45 | `GET /api/config` | devuelve `existe/archivo/rutas` con tu archivo real; la env `CVLO_CFG` redirige la lectura → 2 tests | ✅ |
| 46 | Switch en la UI | **verificado en navegador**: ON → las 5 rutas precargadas + modo `Local (ruta)` + panel local visible · OFF (persistido en `localStorage`) → **0 llamadas a `/api/config`**, campos del formulario y modo `Web` · **0 errores de consola** | ✅ |
| 47 | Reproceso — preview | `GET /api/reprocesar/preview` sobre tus datos reales: **377 objetivas** (271 sin lectura · 116 formato antiguo) · **10 sin origen** (no se tocan) | ✅ |
| 48 | Reproceso — respaldo + limpieza | `POST /api/reprocesar` → `idxfotos_backup_20261003_174938.xlsx` creado · **183 marcas limpiadas** · **294 filas intactas**, verificadas 210→27 → 5 tests (conteo, respaldo, solo las objetivas, sin origen, regresión) | ✅ |
| 49 | Reproceso — corrida real | job `b6aed9d44496`: **2 fotos releídas en 4 s** (OpenCode) · xlsx 294→**296 filas sin duplicados** · `Verificado` rehecho ✓ · `subida=2026-10-03 17:50` · `info.txt` con `FOTO` + `CAMPAÑA: Aquí sí encuentras todo…` + `COMENTARIO` + `PROVEEDOR: Del Sol` | ✅ |

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

## Pruebas de descargas Web (`tests/test_web.py`, 6)

| Test | Qué cubre |
|---|---|
| `test_el_tope_corta_y_lo_explica` | `max_descargas=3` → exactamente 3 descargas y el mensaje del tope |
| `test_sin_tope_sigue_hasta_las_candidatas` | sin tope → baja hasta juntar `n_fotos` candidatas |
| `test_no_duerme_en_fallos_permanentes` | `public link` → **cero** `sleep(5)` y log acotado (≤6 líneas) |
| `test_en_fallo_de_red_si_espera` | error de red → **sí** `sleep(5)` |
| `test_log_cada_10_descargas` | aparece `descargando 10/30 · candidatas … · sin permiso 0` |
| `test_excluye_las_que_ya_estan_procesadas` | las ya *Verificado* no se descargan |

Corren **sin red**: `gdown` y `time.sleep` están parchados.

## Corridas reales (fuera de unittest)

| Fecha | Job | Motor | Resultado |
|---|---|---|---|
| 2026-10-01 | `3163050a0e39` / `74b7b1e22058` | deepseek | ❌ `415` (faltaba `Content-Type`) → corregido; luego `402` sin saldo |
| 2026-10-01 | `304fee522f6f` | ollama (auto) | ✅ 1 foto en **456 s** → `leidas=1`, xlsx 182→183 |
| 2026-10-02 | `70325a1f3468` | **huggingface** | ✅ **5 fotos en 20 s** (~4 s/foto) → `leidas=5, copiadas=5`, xlsx 183→**188** |
| 2026-10-02 | `03f017a2d245` | huggingface | ⚠️ 7 fotos OK y luego **`402` (créditos mensuales de HF agotados)** → circuit breaker → `leidas=7, copiadas=7`, xlsx →196 |
| 2026-10-02 | `a04e35917445` | **opencode** | ✅ **2 fotos en 4 s** → `leidas=2, copiadas=1`, xlsx →217 · coste **USD 0.00028/foto** |

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
python -m unittest discover -s tests -t . -v      # 81 tests
python app.py                                     # abre http://127.0.0.1:3015
```
