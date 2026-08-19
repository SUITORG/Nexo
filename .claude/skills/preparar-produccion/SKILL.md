# Skill: preparar-produccion

## Descripción
Antes de subir cambios a producción (`git push origin main` → dispara `.github/workflows/deploy.yml` → publica TODO el repo en grupoevasol.com vía GitHub Pages), clasifica los archivos modificados/nuevos en categorías simples para que un usuario no-técnico entienda qué va a pasar. Genera `revision-produccion/REPORTE.md` (carpeta local, nunca se commitea). Solo lectura + un reporte — nunca hace `git add`/`commit`/`push` por sí sola.

## Trigger
- "subir a producción", "preparar deploy", "qué subo a producción", "preparar-produccion", "revisar antes de subir"

## Contexto clave (no re-derivar, ya verificado en este repo)
- `deploy.yml` sube el repo **completo** (`path: '.'`) salvo lo que gitignora Git o lo que el propio workflow borra a mano (hoy solo `AmbuRide/`). Es decir: casi todo lo que está en `git status` termina público en grupoevasol.com si se commitea y se hace push a `main`, aunque el archivo no tenga nada que ver con el sitio.
- `dist/` está en `.gitignore` y se regenera solo por un bot (`ssg-regenerate.yml`, cron 03:00 UTC o `workflow_dispatch`) que hace `git add -f dist/` y push directo a `main`. **Nunca editar `dist/` a mano.**
- `js/modules/config.js` también está en `.gitignore` — se genera en el propio `deploy.yml` desde secrets (`API_URL`/`API_TOKEN`). Si aparece modificado con contenido real en el working directory, es un archivo local de desarrollo, no se commitea.
- `SuitCampanas/`, `SuitAI/`, `SuitChatTG/`, `SuitMiDBdic/`, `AmbuRide/` y demás subproyectos NO son el sitio grupoevasol.com, pero SÍ viajan al repo público salvo exclusión explícita en `deploy.yml` (patrón: `rm -rf <carpeta>` bajo el step "Exclude non-public projects from Pages"). Esto es una deuda conocida (ver `CLAUDE.md` § Pendientes críticos, Fase 4 ADR-022) — no corregirla sin que el usuario lo pida explícitamente.

## Instrucciones

1. `git status --porcelain` para listar modificados + nuevos (no tocar staged/commits, solo leer).
2. Clasificar cada ruta con esta tabla fija (por prefijo de ruta):

| Categoría | Prefijos / reglas |
|---|---|
| 🟢 PRODUCCIÓN — Público (raíz del sitio) | `index.html`, `style.css`, `RESPONSIVE-UI.css` y cualquier otro archivo raíz que `index.html` referencie directamente |
| 🟢 PRODUCCIÓN — Módulos (lógica del sitio) | `js/modules/*.js` (excepto `config.js`, que es autogenerado) |
| 🟢 PRODUCCIÓN — SSG / Landings | `SuitLandings/**`, `scripts/ssg-engine.mjs` (cambios aquí no se ven en vivo hasta el próximo cron/`workflow_dispatch` de `ssg-regenerate.yml`) |
| 🔧 Infraestructura de deploy | `.github/workflows/**` (cuidado extra: cambia CÓMO se publica todo) |
| ⚪ Fuera del sitio (viaja al repo público igual, pero no es grupoevasol.com) | Cualquier otra carpeta de proyecto (`SuitAI/`, `SuitCampanas/`, `SuitChatTG/`, `SuitMiDBdic/`, `AmbuRide/`, etc.), `Documentacion/`, `docs/`, `.suit/`, `*.md` sueltos, `*.bat`, configs de editor/agente (`.claude/`, `opencode*`) |
| 🚫 RIESGO — nunca commitear | Cualquier ruta que matchee `.env*`, `*token*`, `*secret*`, `credentials*.json`, `google-credentials.json`, o que al abrirla contenga algo con forma de API key/token |

3. Para la categoría 🚫 RIESGO: abrir el archivo y confirmar si de verdad contiene un secreto. Si sí, marcarlo en **rojo** al inicio del reporte, con la acción concreta: no incluir en `git add`, y si el token es real, hay que rotarlo (no basta con solo excluirlo del commit).
4. Escribir `revision-produccion/REPORTE.md` con: fecha, resumen por categoría (conteo + lista de rutas), y al final una sección "Próximo paso sugerido" con el comando `git add` sugerido **solo** para las categorías 🟢 (nunca sugerir `git push` automáticamente — eso lo decide el usuario).
5. Asegurarse de que `revision-produccion/` esté en `.gitignore` (si no está, añadirlo) — este reporte es un archivo de trabajo local, no debe publicarse.
6. Responder en el chat con un resumen corto en español simple (sin jerga), priorizando primero cualquier hallazgo 🚫 RIESGO.

## Reglas
- Nunca ejecutar `git add`, `git commit`, `git push`, ni editar archivos fuente del proyecto — esta skill solo clasifica y reporta.
- Si aparece un secreto real, es el hallazgo más importante del reporte, va primero, siempre.
- No inventar rutas: si una carpeta no aparece en `git status`, no se reporta.
