# Skill: mejoras-proyecto

## Descripción
Auditoría completa y económica en tokens de un módulo dentro del monorepo **suitorg**. Combina lo que hacen por separado `code-index` (catálogo de funciones) y `project-audit` (arquitectura/seguridad genérica), y agrega lo que ninguna de las dos cubre: verificación de que el módulo sigue alineado con los documentos de gobernanza del Core (`ARCHITECTURE.md`, `AGENTS.md`, `INDEX_FUNCIONES.md`, `.suit/registry/`), cruce contra el historial de decisiones (`.suit/memory/decisions/*.md`) para distinguir hallazgos resueltos de nuevos, y una pasada de verificación dirigida antes de reportar. Solo lectura sobre el proyecto — el único archivo que escribe es su propio output.

## Trigger
- "mejoras proyecto", "mejoras_proyecto", "archivo de mejoras"
- "audita [módulo] completo", "análisis completo de [módulo]"
- "revisa este módulo a fondo", "audit completo SuitOS"

## Cuándo usar esta skill vs. las otras dos
| Si necesitas... | Usa |
|---|---|
| Solo el catálogo de funciones/endpoints, rápido, sin seguridad ni arquitectura | `code-index` |
| Auditoría genérica de un proyecto que **no** vive dentro de suitorg (sin `.suit/`, sin `ARCHITECTURE.md` propio) | `project-audit` |
| El archivo de mejoras completo de un módulo `Suit*`/`CampanasAi`/etc. **dentro** de este monorepo, con alineación al Core verificada | `mejoras-proyecto` (esta skill) |

## Instrucciones

### Fase 0 — Reusar antes de regenerar (obligatoria, es la que más tokens ahorra)
Antes de lanzar cualquier agente:
1. Buscar (`Glob`) si ya existen `INDEX_FUNCIONES.md`/`INDEX.md` (raíz del monorepo o del proyecto), `<módulo>/REVISION_ARQUITECTURA.md` o `<módulo>/MEJORAS_<MODULO>.md`.
2. Si existen, leer su metadata (fecha, commit auditado si lo tiene) y comparar contra el último commit que tocó código fuente del módulo (`git log -1 --format=%cd -- <módulo>/`, solo lectura).
3. Si el output existente es igual o más reciente que el último cambio de código relevante → **reusarlo como insumo** de las Fases 2-6. No relanzar agentes de exploración ni releer los archivos fuente función por función.
4. Buscar (`Glob`) reportes de `reportero` (SuitOSCore) en `.suit/logs/review/*.md` cuyo nombre incluya alguno de los archivos del módulo. Si existen y son posteriores al último commit relevante, anotar qué archivos ya tienen veredicto de seguridad/calidad — la Fase 1 no debe relanzar el Agente 3 (Seguridad y Calidad) sobre esos archivos, solo sobre los que falten.
5. Comprobar si `generate-index` de SuitOSCore está disponible (`node_modules/.bin/generate-index`, o `SuitOSCore/tooling/generate-index.js` en algún ancestro del proyecto). Si está disponible, se usará en Fase 1 en vez del Agente 1/2 de `code-index` para localizar funciones.
6. Si todo lo anterior falta o quedó desactualizado → ejecutar Fase 1 completa.

Sin este paso, cada corrida repite el trabajo de hasta 5 agentes Explore leyendo miles de líneas — es el costo dominante de toda la skill.

### Fase 1 — Generar índice + audit base (solo lo que Fase 0 no permitió reusar)

**Catálogo de funciones — prioridad a la herramienta determinística:**
- Si `generate-index` está disponible (Fase 0.5): ejecutarlo (`node .../generate-index.js`) para refrescar `INDEX_FUNCIONES.md`/`INDEX.md`. Es gratis en tokens y exacto en archivo:línea — no reemplazar este resultado relanzando el Agente 1/2 de `code-index` para lo mismo.
- Los Agentes 1 (Backend/Lógica) y 2 (Frontend/Config) de `code-index` se lanzan **solo** para lo que `generate-index` no infiere: descripción semántica breve, categoría (API/DB/Utils/Service/Frontend/Config) y relaciones "llama a"/"usada por". Deben referenciar las líneas que ya dio `generate-index`, no volver a localizarlas.
- Si `generate-index` **no** está disponible, los Agentes 1 y 2 hacen el trabajo completo (fallback como en `code-index` a secas), y el resultado se anexa como sección "Catálogo de funciones (LLM, sin generate-index disponible)" dentro de `REVISION_ARQUITECTURA.md` — nunca como archivo `CODE_INDEX.md` aparte, para no duplicar la fuente canónica que exige `CLAUDE.md` raíz §3 (`INDEX_FUNCIONES.md`).

**Arquitectura/seguridad:** lanzar en paralelo los Agentes 1-3 de `project-audit` (Estructura/Stack, Patrones/Arquitectura, Seguridad/Calidad), excluyendo del Agente 3 los archivos ya cubiertos por `reportero` (Fase 0.4). Reglas para estos agentes:
- Respuesta máxima ≈700 palabras, priorizada por severidad/relevancia, en tablas con `archivo:línea` — nunca bloques de código completos.
- Para archivos >500 líneas: preferir `Grep` con patrones de firma (`function `, `const \w+\s*=`, `class `, `def `, `app\.(get|post|put|delete)`) sobre `Read` completo. Solo usar `Read` en los rangos donde `Grep` ya localizó algo concreto.

Producir `REVISION_ARQUITECTURA.md` en la raíz del módulo. El catálogo de funciones vive únicamente en `INDEX_FUNCIONES.md`/`INDEX.md`.

