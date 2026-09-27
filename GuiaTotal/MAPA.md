# MAPA.md — Árbol vivo de la Guía Total

> **Para qué sirve:** mapa visual de cómo se invoca cada cosa de esta guía, qué lee, qué crea/actualiza, qué skills llama y qué corre en paralelo. **Se actualiza en cada pasada de `guia-total`** — no se reescribe desde cero.
> **Leyenda:** `📁 lee archivo` · `⚡ llama skill` · `✍️ crea archivo` · `🔄 actualiza archivo` · `❓ pregunta` · `∥ paralelo`
> **Regenerar/actualizar:** cualquier pasada de `/guia-total`; si el flujo ejecutado difiere de este mapa, corrige solo ese nodo.

---

## ═══ CIERRE DE TODA PASADA (nodo común — aplica a cualquier sección) ═══

```text
└── ⚡ guia-total  [al terminar CUALQUIER pasada]
    ├── ✍️ GuiaTotal/PENDIENTES.md   [todo lo que quedó abierto; filas nunca se borran → se tachan con fecha]
    ├── 🔄 GuiaTotal/MAPA.md         [solo si el flujo ejecutó DIFIERE del mapa (gatillo/skill/ramal nuevo)
    │                                 → corrige solo ese nodo; jamás reescribe el mapa completo]
    └── 📋 ≤3 líneas de cierre: qué se hizo · dónde quedó · próximo paso
```

---

## ═══ 1. IDEA / VALIDACIÓN ═══

**Triggers:** "proyecto nuevo", "tengo una idea", "¿vale la pena?", "investiga este nicho", "evaluar proyecto", "validar idea", `/guia-total [ruta]`

```text
└── ⚡ guia-total [ruta]
    ├── 📄 lee GuiaTotal/GUIA.md
    ├── ❓ "¿convive con Google Sheets / Config_Empresas?"
    │   ├── sí → 📁 lee Config_Empresas (Brief logo_url, db_engine, flags usa_*/modo)
    │   └── no → (ramal Sheets omitido por completo)
    ├── ⚡ analista-proy                    [si Analista_Proy.md no existe]
    │   └── ∥ 4 pilares de búsquedas web en paralelo → ✍️ Analista_Proy.md
    ├── ✍️ crea <Proyecto>/docs/TAXONOMIA.md  (3 campos: Industria · Nicho · Especialización — match al catálogo)
    ├── ⚡ panel-juzgador                   [tras analista-proy; recomendación, no bloquea]
    │   ├── ∥ agentes: mercado ∥ técnico ∥ riesgo ∥ financiero
    │   └── → ⚡ juez (serial) → ✍️ veredicto + condiciones
    ├── ✍️ crea GuiaTotal/registro/<proyecto>.yaml  (si falta)
    └── ↪ CIERRE DE TODA PASADA (sección superior: PENDIENTES + MAPA + 3 líneas)
```

## ═══ 2. TAXONOMÍA ═══

**Triggers:** "taxonomía", "industrias y nichos", "actualiza taxonomía", `/guia-total taxonomia`

```text
└── ⚡ guia-total taxonomia
    ├── ∥ 📁 lee Supabase: industrias (22) ∥ nichos (85)
    ├── ✍️ crea/actualiza GuiaTotal/TAXONOMIA.md
    └── si falta un dato → 📁 INSERT en Supabase + ✍️ anota "insertado: fecha" en TAXONOMIA.md
```

## ═══ 3. IDENTIDAD CORPORATIVA ═══

**Triggers:** "misión y visión", "valores e impacto", "políticas de la empresa", "identidad corporativa", "página nosotros", `/guia-total identidad [ruta]`
**Requiere:** `Analista_Proy.md` (si no, corre antes el flujo IDEA)

```text
└── ⚡ guia-total identidad [ruta]
    ├── 📄 lee GuiaTotal/prompts/IDENTIDAD_CORPORATIVA.md  (motor: 8 secciones, no inventar, [PENDIENTE DE VALIDAR])
    ├── 📄 lee Analista_Proy.md + registro/<proyecto>.yaml
    ├── si convive_sheets: ∥ 📁 lee Config_Empresas (tono, industria)
    │   └── ⚡ brief-engine → 📁 catálogos Supabase   [solo si hay id_empresa; solo lectura]
    └── ✍️ crea/actualiza <Proyecto>/docs/IDENTIDAD_CORPORATIVA.md
```

