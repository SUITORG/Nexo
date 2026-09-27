---
name: guia-total
description: "Guía total de proyecto: orquesta el ciclo de vida completo de un proyecto de software — validación de idea (analista-proy + panel-juzgador), taxonomía de mercado, identidad corporativa, construcción (ciclo), manuales del proyecto y prompt origen vivo. Úsala SIEMPRE que el usuario diga 'guia total', 'guia-total', 'proyecto nuevo', 'tengo una idea', '¿vale la pena este proyecto?', 'validar idea', 'crea los manuales', 'manual del cliente', 'manual del proveedor', 'manual técnico', 'manual de pruebas', 'identidad corporativa', 'misión y visión', 'valores e impacto', 'políticas de la empresa', 'taxonomía', 'industrias y nichos', 'prompt origen', o pida llevar un proyecto por su etapa (idea → construcción → mantenimiento)."
license: MIT
compatibility: "Claude Code y opencode. Requiere git. Opcional: MCP de Supabase (taxonomía/brief) y acceso a Google Sheets/GAS (Config_Empresas)."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Guia-total — orquestador del ciclo de vida del proyecto

Guía operativa viva. La referencia de método está en `GuiaTotal/GUIA.md`; el mapa visual de flujos en `GuiaTotal/MAPA.md`. Esta skill **ejecuta** lo que esos documentos describen y los mantiene actualizados.

## Entradas

1. **Manual**: `/guia-total [ruta] [objetivo]` o uno de los modos: `taxonomia`, `identidad`, `manuales`, `origen`.
2. **Automática**: el usuario menciona un gatillo de la descripción (idea nueva, manuales, identidad, etapa de proyecto).

Si no hay cambios reales y no se pide un modo suelto, informa "sin acciones" y termina. No inventes trabajo.

## Paso 0 — Alcance

- Alcance = ruta indicada o carpeta actual; sube por padres hasta la raíz buscando contrato (`CONTRATO.md`, `PRM.md`) igual que `ciclo` (ver `.agents/skills/ciclo/references/alcance.md`).
- Declara: `Alcance: <ruta> · GuiaTotal: GuiaTotal/ · Instancia: <Proyecto>/`.
- **Documentos de método** (uno solo, en `GuiaTotal/`): `GUIA.md`, `MAPA.md`, `TAXONOMIA.md`, `templates/`, `prompts/` (plantillas maestras), `registro/schema.md`.
- **Instancias por proyecto** (en la carpeta del proyecto): `MANUAL_*.md`, `IDENTIDAD_CORPORATIVA.md`, `PROMPT_ORIGEN.md`, y su tarjeta `GuiaTotal/registro/<proyecto>.yaml`. Un proyecto nuevo recibe sus propias instancias; nunca copies la carpeta `GuiaTotal/` a un proyecto.

## Pregunta obligatoria en etapa IDEA

Antes de avanzar, pregunta una sola vez: **"¿Este proyecto va a convivir con Google Sheets / Config_Empresas?"**

- **Sí** → lee la fila del proyecto en `Config_Empresas` (artefactos: Brief en `logo_url` 21 segmentos, activos LAPVTFU, `db_engine`, flags `usa_*`/`modo`). Agenda `brief-engine` cuando toque construir.
- **No** → omite todo el ramal Sheets/Brief/Supabase de esta guía. No vuelvas a preguntar.

## Etapas

Determina la etapa leyendo los artefactos del alcance (no la adivines):

| Etapa | Señal | Acción |
|---|---|---|
| **Idea** | no hay código o hay solo un README/borrador | Ejecuta el flujo IDEA abajo |
| **Construcción** | hay código y falta `CONTRATO.md` o validación | F0-F7 vía `ciclo` + documentos faltantes |
| **Mantenimiento** | hay `CONTRATO.md` + `VALIDACION.md` recientes | Solo `ciclo` (F1-F7) + refresco de manuales si aplica |

### Flujo IDEA

1. `⚡ analista-proy` → `Analista_Proy.md` (si no existe; si existe y es reciente, reúsalo).
2. `⚡ panel-juzgador` → veredicto + recomendaciones (insumo: propuesta + `Analista_Proy.md`). **El veredicto no bloquea**: guárdalo en la tarjeta como recomendación.
3. `✍️ crea GuiaTotal/registro/<proyecto>.yaml` si falta (schema en `registro/schema.md`): etapa, veredicto, `convive_sheets`, próximo paso.
4. Sugiere `identidad` y luego construcción. No construyas sin que el usuario lo pida.

### Flujo CONSTRUCCIÓN

1. `⚡ ciclo` F0 → `CONTRATO.md` (usa `Analista_Proy.md` como insumo, igual que hace `ciclo`).
2. `⚡ ciclo` F1-F7 con commits por fase.
3. Si cambian funciones: `node scripts/generate-index.js` → `INDEX_FUNCIONES.md`.
4. En paralelo (independientes entre sí): crea `CHECKLIST-LANZAMIENTO.md`, los 4 `MANUAL_*.md` y `<Proyecto>/PROMPT_ORIGEN.md` si faltan.
5. `🔄 actualiza GuiaTotal/registro/<proyecto>.yaml` (etapa → construcción).

### Flujo MANTENIMIENTO

1. `⚡ ciclo` F1-F7 (no dupliques sus fases aquí).
2. Si el alcance tiene `MANUAL_*.md` y los cambios tocaron UI/backend: verifica fechas (manual vs último commit relevante) → si desactualizados, ejecuta el modo `manuales` o sugiere `/guia-total manuales`.

