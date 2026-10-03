# VALIDACIÓN — SuitCVLOGCPy

Fecha: 2026-10-02 · Workflow: `ciclo` F0-F5

## Resultado: **PASA (validación local)**

| # | Check | Evidencia | Estado |
|---|---|---|---|
| 1 | `py_compile` sin warnings | `motor.py proceso.py utilidades.py ia/*.py tests/*.py` con `-W error::SyntaxWarning` → sin salida | ✅ |
| 2 | Suite de pruebas | `python -m unittest discover -s tests -t .` → **Ran 43 tests … OK** (sin red) | ✅ |
| 3 | Notebook válido | `CVLO_Colab.ipynb` → JSON parsea, **9 celdas**, **7 code compilan** con `compile()` | ✅ |
| 4 | Eslabón `colab` | `registrar_vlm()` → `_disponible` True, `_elegir` devuelve el modelo, `leer()` lo usa como **primer eslabón** y si responde vacío baja al resto → 4 tests | ✅ |
| 5 | `FechaCarga` | xlsx nuevo → 10 columnas con `FechaCarga` en la 10 y `Verificado`=8 / `PIN`=9 intactos; xlsx viejo de 9 columnas → gana la cabecera sin mover nada → 2 tests | ✅ |
| 6 | Sin tocar el hermano | `git status SuitCVLO-open` → **vacío** (la copia es independiente) | ✅ |
| 7 | Copia íntegra | `motor.py`+`proceso.py`+`utilidades.py`+`ia/`+5 tests traídos de `SuitCVLO-open@7c612d3` | ✅ |

## Pruebas nuevas (respecto al hermano)

| Test | Qué cubre |
|---|---|
| `SwitchColab.test_sin_modelo_no_esta_disponible` | sin modelo cargado, el eslabón no se intenta |
| `SwitchColab.test_registrar_vlm_lo_activa_como_primer_eslabon` | registrar → disponible → `leer()` responde sin red |
| `SwitchColab.test_los_demas_eslabones_siguen_despues` | respuesta vacía del VLM → baja a Ollama/la cadena |
| `SwitchColab.test_modelos_incluye_el_local` | aparece en `modelos()` marcado `(local)` con `vision` |
| `TestFechaCarga.test_xlsx_nuevo_lleva_fecha_carga` | corrida real en mock → columna 10 con `AAAA-MM-DD HH:MM` |
| `TestFechaCarga.test_xlsx_viejo_gana_la_columna_sin_tocar_las_demas` | xlsx de 9 columnas no pierde Verificado/PIN |

Se **eliminó** `TestApiMock` (dependía de `app.py`/Flask, que no existe aquí: Colab no lleva servidor).

## No probado (requiere Colab)

- **Ejecución real del notebook** en un runtime con GPU (no se puede probar desde esta máquina).
  Lo ejecuta el usuario siguiendo `INSTRUCCIONES.md`; la **celda 5 (smoke de 1 foto)** es el gate.
- Descarga del modelo Qwen2.5-VL (2-5 min la primera vez) y comportamiento del OCR en fotos reales.
- Tamaño/VRAM reales del runtime que asigne Colab (T4 → 3B; ≥15 GB → 7B).

## Cómo verificar

```bash
cd SuitCVLOGCPy
python -m unittest discover -s tests -t . -v     # 43 tests
python -c "import json,io; nb=json.load(io.open('CVLO_Colab.ipynb',encoding='utf-8')); \
           [compile(''.join(c['source']),'c','exec') for c in nb['cells'] if c['cell_type']=='code']; \
           print('notebook OK')"
```
