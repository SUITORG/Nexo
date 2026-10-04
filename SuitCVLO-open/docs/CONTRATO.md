# CONTRATO — SuitCVLO-open
Alcance: `SuitCVLO-open/` · Contrato padre: `CONTRATO.md` (raíz) + `AGENTS.md` · Fecha: 2026-10-01

## Propósito
Aplicación web local que procesa lotes de fotos de publicidad exterior (OOH) y genera la
estructura de auditoría (`<AAMMPQ>\auditoria\<Grupo>\<PIN>\` + `info.txt` + `idxfotos.xlsx`),
**con el motor de lectura IA desacoplado**: un switch de proveedores que intenta primero
Ollama local (modelo con visión), luego DeepSeek, luego OpenRouter y por último Gemini.
Versiona en "open" el proyecto `\cvlo-auditor` (fuente de solo lectura) **sin depender de
AutoClaw/AutoGLM** (servicio y clave eliminados del código, ver ADR-038).

## Stack y ejecución
- Lenguaje / runtime: Python 3 + Flask (reuso del proyecto origen, sin reescritura)
- Comandos: instalar `pip install flask openpyxl pillow pillow-heif gdown` ·
  desarrollo `python app.py` (puerto **3015**) · pruebas `python -m unittest discover -s tests -t . -v` ·
  build `no aplica (sin build)`
- Variables de entorno requeridas: `OPENCODE_API_KEY` (opcional — si falta, se lee de
  `~/.local/share/opencode/auth.json`), `OPENCODE_BASE_URL` (opcional, default Go),
  `OPENCODE_VISION_MODEL` (opcional, default `deepseek-v4-flash-vision-exp`),
  `DEEPSEEK_API_KEY` (opcional), `GEMINI_API_KEY` (opcional),
  `HF_TOKEN` y `OPENROUTER_API_KEY` (**desactivados** desde 2026-10-02: vacíos en `.env`),
  `CVLO_VLM` (opcional, default = modelo local con visión más liviano),
  `OLLAMA_URL` (opcional, default `http://127.0.0.1:11434`), `OLLAMA_TIMEOUT_S` (opcional, 900),
  `CVLO_MOCK` (pruebas). **Prioridad: el `.env` del proyecto manda sobre el entorno; vacío = desactivar.**
- Nada de secretos en el repositorio: `.env` (gitignored) o `.env.example` como guía

## Datos y multi-inquilino
- Consume `Config_Empresas`: **no** (decisión explícita del usuario, 2026-10-01 — fuera del ramal Sheets/Supabase/Brief)
- Motores soportados: ninguno — todo en archivos locales (Excel, JSON, carpetas)
- Ubicación de esquema o migraciones: no aplica
- Reglas de aislamiento entre empresas: no aplica; es una herramienta de usuario único

## Límites
- Puede modificar: `SuitCVLO-open/**`; para el alta: `.suit/registry/projects.yaml`,
  `.suit/INDEX.md`, `.suit/memory/decisions/` (ADR), `AGENTS.md` (tabla de puertos),
  `GuiaTotal/registro/suitcvlo-open.yaml`
- No debe tocar: `\cvlo-auditor\` (SOLO LECTURA, fuente), `SuitCVLO/` (proyecto YOLO independiente),
  `SuitCVLOGCPy/` (proyecto Colab — **ni leer ni modificar** desde 2026-10-03, decisión del usuario),
  `server.js` raíz, `backend/`, otros subproyectos, `.github/workflows/`
- Dependencias con otros subproyectos: ninguna — servidor y frontend propios

## Invariantes (no romper nunca)
1. **`\cvlo-auditor\` es de solo lectura** — jamás escribir ni borrar ahí; todo cambio vive en `SuitCVLO-open/`
2. **Nunca se elimina ningún archivo** de los datos del usuario (regla del proyecto origen): los temporales quedan en `trabajo\`
3. Sin base de datos: todo vive en archivos locales (Excel, JSON, carpetas)
4. IDs secuenciales / nombres de carpeta saneados; sin UUID en nombres de salida
5. Sin claves en el código: ninguna `APP_KEY`/token hardcodeada (el origen tenía una en `motor.py:43` — eliminada aquí)
6. El switch de IA **nunca corta la corrida**: si un proveedor falla, baja por la cadena y registra el motivo en el log
7. Multi-proveedor por `.env`, no por columnas nuevas ni schema externo
8. **Prioridad de la fuente** (2026-10-04, decisión explícita): con `prioridad: kml` el **KML**
   manda en el cruce y en el `info.txt` (`PIN`, coordenadas, dirección, `MEDIO/FORMATO/ID/GRUPO`,
   y `MARCA` → `PROVEEDOR`); si el KML no trae el PIN, se toma del mapa de pines; si la foto y el
   KML difieren en metros, gana el KML. Lo que no viene del KML se marca con ` *`. La `MARCA` de la
   IA solo se usa si está en `marcas-conocidas.txt` (sin archivo = sin validación). El
   `idxfotos.xlsx` **no cambia**: manda la foto.

## Orden del switch (inmutable sin decisión del usuario)
1. `opencode` — **tu suscripción**; key leída de `~/.local/share/opencode/auth.json` (o `OPENCODE_API_KEY`);
   modelo `deepseek-v4-flash-vision-exp` (único de sus 86 con visión). Medido: **3.2 s/foto, ~USD 0.00028**
2. `ollama` — local, `CVLO_VLM`, sin costo, offline (lento: ~456 s/foto en CPU)
3. `huggingface` — nube, **DESACTIVADO 2026-10-02** (créditos agotados) → línea comentada en `.env`
4. `deepseek` — nube, 5M tokens gratis al registrar (`DEEPSEEK_API_KEY`), modelo con visión
5. `openrouter` — nube, **DESACTIVADO 2026-10-02** (key daba `401`) → línea comentada en `.env`
6. `gemini` — nube (`GEMINI_API_KEY`), mejor calidad de OCR en español

> AutoClaw/AutoGLM se **eliminó** de la cadena el 2026-10-01 → ver ADR-038.
> HuggingFace se **añadió** el 2026-10-02 → ver ADR-039.
> OpenCode entró **el primero** y HuggingFace/OpenRouter se **desactivaron** el 2026-10-02 → ver ADR-041.

## Definición de terminado
- Validación en PASA con evidencia en `docs/VALIDACION.md`
- Commit por fase (ciclo F0-F7)
- Sync de datos: no aplica (sin DB)

## POR CONFIRMAR
- Ninguno — todo derivado de decisiones explícitas del usuario (2026-10-01): alcance = copia de
  `cvlo-auditor` + switch IA, cadena `Ollama(VLM) → DeepSeek → OpenRouter → Gemini`, sin Sheets.

## Cambios
- 2026-10-01: creación (fase 0) a partir de las decisiones del usuario en la sesión de diseño
- 2026-10-01: **AutoClaw/AutoGLM eliminado de la cadena** y añadido DeepSeek (5M tokens gratis) → ADR-038
- 2026-10-02: **añadido `huggingface`** como eslabón 2 (router gratis, ~4 s/foto) → ADR-039
- 2026-10-02: **`opencode` entra el primero** (tu suscripción, `deepseek-v4-flash-vision-exp`,
  3.2 s/foto) y **se desactivan `huggingface` y `openrouter`** (líneas comentadas en `.env`) → ADR-041
- 2026-10-03: **`SuitCVLOGCPy` sale del alcance** — no se lee ni se modifica (decisión del usuario)
- 2026-10-04: **prioridad de la fuente configurable** (`prioridad: kml|pines` en `CVLOCFG.txt` y en
  *Opciones avanzadas*): el KML manda en el cruce y en el `info.txt`, con ` *` para lo que no viene
  del KML + validación de `MARCA` con `marcas-conocidas.txt`; se arregla `COORDENADAS` (300 PINs
  cruzables, antes 286) y se añade **`Reescribir info.txt`** (regenera sin IA, `POST /api/reescribir-info`)
