# Mejoras SuitCampanas — Análisis y Punto de Vista

**Fecha**: 2026-07-19
**Tipo**: Síntesis de solo lectura — no se modificó ningún archivo del proyecto
**Fuentes usadas**:
- `SuitCampanas/CODE_INDEX.md` (generado hoy, skill `code-index`)
- `SuitCampanas/REVISION_ARQUITECTURA.md` (generado hoy, skill `project-audit`)
- `ARCHITECTURE.md` (raíz), `AGENTS.md` (raíz), `INDEX_FUNCIONES.md` (raíz)
- `.suit/registry/projects.yaml`, `.suit/registry/routing.yaml`
- `.suit/memory/decisions/ADR-008-campanasai-security-history-fix.md`
- `.agent/workflows/1migrar-supabase.md`
- `SuitCampanas/ROADMAP_CampanasAI.md`

Este documento no repite el detalle línea por línea que ya está en `CODE_INDEX.md` y `REVISION_ARQUITECTURA.md`. Su valor agregado es cruzar esos dos archivos contra los documentos de gobernanza del monorepo (`ARCHITECTURE.md`, `AGENTS.md`, `.suit/registry/`, ADR-008, plan de migración) para responder tres preguntas que el audit genérico no cubre: **¿qué está realmente resuelto vs. lo que se cree resuelto?**, **¿el módulo cumple los estándares inmutables del Core?**, y **¿qué conocimiento falta incorporar al Core?**

---

## 1. El hallazgo más importante: el Core está desincronizado del módulo real

Antes de discutir seguridad o deuda técnica, hay un problema que los afecta a todos: los documentos que gobiernan cómo cualquier agente debe operar sobre este módulo apuntan a una versión que ya no existe.

| Documento Core | Qué dice | Realidad verificada |
|---|---|---|
| `.suit/registry/projects.yaml:18` | `path: CampanasAi/` | La carpeta real es `SuitCampanas/`. `CampanasAi/` no existe en el filesystem. |
| `AGENTS.md:73,115-119` | Rutas `CampanasAi/script.js:8-11`, `CampanasAi/local-server-node.js` | Mismo problema de path; además línea 8-11 ya no tiene el secreto (ver §2). |
| `INDEX_FUNCIONES.md:138-212` | Indexa `CampanasAi/...` con `fetchWithRedirects` en línea 1061 | El archivo real está en `SuitCampanas/` y esa función hoy vive en la línea **1406** (`CODE_INDEX.md:80`) — el índice quedó ~350 líneas atrás. |
| `ARCHITECTURE.md:60-61` | `index.html` (498 líneas), `script.js` (2048+ líneas) | Hoy son 650 y 2605 líneas respectivamente (`CODE_INDEX.md`/`REVISION_ARQUITECTURA.md`). |
| `ARCHITECTURE.md:423-429` (§16) | Documenta 4 modos: Ai, BD, BDPR, IMG | El código real tiene **8 modos**: + BDSMT, BDPV, ViRe, VIDE (`CODE_INDEX.md:208-215`). |
| `ARCHITECTURE.md:33-34` | Supabase "en migración desde Google Sheets" | El plan de migración (`.agent/workflows/1migrar-supabase.md`) está prácticamente ejecutado: tablas creadas, cliente Supabase, 27 endpoints, `sync-gas.js` para Fase 6. La narrativa de "en migración" ya no refleja la realidad. |

**Por qué importa**: el propio `CLAUDE.md` de la raíz exige, en su §3, seguir el orden `ARCHITECTURE.md → INDEX_FUNCIONES.md → .suit/registry/projects.yaml` antes de tocar código. Un agente que siga esa regla al pie de la letra terminará buscando `CampanasAi/local-server-node.js`, no lo encontrará, y perderá tiempo (o peor, asumirá que el módulo no existe). Esto no es un detalle cosmético — es la causa raíz de que cualquier auditoría futura tenga que redescubrir todo desde cero en vez de partir de un mapa confiable.

**Recomendación**: actualizar `path:` en `projects.yaml`, las rutas en `AGENTS.md`, y regenerar `INDEX_FUNCIONES.md` para la sección de Campañas (o enlazar directamente al `CODE_INDEX.md` propio del módulo, que ya está más actualizado y detallado que el índice central). Esfuerzo: 15-20 min.

---

## 2. Seguridad: qué está realmente resuelto vs. lo que sigue abierto

`REVISION_ARQUITECTURA.md` lista varios hallazgos críticos como si fueran todos nuevos. Cruzándolos con **ADR-008** (2026-07-10, "SuitCampanas Security & History Fix"), el panorama es más matizado:

| Hallazgo | Estado real | Evidencia |
|---|---|---|
| Path traversal en `/api/bdpv/open` | ✅ **Resuelto y se mantiene resuelto** | ADR-008 §1.3 documenta el fix (valida que resuelva dentro de `__dirname/presentations/`). `REVISION_ARQUITECTURA.md` (generado hoy) ya no lo lista como abierto — el fix aguantó. |
| Estado de modelo IA compartido entre usuarios (race condition) | ✅ **Resuelto** | ADR-008 §1.2, aislado por request. No vuelve a aparecer en el audit de hoy. |
| Formato de error inconsistente | ✅ **Resuelto** | ADR-008 §1.4. |
| Secretos hardcodeados en `script.js` (token, Drive API key) | ⚠️ **Resuelto en el archivo vivo, pero reintroducido por el propio proceso de fix** | ADR-008 movió los secretos fuera de `script.js` hacia `/api/config/client` — confirmado: `script.js:9` hoy tiene `DRIVE_API_KEY: ''` (poblado async desde servidor), no el valor real. **Pero** el ADR-008 creó `._backup/` como respaldo de rollback con las versiones *anteriores* (con secretos reales) y ese backup nunca se eliminó del repo. `REVISION_ARQUITECTURA.md` lo confirma: `._backup/script.js:8-10` sigue teniendo `DRIVE_API_KEY`, `DRIVE_CLIENT_ID`, `DRIVE_APP_ID` reales. |
| `service_role` key en `lib/supabase.js` | 🔴 **Nunca resuelto, conocido desde antes de ADR-008** | Aparece en 3 fuentes independientes: `AGENTS.md:116` ("bypasses RLS, treat as high risk"), `ARCHITECTURE.md:608` ("hoy se está bypassing Row Level Security"), y `REVISION_ARQUITECTURA.md`. El propio plan de migración (`.agent/workflows/1migrar-supabase.md:80`) lo instruyó así deliberadamente ("service_role para backend") sin plan de reemplazo por RLS + anon key. |
| Token de seguridad en POST | ⚠️ **Regresión parcial** | ADR-008 dejó el campo de token vacío por defecto ("Negative: Token field is now empty by default") como consecuencia aceptada del fix de secretos. Esto, sumado a que `REVISION_ARQUITECTURA.md` confirma que `/api/industrias`, `/api/campanas`, `/api/recetas`, `/api/prompts/:id` no tienen autenticación, significa que la regla inmutable de `ARCHITECTURE.md:328` ("Token de seguridad requerido en todo POST") **hoy no se cumple** para los endpoints Supabase. |
| Command injection vía `execSync(shell:true)` en FFmpeg/TTS | 🔴 **No cubierto por ADR-008, sigue abierto** | 10+ ocurrencias listadas en `REVISION_ARQUITECTURA.md` (líneas 448-454, 982, 1051-1064, 1191, 1206, 1235-1249). No hay ADR ni mención previa — es deuda nueva no documentada en el Core. |
| XSS vía `innerHTML` sin sanitizar (~30 sitios) | 🔴 **No cubierto por ADR-008, sigue abierto** | Idem, no aparece en ningún ADR previo. |
| SSRF en `/api/proxy-image` | 🔴 **No cubierto por ADR-008, sigue abierto** | Nuevo, no documentado en Core hasta ahora. |
| CORS abierto (`*`) | 🔴 **Sigue abierto** | No mencionado en ADR-008. |
| Gotcha "reel-generator.js:103 duplicate `generar()` → stack overflow" (`AGENTS.md:119`) | ❓ **No se pudo confirmar tal cual está documentado** | Se verificó `generators/reel-generator.js` y solo existe **un** método `generar(numero)` en línea 103; el resto de métodos tienen nombres distintos (`generarContenido`, `generarSugerenciaVisual`, etc.). O ya se corrigió y nadie actualizó el gotcha, o el gotcha describía algo distinto. Vale la pena que quien mantiene `AGENTS.md` lo confirme o lo retire — es otro síntoma de Core desactualizado. |

**Conclusión de esta sección**: no es que el módulo nunca se haya asegurado — ADR-008 fue un esfuerzo real y sus fixes de path-traversal y race-condition se sostienen. El problema es que **el proceso de "fix" generó su propia fuga** (el backup con credenciales) y que **la seguridad no se ha revisitado desde el 10 de julio**, mientras el módulo siguió creciendo (script.js pasó de ~2048 a 2605 líneas, local-server-node.js sumó endpoints de video/animación/slideshow que nunca pasaron por revisión de seguridad).

---

## 3. Deuda arquitectónica (más allá de lo que ya lista REVISION_ARQUITECTURA.md)