## Modos

### `guia-total taxonomia`

- `📁 lee` Supabase `industrias` + `nichos` (catálogos, MCP Supabase del proyecto backend).
- `✍️ crea/actualiza GuiaTotal/TAXONOMIA.md`: jerarquía industria → nicho → especializaciones, conteos, fecha de lectura.
- Si un dato necesario por el proyecto **no existe** en los catálogos: insértalo (adición, no destructivo) y anótalo en `TAXONOMIA.md` como `insertado: <fecha>`. No borres ni edites filas existentes.

### `guia-total identidad [ruta]`

Requiere `Analista_Proy.md` (si no existe, ejecuta antes el flujo IDEA o avisa).

1. `📁 lee GuiaTotal/prompts/IDENTIDAD_CORPORATIVA.md` — es el motor: respeta sus reglas (no inventar certificaciones/cifras/políticas, marcadores `[PENDIENTE DE VALIDAR]`, ≤1000 palabras, estructura de 8 secciones).
2. Rellena sus `[CAMPOS]` con: tarjeta del proyecto, `Analista_Proy.md`, `Config_Empresas` si `convive_sheets=sí`, o lo que el usuario aporte.
3. Si `convive_sheets` y hay `id_empresa`: `⚡ brief-engine` solo para taxonomía/tono (no escribas el Brief).
4. `✍️ crea/actualiza <Proyecto>/IDENTIDAD_CORPORATIVA.md` (Misión, Visión, Valores, Impacto, Compromisos/Políticas).
5. Sección final obligatoria `## Datos pendientes de validar` (del prompt original).

### `guia-total manuales [ruta]`

- `📁 lee` código del proyecto, `CONTRATO.md`, `README*`.
- `📄 lee GuiaTotal/templates/MANUAL_*.md`.
- `✍️ crea` en la carpeta del proyecto los 4, si faltan (independientes → créalos en orden, sin esperas entre ellos):
  - `MANUAL_CLIENTE.md` — frontend, quien solicita el servicio.
  - `MANUAL_PROVEEDOR.md` — frontend, quien presta el servicio.
  - `MANUAL_TECNICO.md` — backend, mantenimiento y configuración.
  - `MANUAL_PRUEBAS.md` — modo test/dev, E2E sin dependencias reales.
- Cada manual lleva en cabecera `Para qué sirve este manual` y `Audiencia` (obligatorio).
- **Actualización**: si ya existen, compara `Última actualización` del manual contra `git log -1 --format=%cd -- <archivos relevantes>`; solo reescribe los manuales cuyo contenido quedó viejo. No regeneres los al día.

### `guia-total origen [ruta]`

- Instancia: `<Proyecto>/PROMPT_ORIGEN.md`. Si no existe, créala desde `GuiaTotal/prompts/PROMPT_ORIGEN.md` con cabecera `Generado desde: GuiaTotal/prompts/PROMPT_ORIGEN.md · <fecha>`.
- `guia-total origen` rellena/actualiza la **instancia del proyecto** con: GUIA.md + tarjeta + hechos nuevos del proyecto (qué es, para quién, decisiones, etapa).
- La **plantilla maestra** solo se modifica cuando cambia la metodología, no cuando cambia un proyecto.

## Archivos vivos

| Archivo | Ubicación | Quién lo escribe |
|---|---|---|
| `GUIA.md` | `GuiaTotal/` | solo método nuevo (usuario) |
| `MAPA.md` | `GuiaTotal/` | **esta skill, en cada pasada** |
| `TAXONOMIA.md` | `GuiaTotal/` | modo `taxonomia` |
| `templates/*` | `GuiaTotal/` | solo método nuevo |
| `registro/schema.md` + `registro/<proyecto>.yaml` | `GuiaTotal/` | esta skill |
| `MANUAL_*.md` | `<Proyecto>/` | modo `manuales` / construcción |
| `IDENTIDAD_CORPORATIVA.md` | `<Proyecto>/` | modo `identidad` |
| `PROMPT_ORIGEN.md` | `<Proyecto>/` | modo `origen` |

**Actualización del MAPA**: al terminar cada pasada, revisa si el flujo ejecutado difiere de `MAPA.md` (gatillos nuevos, skills nuevas, ramal añadido) → actualiza solo ese nodo. Nunca reescribas el MAPA completo desde cero.

## Skills externas

Si el usuario pide instalar/enlazar una skill no propia, añade su nodo a `MAPA.md` bajo `SKILLS EXTERNAS` con su trigger y acciones, en vez de integrarla a ciegas.

## Reglas

- Los manuales, identidad y prompt origen viven **en la carpeta del proyecto**; `GuiaTotal/` solo guarda método y plantillas.
- `id_empresa` en toda lectura/escritura multiempresa; `activo` se normaliza con `.toUpperCase().trim() === "TRUE"`.
- Escrituras a Supabase del catálogo de taxonomía: solo INSERT de faltantes, nunca UPDATE/DELETE.
- El veredicto de `panel-juzgador` recomienda, no decide: el usuario aprueba continuar.
- Si un paso requiere otra skill que no está instalada, dilo y sugiere cómo instalarla; no improvises su contenido.
- Al cierre de cada pasada: ≤3 líneas (qué se hizo, dónde quedó, próximo paso).