## ═══ 4. CONSTRUCCIÓN ═══

**Triggers:** "arranca la construcción", "crea el contrato", "empezar a programar"

```text
└── ⚡ guia-total [ruta]
    ├── ⚡ ciclo (F0) → ✍️ CONTRATO.md   [si falta; usa Analista_Proy.md como insumo]
    ├── ⚡ ciclo (F1→F7) — serial: code → validación → commit por fase
    ├── 🔄 node scripts/generate-index.js → 🔄 INDEX_FUNCIONES.md  [si cambian funciones]
    └── ∥ paralelo (independientes, si faltan):
        ├── ✍️ <Proyecto>/docs/CHECKLIST-LANZAMIENTO.md
        ├── ✍️ <Proyecto>/docs/MANUAL_*.md  (los 4)
        ├── ✍️ <Proyecto>/docs/PROMPT_ORIGEN.md  (desde plantilla)
        └── ⚡ auditoria  [si se pide docs de arquitectura → ✍️ <Proyecto>/docs/05-*, 06-*… según umbrales 25%/84%]
```

## ═══ 5. MANUALES ═══

**Triggers:** "crea los manuales", "manual del cliente", "manual del proveedor", "manual técnico", "manual de pruebas", "actualiza manuales", `/guia-total manuales [ruta]`

```text
└── ⚡ guia-total manuales [ruta]
    ├── 📁 lee <Proyecto>/ (código, README) + docs/ (CONTRATO.md, manuales)
    ├── 📄 lee GuiaTotal/templates/MANUAL_*.md
    ├── ∥ creación de los 4 en paralelo (independientes):
    │   ├── ✍️ MANUAL_CLIENTE.md    frontend — quien solicita el servicio
    │   ├── ✍️ MANUAL_PROVEEDOR.md  frontend — quien presta el servicio
    │   ├── ✍️ MANUAL_TECNICO.md    backend — mantenimiento y configuración
    │   └── ✍️ MANUAL_PRUEBAS.md    modo test/dev — E2E sin dependencias reales
    └── actualización: serial — compara "Última actualización" vs git log de archivos UI/backend
                        → solo reescribe los manuales desactualizados
```

## ═══ 6. MANTENIMIENTO ═══

**Triggers:** "mejoras", "mantenimiento", "arregla", "refactorizar", "optimizar", "limpiar código" (→ ciclo directo, ya mapeado en routing.yaml)

```text
└── ⚡ ciclo (F1-F7)
    ├── 🔄 CONTRATO.md / VALIDACION.md / CORRECCIONES.md
    └── si hay MANUAL_*.md + cambios UI/backend → ⚡ guia-total manuales  [refresco sugerido]
```

## ═══ 7. PROMPT ORIGEN ═══

**Triggers:** "actualiza el prompt origen", "prompt origen", `/guia-total origen [ruta]`

```text
└── ⚡ guia-total origen [ruta]
    ├── 📄 lee <Proyecto>/docs/PROMPT_ORIGEN.md  [si falta → ✍️ crea desde plantilla con cabecera]
    ├── 📄 lee GuiaTotal/prompts/PROMPT_ORIGEN.md + GUIA.md + registro/<proyecto>.yaml
    └── 🔄 actualiza <Proyecto>/docs/PROMPT_ORIGEN.md   [la plantilla solo cambia con la metodología]
```

## ═══ 8. ÍNDICE DE FUNCIONES ═══

**Triggers:** "refresca el índice", "indexa funciones"

```text
└── ⚡ node scripts/generate-index.js → 🔄 INDEX_FUNCIONES.md
```

## ═══ 9. AUDITORÍA DE ARQUITECTURA ═══

**Skill:** `auditoria` (`.agents/skills/auditoria/SKILL.md` · routing priority 26)
**Triggers:** "auditoría", "auditoria", "audita arquitectura", "audita el sistema", "documenta el sistema", "diagrama c4", "crea el c4", "inventario del sistema", "brechas de arquitectura", "qué le falta al proyecto"