- **`._backup/` no es solo un riesgo de secretos — es una decisión de rollback mal cerrada.** ADR-008 la creó a propósito ("Rollback: ... To restore: cp ._backup/* ."). Nadie volvió a cerrar ese loop una vez validado el fix. Esto es un patrón de proceso, no solo un archivo suelto: si el equipo sigue usando `._backup/` como mecanismo de rollback informal para futuros cambios, va a seguir dejando credenciales viejas expuestas cada vez. Vale más definir un mecanismo de rollback vía git (tags/branches) que copiar archivos con secretos a una carpeta del propio repo.
- **Duplicación de skills**: `SuitCampanas/.agents/skills/google-sheets/SKILL.md` y `SuitCampanas/.claude/skills/google-sheets/SKILL.md` coexisten. Two sources of truth para el mismo skill — cualquier actualización futura corre el riesgo de aplicarse a una copia y no a la otra.
- **Tres implementaciones de servidor**: `local-server-node.js` (activo, 1495 líneas), `local-server.py` (Python, sin funciones indexadas — parece vestigial), `mock-server.js` (70 líneas). `REVISION_ARQUITECTURA.md` ya señala que `package.json` apunta el script `start` al mock en vez del servidor real — esto es más grave de lo que el esfuerzo estimado (2 min) sugiere: significa que **el comando estándar para levantar el proyecto (`npm start`) no levanta el servidor real**, lo cual es la causa más probable de que nadie note fácilmente cuándo el server real se cae o se desconfigura.
- **La migración a Supabase está más avanzada de lo que el Core documenta, pero la tabla `campanas` no sigue el estándar de aislamiento del resto del monorepo**: el DDL en `.agent/workflows/1migrar-supabase.md:41-52` no incluye columna `activo` (a diferencia de `industrias`, `nichos`, `config_empresas`, que sí la tienen). Esto contradice la regla inmutable de `ARCHITECTURE.md:326` ("No borrado físico — usar columna `activo`"). No se verificó en esta sesión si el código de `local-server-node.js` compensa esto en otra columna (`estado`), pero al menos el DDL documentado no lo garantiza.
- **IDs de campaña**: la tabla `campanas` usa `id text primary key` sin patrón visible de generación (a diferencia de `LEAD-XXX`/`ORD-XXX` que exige `ARCHITECTURE.md:327`). No se verificó en esta sesión cómo se genera ese `id` en `local-server-node.js:276` (POST `/api/campanas`) — queda como pregunta abierta, ver §5.

---

## 4. Lo que está bien hecho (y vale la pena preservar)

- Los tres fixes de ADR-008 que se pueden verificar hoy (path traversal, race condition de modelo, formato de error) siguen sosteniéndose — es una señal de que cuando el equipo prioriza seguridad, el fix es duradero.
- El patrón dual-write/dual-read (Supabase primero, GAS como fallback) es una decisión de resiliencia razonable y está documentado tanto en el ADR como en el plan de migración — no es deuda accidental, es diseño intencional.
- El fallback de modelos IA (hasta 4 modelos OpenRouter + LM Studio local) y el cache de prompts con TTL de 60s son soluciones pragmáticas correctas para un CMS que depende de servicios gratuitos inestables (ver también las "lecciones aprendidas" del ROADMAP sobre fallbacks de imágenes — mismo patrón replicado con criterio).
- El registro en `routing.yaml` (overrides por `trend`→research, `feature`→content-generation, `video`→video-generation) está bien definido y coincide con lo que el código realmente hace.

---

## 5. Preguntas abiertas (no verificadas en esta sesión — marcarlas como supuesto hasta confirmar)

- ¿El `id` de `campanas` se genera con algún patrón secuencial en `local-server-node.js` (no se leyó esa función específica)?
- ¿`._backup/` está en el historial de git (no solo en el working tree)? Si ya se hizo `git push` en algún momento con esos archivos, la remediación no es solo borrar/gitignorar — es **rotar las credenciales de Google Cloud expuestas** (`DRIVE_API_KEY`, `DRIVE_CLIENT_ID`, `DRIVE_APP_ID`) y limpiar el historial. Esto no se pudo confirmar en esta sesión.
- ¿Los 27 endpoints de Supabase realmente carecen de cualquier autenticación, o hay algún middleware no capturado por el audit de hoy? (`REVISION_ARQUITECTURA.md` lo afirma para 4 endpoints puntuales; vale la pena una verificación dirigida antes de invertir esfuerzo en arreglarlo.)

---

## 6. Recomendaciones priorizadas (refinadas sobre las de REVISION_ARQUITECTURA.md)

