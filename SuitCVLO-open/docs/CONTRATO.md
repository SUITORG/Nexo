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
- Variables de entorno requeridas: `DEEPSEEK_API_KEY` (opcional), `OPENROUTER_API_KEY` (opcional),
  `GEMINI_API_KEY` (opcional), `CVLO_VLM` (opcional, default = modelo local con visión más liviano),
  `OLLAMA_URL` (opcional, default `http://127.0.0.1:11434`), `OLLAMA_TIMEOUT_S` (opcional, 900),
  `CVLO_MOCK` (pruebas)
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

## Orden del switch (inmutable sin decisión del usuario)
1. `ollama` — local, `CVLO_VLM`, sin costo, offline
2. `deepseek` — nube, 5M tokens gratis al registrar (`DEEPSEEK_API_KEY`), modelo con visión
3. `openrouter` — nube gratis (`OPENROUTER_API_KEY`), modelos con visión
4. `gemini` — nube (`GEMINI_API_KEY`), mejor calidad de OCR en español

> AutoClaw/AutoGLM se **eliminó** de la cadena el 2026-10-01 → ver ADR-038.

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
