# MAPA.md — Árbol vivo de la Guía Total

> **Para qué sirve:** mapa visual de cómo se invoca cada cosa de esta guía, qué lee, qué crea/actualiza, qué skills llama y qué corre en paralelo. **Se actualiza en cada pasada de `guia-total`** — no se reescribe desde cero.
> **Leyenda:** `📁 lee archivo` · `⚡ llama skill` · `✍️ crea archivo` · `🔄 actualiza archivo` · `❓ pregunta` · `∥ paralelo`
> **Regenerar/actualizar:** cualquier pasada de `/guia-total`; si el flujo ejecutado difiere de este mapa, corrige solo ese nodo.

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
    ├── ⚡ panel-juzgador                   [tras analista-proy; recomendación, no bloquea]
    │   ├── ∥ agentes: mercado ∥ técnico ∥ riesgo ∥ financiero
    │   └── → ⚡ juez (serial) → ✍️ veredicto + condiciones
    ├── ✍️ crea GuiaTotal/registro/<proyecto>.yaml  (si falta)
    └── 🔄 actualiza GuiaTotal/MAPA.md
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
    └── ✍️ crea/actualiza <Proyecto>/IDENTIDAD_CORPORATIVA.md
```

## ═══ 4. CONSTRUCCIÓN ═══

**Triggers:** "arranca la construcción", "crea el contrato", "empezar a programar"

```text
└── ⚡ guia-total [ruta]
    ├── ⚡ ciclo (F0) → ✍️ CONTRATO.md   [si falta; usa Analista_Proy.md como insumo]
    ├── ⚡ ciclo (F1→F7) — serial: code → validación → commit por fase
    ├── 🔄 node scripts/generate-index.js → 🔄 INDEX_FUNCIONES.md  [si cambian funciones]
    └── ∥ paralelo (independientes, si faltan):
        ├── ✍️ <Proyecto>/CHECKLIST-LANZAMIENTO.md
        ├── ✍️ <Proyecto>/MANUAL_*.md  (los 4)
        └── ✍️ <Proyecto>/PROMPT_ORIGEN.md  (desde plantilla)
```

## ═══ 5. MANUALES ═══

**Triggers:** "crea los manuales", "manual del cliente", "manual del proveedor", "manual técnico", "manual de pruebas", "actualiza manuales", `/guia-total manuales [ruta]`

```text
└── ⚡ guia-total manuales [ruta]
    ├── 📁 lee <Proyecto>/ (código, CONTRATO.md, README)
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
    ├── 📄 lee <Proyecto>/PROMPT_ORIGEN.md  [si falta → ✍️ crea desde plantilla con cabecera]
    ├── 📄 lee GuiaTotal/prompts/PROMPT_ORIGEN.md + GUIA.md + registro/<proyecto>.yaml
    └── 🔄 actualiza <Proyecto>/PROMPT_ORIGEN.md   [la plantilla solo cambia con la metodología]
```

## ═══ 8. ÍNDICE DE FUNCIONES ═══

**Triggers:** "refresca el índice", "indexa funciones"

```text
└── ⚡ node scripts/generate-index.js → 🔄 INDEX_FUNCIONES.md
```

## ═══ 9. SKILLS EXTERNAS (por instalar / enlazar) ═══

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

**Orden obligatorio:** `analista-proy` → `panel-juzgador` (este consume el primero). El resto es independiente.

---

*Última actualización del mapa: 2026-09-26 (creación).*