### Prioridad 0 — Antes que nada
| # | Acción | Esfuerzo | Por qué va primero |
|---|--------|----------|---------------------|
| 1 | Confirmar si `._backup/` (con credenciales reales) está en el historial de git remoto. Si sí: **rotar las credenciales de Google Cloud** además de limpiar el árbol de trabajo. | 30 min (verificación) + tiempo de rotación | Es la única vulnerabilidad de esta lista que podría ya estar filtrada fuera del control del equipo. Todo lo demás es local hasta que alguien lo explote; esto puede que no lo sea. |

### Prioridad 1 — Seguridad activa
| # | Acción | Esfuerzo |
|---|--------|----------|
| 2 | Reemplazar `service_role` por `anon key` + políticas RLS en `lib/supabase.js` (ya señalado 2 veces en Core, nunca ejecutado) | 2-4h |
| 3 | Reemplazar `execSync(cmd, {shell:true})` por `execFile`/`spawn` con argumentos separados (10+ sitios en `local-server-node.js`) | 1-2h |
| 4 | Sanitizar los ~30 sitios de `innerHTML` en `script.js` (usar `textContent` o `DOMPurify`) | 2-4h |
| 5 | Restringir `/api/proxy-image` a lista blanca de dominios | 30 min |
| 6 | Restaurar el requisito de token en endpoints Supabase (la regresión que dejó ADR-008) | 1h |
| 7 | Restringir CORS a orígenes conocidos | 15 min |

### Prioridad 2 — Cerrar el ciclo del proceso de fix
| # | Acción | Esfuerzo |
|---|--------|----------|
| 8 | Eliminar `._backup/` del working tree y `.gitignore`; documentar el mecanismo de rollback vía git en vez de copias locales | 15 min |
| 9 | Corregir `package.json` `start` para apuntar a `local-server-node.js`, no a `mock-server.js` | 5 min |
| 10 | Agregar columna `activo` a la tabla `campanas` (consistencia con el resto del schema y con la regla inmutable de borrado lógico) | 30 min |

### Prioridad 3 — Actualizar el Core (para que el mapa vuelva a coincidir con el territorio)
| # | Acción | Esfuerzo |
|---|--------|----------|
| 11 | Corregir `path: CampanasAi/` → `SuitCampanas/` en `.suit/registry/projects.yaml` y en las rutas de `AGENTS.md` | 15 min |
| 12 | Regenerar la sección de `SuitCampanas` en `INDEX_FUNCIONES.md`, o reemplazarla por un enlace al `CODE_INDEX.md` propio del módulo (ya más completo) | 20 min |
| 13 | Actualizar `ARCHITECTURE.md` §16: los 8 modos reales (agregar BDSMT, BDPV, ViRe, VIDE), conteos de líneas actuales, y el estado real de la migración a Supabase (ya no "en migración", sino "migrado con GAS como respaldo") | 30-45 min |
| 14 | Confirmar o retirar el gotcha de `reel-generator.js:103` en `AGENTS.md` (no se pudo reproducir tal como está descrito) | 10 min |

### Prioridad 4 — Mantenibilidad general
Ver `REVISION_ARQUITECTURA.md` §5 (Prioridad 2-4) — esas recomendaciones (fragmentar `script.js`/`local-server-node.js`, DAO para Supabase, lint/typecheck, tests) siguen vigentes y no se repiten aquí para no duplicar.

---

## 7. Resumen ejecutivo

SuitCampanas ya pasó por un ciclo de endurecimiento de seguridad real (ADR-008), y esos fixes puntuales se sostienen. El problema no es falta de atención — es que **esa atención fue puntual y no se repitió** mientras el módulo creció (de ~2048 a 2605 líneas), y que **el propio proceso de arreglo dejó un cabo suelto** (`._backup/` con credenciales reales, sin resolver). En paralelo, los tres documentos que deberían servir de mapa para cualquier agente que toque este módulo (`ARCHITECTURE.md`, `AGENTS.md`, `INDEX_FUNCIONES.md`, `.suit/registry/projects.yaml`) están desincronizados del código real en rutas, líneas y hasta en cuántos modos tiene el CMS — lo que garantiza que la próxima persona (humana o agente) que siga el orden de consulta oficial del repo empiece con información incorrecta. Antes de sumar features nuevas, lo de mayor apalancamiento es: (1) confirmar si hay una fuga de credenciales real en el historial de git, (2) cerrar las vulnerabilidades no cubiertas por ADR-008 (command injection, XSS, SSRF, CORS), y (3) sincronizar el Core con la realidad del módulo — es barato (menos de 2 horas en total) y evita que el siguiente diagnóstico tenga que rehacerse desde cero.
