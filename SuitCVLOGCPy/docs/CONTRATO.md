# CONTRATO — SuitCVLOGCPy
Alcance: `SuitCVLOGCPy/` · Contrato padre: `AGENTS.md` (raíz) · Fecha: 2026-10-02

## Propósito
La **misma secuencia** de `SuitCVLO-open` (fuentes → rutas → GPS EXIF → cruce por PIN →
estructura `<AAMMPQ>\auditoria\<Grupo>\<PIN>\` + `info.txt` + `idxfotos.xlsx`) ejecutándose
**en Google Colab con la GPU gratis**, en lotes de **40 fotos**, con:
- fotos, pines y KML **en Google Drive**,
- salida **en Google Drive**,
- **el mismo `idxfotos.xlsx`** que se va llenando conforme se leen las fotos, con la columna
  extra **`FechaCarga`**.

## Stack y ejecución
- Lenguaje / runtime: Python 3 **dentro de un notebook de Colab** (no hay servidor ni puerto)
- Ejecución: `CVLO_Colab.ipynb` → celdas 1→7 en orden · GPU obligatoria
- Validación local: `python -m unittest discover -s tests -t . -v` (40 tests, sin red)
- Dependencias: ver `requirements.txt` (la celda 1 las instala)

## Datos
- Consume `Config_Empresas`: **no** (usuario único, sin `id_empresa`)
- Persistencia: **Google Drive** (xlsx + `info.txt` + `trabajo_colab/reads`) — todo sobrevive a
  que la sesión de Colab caduque
- Sin base de datos, sin borrados

## Límites
- Puede modificar: `SuitCVLOGCPy/**` y, para el alta, `.suit/registry/projects.yaml`,
  `.suit/INDEX.md`, `.suit/memory/decisions/` (ADR), `AGENTS.md` (tabla)
- **No debe tocar: `SuitCVLO-open/`** (proyecto hermano, decisión explícita del usuario 2026-10-02),
  `\cvlo-auditor\` (solo lectura), `SuitCVLO/`, `server.js`, `backend/`
- **Copia del pipeline incluida** en esta carpeta (`motor.py`, `proceso.py`, `utilidades.py`,
  `ia/`): origen `SuitCVLO-open` @ commit `7c612d3`. Si se corrige un bug en el hermano,
  hay que replicarlo aquí (y al revés).

## Invariantes
1. **Nada se elimina**: todo aditivo; temporales en `trabajo_colab/`
2. **No repite fotos**: exclusión por xlsx + salida + `trabajo_colab/reads`
3. Sin BD: archivos en Drive (Excel, JSON, carpetas)
4. `FechaCarga` va en la **columna 10** — las columnas 1-9 (Verificado=8, PIN=9) no se mueven
5. El eslabón `colab` solo existe **mientras el notebook tenga el modelo cargado**; si no, la
   cadena sigue con el resto (invariante: nunca cortar la corrida)
6. Sin secretos en el código: `.env` opcional o Secrets de Colab

## Cadena de lectura en Colab
`colab (GPU) → ollama → huggingface → deepseek → openrouter → gemini`
(los eslabones 2-6 solo aplican si están disponibles; en Colab lo normal es `colab` solo)

## Definición de terminado
- 40 tests en verde + `py_compile` sin warnings + notebook JSON válido y celdas compilando
- Smoke de 1 foto ejecutado por el usuario en Colab (celda 5)
- Commit por fase

## POR CONFIRMAR
- Ninguno — decisiones explícitas del usuario (2026-10-02): modelo DENTRO de Colab con GPU,
  entrada por carpeta de Drive eligiendo las 40 pendientes, Colab como herramienta principal,
  mismo xlsx con `FechaCarga`, y **no tocar `SuitCVLO-open`**.

## Cambios
- 2026-10-02: creación (F0)
