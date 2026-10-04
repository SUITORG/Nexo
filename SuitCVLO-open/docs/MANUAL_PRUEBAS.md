# MANUAL DE PRUEBAS - SuitCVLO-open

> **Para qué sirve este manual:** explica el modo de pruebas del proyecto: cómo correr el
> recorrido completo E2E con mocks, **sin internet y sin tocar datos reales**.
> **Audiencia:** desarrollador que valida cambios antes de subirlos.
> **Versión:** 1.0 · **Última actualización:** 2026-10-03 · **Plataforma:** SuitCVLO-open (mock con `CVLO_MOCK=1`)

---

## Para qué sirve este manual (detalle)

Las pruebas usan **carpetas temporales** y **respuestas de IA fijas**: no tocan
`C:\...\cteCVLO1`, no llaman a ningún proveedor y no consumen cuota. Cubre solo el entorno
de pruebas; el uso real está en `MANUAL_PROVEEDOR.md` y la operación en `MANUAL_TECNICO.md`.

## 1. Qué es el modo de pruebas

- **`CVLO_MOCK=1`** (o la env que ya traiga el runner) activa el modo mock.
- **`tests/test_flujo_mock.py::crear_fuente()`** fabrica un mini-proyecto en `tempfile`:
  fotos JPEG mínimas con `mock_gps.json` (coordenadas GPS), pines y KML de 3 placemarks.
- La IA se sustituye por una **respuesta fija de 8 líneas** → cero llamadas de red.
- `run_tests.bat` ya lo ejecuta en modo MOCK ("sin internet").

## 2. Activación rápida

```bash
cd SuitCVLO-open
run_tests.bat                     # vía .bat (unittest -v)
# o directo:
python -m unittest discover -s tests -t . -v
# solo una suite:
python -m unittest tests.test_reproceso -v
# solo un caso:
python -m unittest tests.test_switch.SwitchHttpYModelos -v
```

Pasos: 1) abrir terminal en `SuitCVLO-open` → 2) ejecutar el comando → 3) ver
`Ran 106 tests ... OK` → 4) si falla, el trace apunta al archivo:caso.

> Los `.py` editados se validan además con
> `python -W error::SyntaxWarning -m py_compile <archivo>` y el JS con `node --check static/app.js`.

## 3. Qué se mockea y qué no

| Servicio | En modo pruebas | En producción |
|---|---|---|
| **IA (cadena)** | respuesta fija de 8 líneas (sin red) | OpenCode → Ollama → … (real) |
| **GPS/EXIF** | `mock_gps.json` (coordenadas sintéticas) | EXIF real de la foto |
| **Google Drive** | no existe (solo modo Local/ZIP/carpeta) | `gdown` con pausa ≥1 s |
| **Sistema de archivos** | carpeta temporal (`tempfile.mkdtemp`) | `C:\...\cteCVLO1` (real) |
| **Índice xlsx** | `idxfotos.xlsx` temporal creado en el test | el xlsx real del usuario |
| **Servidor Flask** | tests de lógica + smoke HTTP en `:3015` | servidor real |

