# SuitCVLO en Google Colab — instrucciones

> El mismo pipeline que `SuitCVLO-open` (mismas rutas, mismo `info.txt`, mismos criterios de
> exclusión) corriendo **en Colab con la GPU gratis**, en lotes de **40 fotos**.
> **Esta carpeta es autocontenida**: trae su propia copia del pipeline → `SuitCVLO-open`
> no se toca ni depende de ella.

## 0. Una sola vez: preparar Google Drive

1. Abre Google Drive en el navegador.
2. **Arrastra esta carpeta** (`SuitCVLOGCPy`) a la **raíz** de "Mi unidad".
   → Queda en `Mi unidad/SuitCVLOGCPy/`
3. Dentro de `Mi unidad/`, crea una carpeta `cvlo` con estos archivos/carpetas:

| Ruta en Drive | Qué es |
|---|---|
| `cvlo/Recorrido/` | tus fotos (HEIC/JPG) |
| `cvlo/GooMapsPines.txt` | pines (o `.kml` / `.xlsx`) |
| `cvlo/RutaKML.kml` | KML de respaldo |
| `cvlo/idxfotos.xlsx` | **el mismo índice** que usas en local — cópialo aquí para no perder las 188 filas |
| `cvlo/salida/` | aquí se construye `<AAMMPQ>\auditoria\...` (puede estar vacía) |

> Si no copias el `idxfotos.xlsx`, esta corrida **crea uno nuevo** con las 10 columnas.

## 1. Abrir el notebook con GPU

1. En Drive, doble clic sobre **`SuitCVLOGCPy/CVLO_Colab.ipynb`** → se abre en Colab.
   (Si no lo abre con Colab: clic derecho → *Abrir con* → *Google Colaboratory*.)
2. **Menú `Entorno de ejecución` → `Cambiar tipo de entorno` → `GPU`** → *Guardar*.
3. Ignora el aviso de que "se reiniciará el entorno" (está vacío).

## 2. Ejecutar las celdas en orden (▶)

| Celda | Qué hace | Cuánto tarda |
|---|---|---|
| **1 Entorno** | instala `pillow-heif`, `transformers`, `qwen-vl-utils`… y confirma la GPU | ~1 min |
| **2 Rutas** | monta Drive y valida que las rutas existan | ~20 s |
| **3 Pipeline** | importa `motor.py` / `proceso.py` / `ia/switch.py` desde Drive | instantáneo |
| **4 Modelo** | baja `Qwen2.5-VL` (3B en T4 / 7B si hay VRAM) y lo registra como **primer eslabón** | 2-5 min la primera vez |
| **5 Smoke** | lee **1 foto** y la imprime — si sale texto razonable, todo funciona | ~10-60 s |
| **6 Lote** | procesa **las 40 fotos pendientes** | ~2-5 min |
| **7 Resumen** | muestra las últimas filas del xlsx con `FechaCarga` | instantáneo |

**Nunca empieces por la 6**: si el modelo no está cargado, la celda 6 bajaría a otro eslabón.

## 3. Qué se genera

- `cvlo/salida/<AAMMPQ>/auditoria/<Grupo>/<PIN>/` → fotos convertidas a `.jpg` + `info.txt`
- `cvlo/idxfotos.xlsx` → misma estructura de siempre **+ columna `FechaCarga`** (columna 10)
- `cvlo/trabajo_colab/reads/*.json` → registro de cada foto leída (por eso no repite)

## 4. Reglas que se mantienen

1. **Nada se borra nunca** — todo es aditivo.
2. **No repite**: excluye lo que ya está en el xlsx, lo ya copiado en la salida y lo ya leído.
3. Quincena por la fecha de la foto (día 1-15 → `01`, 16-fin → `02`).
4. Tope de fotos por PIN (por defecto 10) y radio de cruce 250 m — configurables en la celda 2.

## 5. Preguntas frecuentes

**¿Cuántas fotos caben en una sesión?** 40 tardan ~2-5 min; la sesión de Colab dura 90 min.
Si se corta, vuelve a ejecutar las celdas 1 → 2 → 3 → 4 → 6: **todo el estado está en Drive**.

**¿Y si quiero que lea con otra IA?** Cambia `ia_proveedor` en la celda 6:
`'colab'` (GPU, gratis) · `'huggingface'` · `'deepseek'` · `'openrouter'` · `'gemini'`
o `'auto'` para que baje por la cadena si el primero falla. Las keys van en los
**Secrets** de Colab (`🔑` a la izquierda) con el mismo nombre de variable.

**¿Por qué me salían fotos repetidas antes?** Porque la lógica de exclusión depende del
`idxfotos.xlsx` + la carpeta de salida + `trabajo_colab/reads`. Aquí esos tres viven **en Drive**
y no desaparecen al cerrar la sesión.

**¿Puedo correr la app local a la vez?** Sí, pero no el mismo `idxfotos.xlsx` a la vez
(riesgo de pisarse). Elige uno u otro para cada tanda.

## 6. Validación

```bash
# en local, dentro de SuitCVLOGCPy
python -m unittest discover -s tests -t . -v   # 40 tests (sin red)
```