### Fase 2 — Alineación con el Core (ligera: solo Grep, casi nunca Read completo)
1. `Grep` el nombre del módulo (y su carpeta) en `ARCHITECTURE.md`, `AGENTS.md`, `INDEX_FUNCIONES.md`, `.suit/registry/projects.yaml`, `.suit/registry/routing.yaml` (raíz del monorepo).
2. Comparar contra `INDEX_FUNCIONES.md`/`INDEX.md` y `REVISION_ARQUITECTURA.md`: ¿la ruta (`path:`) coincide con la carpeta real en disco? ¿los conteos de líneas que cita el Core siguen siendo ciertos (±10%)? ¿la lista de features/modos que documenta el Core sigue completa? Si `INDEX_FUNCIONES.md` está desactualizado respecto al `generate-index` recién corrido en Fase 1, es en sí mismo un hallazgo de "Core desactualizado".
3. Cada discrepancia es un hallazgo de categoría **"Core desactualizado"**, citando lo que dice el Core vs. lo real, con `archivo:línea` de ambos lados.
4. **Regla de verificación**: si esta fase se ejecuta tarde en una sesión larga, releer con `Read` (no confiar solo en el primer `Grep`) las líneas exactas antes de reportar — los archivos de registro pueden cambiar entre lecturas dentro de la misma sesión. Ante conflicto entre dos lecturas, gana la más reciente.

### Fase 3 — Cruce contra historial de decisiones (ADRs)
1. `Glob` `.suit/memory/decisions/*.md` filtrando por nombre del módulo.
2. Para cada hallazgo crítico/alto de la Fase 1, clasificar su estado:
   - ✅ **Resuelto y se sostiene** — un ADR lo describe como arreglado y el audit de hoy no lo repite.
   - ⚠️ **Regresión** — un ADR lo arregló, pero o (a) el audit de hoy lo vuelve a encontrar, o (b) el propio ADR documenta una consecuencia negativa conocida y aceptada.
   - 🔴 **Abierto y conocido** — ya estaba señalado como riesgo (p.ej. en "Known gotchas" de `AGENTS.md`) pero nunca se arregló.
   - 🆕 **Nuevo** — no aparece en ningún ADR ni gotcha previo.

### Fase 4 — Verificación dirigida (no exhaustiva)
Releer directamente (sin agente intermedio) solo los 3-5 hallazgos de mayor severidad, para confirmar que siguen vigentes tal como se reportaron. Si algo cambió, corregirlo y anotar la corrección explícitamente. No repetir esto para hallazgos de severidad media/baja — mantener el costo acotado.

### Fase 5 — Exposición de secretos en git (solo si Fase 1/4 confirmó un secreto hardcodeado)
`git log --all --oneline -- <archivo>` (solo lectura). Si el archivo tiene historial de commits, la remediación correcta es "rotar credenciales", no solo "eliminar/gitignorar archivo" — dejarlo así en el reporte.

### Fase 6 — Salida
Generar `MEJORAS_<MODULO>.md` (mayúsculas, sin acentos) en la raíz del módulo con:
1. **Metadata**: fecha, módulo, fuentes usadas (indicar si el catálogo de funciones vino de `generate-index` o de fallback LLM, y si se reusaron reportes de `reportero`), commit corto auditado (`git rev-parse --short HEAD`), y lista explícita de **archivos cuyo cambio invalida este reporte** (para que la Fase 0 de la próxima corrida sepa si puede reusarlo).
2. **Hallazgos** de seguridad y arquitectura, cada uno con su estado de Fase 3 (Resuelto / Regresión / Abierto / Nuevo).
3. **Alineación con el Core** — tabla de discrepancias de Fase 2.
4. **Diffs propuestos al Core** — para cada discrepancia de Fase 2, el texto exacto sugerido para `ARCHITECTURE.md`/`AGENTS.md`/`INDEX_FUNCIONES.md`/`projects.yaml` (se propone, nunca se aplica sin autorización explícita).
5. **Recomendaciones priorizadas** con esfuerzo estimado (mismo formato que `project-audit`).
6. **Resumen ejecutivo** (3-5 oraciones).
7. **Preguntas abiertas / no verificado en esta sesión** — todo lo que no se pudo confirmar directamente.

## Reglas
- **Solo lectura sobre el código del proyecto** — nunca modificar archivos fuente ni documentos Core. Los únicos archivos que esta skill escribe son sus propios outputs (`INDEX_FUNCIONES.md`/`INDEX.md` vía `generate-index`, `REVISION_ARQUITECTURA.md`, `MEJORAS_<MODULO>.md`). No genera `CODE_INDEX.md` — ese archivo queda reservado para cuando se invoca `code-index` de forma independiente, fuera de este flujo.
- Los comandos `git` son exclusivamente de lectura (`log`, `rev-parse`, `diff --stat`) — nunca `commit`, `add`, `push`, `reset`, `checkout --`, etc.
- Prioridad de herramientas: herramienta determinística de SuitOSCore (`generate-index`, reportes de `reportero`) > `Grep`/`Glob` > `Read` dirigido > `Read` completo > lanzar un agente Explore. Un agente Explore solo se justifica cuando el alcance cruza varios archivos grandes y ninguna herramienta determinística cubre esa parte.
- Si Fase 0 permite reusar, saltar directo a Fase 2 — no relanzar ningún agente Explore.
- No inventar — todo lo no verificado en la sesión se marca explícitamente como tal, nunca se presenta como hecho.
- Nombre de salida siempre `MEJORAS_<MODULO>.md` para que sea reconocible y reusable entre módulos del monorepo.