**Nunca** se ejecuta `os.remove`, `rmtree` ni borrados sobre datos del usuario
(verificado en `docs/VALIDACION.md` #6).

## 4. Datos de prueba

- **Fixture**: `crear_fuente(base, [(foto, fecha, lat, lon), …])` → crea
  `fotos/`, `GooMapsPines.txt`, `RutaKML.kml` y `mock_gps.json` dentro de `base` (temporal).
- **Sesgos (fixtures) reales usados**: pines con `LATITUD/LONGITUD`, capa COMPETENCIA con
  `COORDENADAS:` (para cubrir el caso de los 14 PINs), fotos sin GPS y PINs con tope lleno.
- **Formatos de lectura**: `MARCA:` (nuevo, 8 líneas) y `MARCA CAMPAÑA:` (viejo, legado) —
  ambos deben seguir sirviendo.
- **Modo sin red**: si un test intenta salir a internet, falla (no hay mocks de red externos).

## 5. Recorrido E2E completo

```text
crear_fuente() → params (local + mock_gps)
  → proceso.ejecutar_corrida(...)
      → candidatas (GPS dentro del radio)
      → ia/switch.leer (mock, 8 líneas)
      → copia a Salida/<quincena>/auditoria/<Grupo>/<PIN>/
      → reescribe info.txt (FOTO / CAMPAÑA / COMENTARIO / PROVEEDOR)
      → idx_upsert en idxfotos.xlsx (Verificado ✓, sin duplicados)
  → aserciones: leídas, copiadas, filas, columnas, info.txt
```

Escenarios E2E cubiertos:

| Suite | Qué cubre |
|---|---|
| `test_flujo_mock` | corrida completa mock (leídas/copiadas/carpetas/`info.txt`) |
| `test_reproceso` | preview → respaldo → limpieza de `Verificado` → releer **sin duplicar filas** |
| `test_switch` | cascada, circuit breaker, `.env` en caliente, headers/415/404/403, inventario |
| `test_fuentes` | panel *Ver info* (`/api/fuentes`, GPS, KML, índice) |
| `test_web` / `test_ui` / `test_config` | endpoints, validación de entrada, `CVLOCFG.txt`, favicon |
| `test_prioridad_kml` | prioridad KML: cruce, `COORDENADAS`, `PROVEEDOR` con `*`, marcas conocidas, `reescribir_todo`, xlsx sin cambios |
| `test_marca_idx` | columna `Marca` al final del índice: se agrega sin pisar columnas, se rellena en corrida y con `reescribir_todo`, filas sin lectura quedan vacías |
| `test_motor` / `test_utilidades` / `test_detener` | GPS/PIN/xlsx, saneo, parada de corrida |

## 6. Criterios de pasada

- [ ] `python -m unittest discover -s tests -t .` → **`Ran 106 tests` + `OK`** (sin errores ni fallos).
- [ ] `python -W error::SyntaxWarning -m py_compile app.py motor.py proceso.py utilidades.py ia/switch.py` → sin salida.
- [ ] `node --check static/app.js` → sin salida.
- [ ] Ningún test escribe fuera de `tempfile` (ver `test_reproceso` y `test_flujo_mock`).
- [ ] `\cvlo-auditor\` intacta (fuente de solo lectura).
- [ ] Tras UI: `GET /` 200, `GET /api/estado` 200, `GET /api/ia/modelos` 200 y **0 errores en consola**.

## 7. Problemas frecuentes del modo pruebas

| Problema | Causa | Solución |
|---|---|---|
| `Ran 81` pero algún fallo | cambio que rompió contrato | leer el trace: apunta a `tests/<archivo>:<línea>` |
| `FileNotFoundError` en el fixture | se corrió un test aislado sin el helper | ejecutar por suite (`tests.test_flujo_mock`) |
| Los tests intentan red | falta `CVLO_MOCK=1` | exportar la variable o usar `run_tests.bat` |
| Puerto 3015 ocupado al hacer smoke | servidor real levantado | cerrarlo antes o correr solo las suites sin HTTP |
| Mojibake en la salida | consola sin UTF-8 | `chcp 65001` (ya lo hace `run_tests.bat`) |
| Un test "pasa" pero no prueba nada | aserción vacía o `assert True` | exigir aserción sobre dato concreto (filas, columnas, texto) |

## Datos pendientes de validar

- [ ] Añadir test de extremo para Modo Web con **Descargas máximas** (hoy cubierto en corrida real, no en mock).
- [ ] Cobertura de `pillow-heif` (HEIC) con un fixture de imagen HEIC real.
- [ ] Runner único que ejecute `py_compile` + `node --check` + unittest (hoy: 3 comandos manuales).