**Dónde entra (3 puertas):**
1. **Directa** — el usuario la invoca (cualquier momento, cualquier proyecto existente).
2. **Desde `guia-total`** — en etapa CONSTRUCCIÓN (nodo 4) para generar docs faltantes al nacer el proyecto.
3. **Desde el usuario vía guía** — cuando pide "qué le falta al proyecto" sin pasar por la guía.

```text
└── ⚡ auditoria [ruta]
    ├── 📄 lee guion: .agents/skills/auditoria/SKILL.md
    ├── Fase 0:   ✍️ Encargo (objetivo, alcance, riesgos) — reporte, no archivos
    ├── Fase 0.5: 📁 relee docs/ existentes, ADRs (.suit/memory/decisions), tarjeta,
    │             INDEX_FUNCIONES, git log   [no arranca de cero]
    ├── Fase 1:   📁 inspecciona código/config/esquema/CI → tabla de hallazgos con evidencia
    ├── Umbrales de escritura:
    │   ├── < 25%  → solo reporte (sin tocar archivos)
    │   ├── ≥ 25%  → ✍️ crea <Proyecto>/docs/05-*,06-*,08-*,09-*,10-*… faltantes (PROBABLE)
    │   └── ≥ 84%  → 🔄 completa/actualiza docs existentes a VERIFICADO (sin preguntar)
    ├── 🔄 migra docs dispersos del proyecto → <Proyecto>/docs/  (git mv, sin referencias rotas)
    ├── ADR nuevo → ⚡ /suit-memory → ✍️ .suit/memory/decisions/ADR-NNN-*.md
    └── Entrega reporte de 8 secciones (Estado actual → Certeza) — N archivos vacíos, jamás
```

**Salida esperada por documento:** `Para qué sirve` en cabecera · evidencia `VERIFICADO/PROBABLE/DESCONOCIDO` con `file:line` o ruta · sin secretos.

**Ejemplo real (piloto):** `SuitServiHogar` — 2026-09-26:
`docs/05` (arquitectura, drift SQL detectado), `docs/06` (C1+C2 Mermaid), `docs/08` (modelo de datos con conteos vivos), `docs/10` (seguridad, 4 amenazas) · actualizó `05/06` tras evidencia nueva · migró `veredicto+eval_*` a `docs/` · borró ruido · creó `docs/TAXONOMIA.md` (3 campos) · quedó ~90% con 3 preguntas pendientes (drift, limpieza, migración) = **ejemplo de cómo la auditoría deja brechas listas para decidir**.

## ═══ 10. SKILLS EXTERNAS (por instalar / enlazar) ═══

```text
(guion vacío — añadir aquí cada skill externa con: trigger → acciones → qué lee/escribe)
```

---

## Mapa de dependencias entre skills

| Skill | Llama a | Alimenta a | Paralelo interno |
|---|---|---|---|
| `guia-total` | `analista-proy`, `panel-juzgador`, `ciclo`, `brief-engine` | registro, MAPA, manuales, identidad, origen | ver nodos `∥` |
| `analista-proy` | — | `panel-juzgador`, `CONTRATO` (F0), tarjeta | 4 pilares ∥ |
| `panel-juzgador` | — | tarjeta (veredicto) | 4 agentes ∥ → juez serial |
| `ciclo` | — | `CONTRATO`, `VALIDACION`, `CORRECCIONES` | fases seriales F0→F7 |
| `brief-engine` | catálogos Supabase | Brief en `logo_url` | sub-agentes A-D ∥ |
| `auditoria` | `/suit-memory` (ADRs) | `<Proyecto>/docs/00-16` + tarjeta | reuso Fase 0.5 antes de inspeccionar |

**Orden obligatorio:** `analista-proy` → `panel-juzgador` (este consume el primero). `auditoria` es independiente: la llama `guia-total` o el usuario. El resto es independiente.

---

*Última actualización del mapa: 2026-09-26 (cierre común PENDIENTES+MAPA al inicio; nodo auditoría; taxonomía por proyecto; instancias en `docs/`).*
