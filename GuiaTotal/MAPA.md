# MAPA.md — Árbol vivo de la Guía Total

> **Para qué sirve:** mapa visual de cómo se invoca cada cosa de esta guía, qué lee, qué crea/actualiza, qué skills llama y qué corre en paralelo. **Se actualiza en cada pasada de `guia-total`** — no se reescribe desde cero.
> **Leyenda:** `📁 lee archivo` · `⚡ llama skill` · `✍️ crea archivo` · `🔄 actualiza archivo` · `❓ pregunta` · `∥ paralelo`
> **Regenerar/actualizar:** cualquier pasada de `/guia-total`; si el flujo ejecutado difiere de este mapa, corrige solo ese nodo.
> **Versión visual:** [`MAPA_VISUAL.html`](MAPA_VISUAL.html) — **diagrama de flujo HTML autocontenido**: burbujas con iconos y colores, globos (gates), líneas sólidas/curvas/punteadas animadas, chips §X. Abrir en navegador · validar sync con `node scripts/check-map-visual.js`.

---

## ═══ CIERRE DE TODA PASADA (nodo común — aplica a cualquier sección) ═══

```text
└── ⚡ guia-total  [al terminar CUALQUIER pasada]
    ├── ✍️ GuiaTotal/PENDIENTES.md   [todo lo que quedó abierto; filas nunca se borran → se tachan con fecha]
    ├── 🔄 GuiaTotal/MAPA.md         [solo si el flujo ejecutó DIFIERE del mapa (gatillo/skill/ramal nuevo)
    │                                 → corrige solo ese nodo; jamás reescribe el mapa completo]
    ├── 📊 GuiaTotal/MAPA_VISUAL.html  [si cambió la sección §X → actualiza su burbuja (chip §X / data-sec)
    │                                    → corre node scripts/check-map-visual.js — debe dar OK]
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

## ═══ 1.5. ALTA DE EMPRESA (empresa-registro) ═══

**Skill canónica** · **Inicio de la cadena**: → `clusters-seo` → `paginas-seo`
**Triggers:** "empresa-registro", "alta de empresa", "modifica empresa", "actualiza empresa", "edita empresa", "registro id_empresa", "crea estructura drive", "llena config empresas", "registro semiautomatico", "nueva empresa en sheets", "onboardear empresa"

```text
└── ⚡ empresa-registro <ID>
    ├── 📁 GAS getAll → fila en Config_Empresas (si no existe → pedir alta, no inventar)
    ├── 📄 lee GuiaTotal/TAXONOMIA.md → clasifica giro (∥ ⚡ analista-proy si pide análisis)
    ├── ⚡ GAS ensureCteFolders → ✍️ Drive cte<id>/ (ídem, reutiliza si existe)
    ├── 📁 foto libre del giro → ⚡ GAS generateAsset fotoagente
    │   → ✍️ cte<id>/fotoagente.jpg en RAÍZ + share ANYONE
    ├── ⚡ landing-page-copywriter → slogan (sobreescribe) + mensaje1 + mensaje2
    ├── ⚡ guia-total identidad → ✍️ GuiaTotal/registro/<id>/IDENTIDAD_CORPORATIVA.md
    ├── ✍️ GAS updateRow → campos en Sheets (10 columnas)
    ├── ⚡ GAS syncToSupabase → espejo (fallback MCP si SUPABASE_KEY ausente → PENDIENTES)
    ├── ✍️ tarjeta GuiaTotal/registro/<id>.yaml
    ├── ⛓️ CADENA (tras alta confirmada): ⚡ clusters-seo <ID>  [vista previa → tu aprobación]
    │                                     → ⚡ paginas-seo <ID>  [mapa → tu aprobación]
    └── ↪ CIERRE DE TODA PASADA

[ MODO MODIFICACIÓN: datos clave (giro/servicios/cobertura) → updateRow + sync →
  ofrece regenerar ⚡ clusters-seo (→ paginas-seo) · datos no clave (tel/color/correo) →
  updateRow + sync → refresca wa/hex/mail en Config_SEO vía updateRow×id_cluster ]
[ Fase 2 opcional: brief-engine + lapvtfu — solo con instrucciones del usuario ]
```

## ═══ 1.6. CLÚSTERES SEO (clusters-seo) ═══

**Skill canónica** · **Depende de** `empresa-registro` (dispara tras ALTA o modificación de datos clave)
**Triggers:** "clústeres seo", "clusters seo", "genera clústeres", "9 clústeres", "seo geo", "aeo", "páginas temáticas seo"

```text
└── ⚡ clusters-seo <ID>
    ├── F1 📁 lee Config_Empresas[<ID>] ∥ Config_SEO existentes (dedupe por INTENCIÓN,
    │        legacy SEO-001/C1 intocado) ∥ Config_Paginas.id_cluster (54 ligas)
    ├── F2 ✍️ propuesta ≤9 clústeres → vista previa Markdown
    │        (intenciones: principal, segmento×2, problema, complementaria,
    │         comparación, post-venta, geo×2 — fusiona duplicados)
    ├── F3 ❓ preguntas solo si <95% certeza
    └── F4 [SOLO con aprobación]
        ├── 📁 foto libre → ⚡ GAS subirImagenCte → ✍️ cte<id>/imagenurl-{id_cluster}.jpg
        │        (share ANYONE; si falla → PENDIENTE_IMAGEN)
        ├── ✍️ GAS appendRows → Config_SEO (10 columnas, Sheets maestro)
        ├── ⚡ GAS syncToSupabase → espejo  [PK (id_empresa,id_cluster) = upsert idempotente]
        ├── 📋 checklist 10 puntos
        ├── ⛓️ CADENA: tras escritura confirmada → ofrécele ⚡ paginas-seo <ID>
        └── ↪ CIERRE DE TODA PASADA

[modificación no clave de empresa → refresca wa/hex/mail en filas existentes vía updateRow×id_cluster]
[solo EvaSol indexa — demos se generan igual con noindex (plan-seo)]
```

## ═══ 1.7. PÁGINAS SEO (paginas-seo) ═══

**Skill canónica** · **Cadena**: `empresa-registro` → `clusters-seo` → **`paginas-seo`** (o por separado)
**Triggers:** "páginas seo", "genera las páginas", "config paginas", "contenido de páginas", "páginas del clúster", "alimenta las páginas"

```text
└── ⚡ paginas-seo <ID>
    ├── F1 📁 Config_Empresas ∥ Config_SEO (clústeres=hub) ∥ Config_Paginas existentes
    │        reporta basura sin tocarla (huérfanas, dups, JSON roto, bloques[] legacy)
    ├── F2 ✍️ mapa editorial por clúster → ❓ gate 1 (aprobación humana)
    ├── F3 ✍️ redacción por página →3 campos JSON (patrón real):
    │        meta_json {title, description, keywords[ARRAY]} ·
    │        schema_json Service (columna + anidado en contenido_json) ·
    │        contenido_json PLANO {titulo, subtitulo, p_intro, texto,
    │        preguntas_frecuentes[], imagen_url heredado del clúster}
    │        ruta = #{id_pagina} (hash) · 300-500 palabras · copy conservador
    ├── F4 ✍️ validación (3 JSON parsean, dups, claims) → ❓ gate 2 (aprobación final)
    └── F5 [aprobado]
        ├── ✍️ GAS appendRows → Config_Paginas (6 columnas, GS maestro)
        ├── ⚡ syncToSupabase → espejo  [actualizaciones: solo modo "actualiza"]
        └── ↪ CIERRE DE TODA PASADA
```

**Ejemplo real (piloto):** `HMP` — 2026-09-28:5 clústeres +5 fotos Drive +5 páginas (validación F4 = 5/0/0,310-325 palabras, FAQ×4) · PKs creados en `Config_SEO` y `Config_Paginas` = sync idempotente · ruta preview `index.html?co=HMP#que-hacemos`.

## ═══ 1.8. MÁSCARA EMPRESA (empresa-mascara) ═══

**Skill canónica** · **Entrada de la cadena**: rellena SOLO los campos obligatorios de `Config_Empresas` (sin editar GS a mano) y desde ahí ordena la cadena por switches
**Triggers:** "máscara", "mascara empresa", "llenar máscara", "form empresa", "nueva máscara", "máscara auto total"

```text
└── ⚡ empresa-mascara <ID>
    ├── 🌐 UI local: mascara.html → http://localhost:3001/mascara.html (server estático)
    │        form A+B(lectura)+C(switches)+D · Guardar=updateRow · Sync=espejo ·
    │        "Copiar orden" → pega la orden en el chat (incluye tus switches)
    ├── F0 📄 GuiaTotal/plantillas/MASCARA_CONFIG_EMPRESAS.yaml
    │        → crea/lee GuiaTotal/registro/<id>/MASCARA.yaml
    │        bloques: A obligatorios · B generados · C switches · D toggles
    ├── [1/N] ✅ valida A + C — faltantes de A → pregunta (≤3, nunca inventar)
    │        "auto total <ID>" → todos los switches a auto
    ├── [2/N] ✍️ escribe Config_Empresas (SOLO A + D) → updateRow | appendRows (alta)
    ├── [3/N] ⚡ syncToSupabase → 📁 verifica espejo
    ├── [4..N] ▶ CADENA por switches (cada eslabón con su barra de avance):
    │        empresa_registro → ⚡ empresa-registro (drive+foto+copy+identidad)
    │        clusters → ⚡ clusters-seo · paginas → ⚡ paginas-seo
    │        brief → ⚡ brief-engine · activos → ⚡ lapvtfu
    │        auto = sin preguntar · preguntar (default) = preview + [s/n] · skip = no toca
    └── ✔ 100% ▓▓▓▓ → ✍️ tarjeta → ↪ CIERRE DE TODA PASADA

[switches solo en YAML — sin columnas nuevas · nunca DELETE ·
 alta=skip + fila ausente → solo avisar · barra: [▓▓░░] 30% · paso 2/7 — texto]
```

**Ejemplo vivo:** `GuiaTotal/registro/hmp/MASCARA.yaml` — bloques A/B/D con datos reales; C: `clusters`/`paginas` = skip (hechos), `brief`/`activos` = preguntar (pendientes).

## ═══ 1.9. MANUAL DE OPERACIÓN (suitorg-operacion) ═══

**Triggers:** "manual de operación", "manual operacion suitorg", "cómo configuro empresas", "como se configuran las empresas", "operar empresas"
**Archivo:** `GuiaTotal/MANUAL_OPERACION.md` (solo Config_Empresas — sin subproyectos)

```text
└── 📖 lee/actualiza GuiaTotal/MANUAL_OPERACION.md
    ├── 10 secciones: datos (maestro/espejo) · ciclo de vida · 3 formas de editar ·
    │   campos 57 por bloques (tipo_negocio = "giro,flag" → parte1 = taxonomía) ·
    │   Taxonomía y Brief · cadena con switches · modificación clave/no clave ·
    │   accesos RBAC · problemas conocidos · checklist alta
    ├── ⚖️ regla clave (§5 del manual): brief → segmentos 1 `industria` y 2 `nicho`
    │   con VALOR REAL → jamás se borran · vacíos/[PENDIENTE] → rellena con taxonomía
    │   detectada (Analista/docs-TAXONOMIA → fallback tipo_negocio.split(',')[0] al catálogo)
    └── 🔄 refresco: con cada pasada de guia-total/ciclo que toque configuración (§6)
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
**Nota:** el **manual de operación de SuitOrg** (solo Config_Empresas) no es de proyecto — vive en §1.9 → `GuiaTotal/MANUAL_OPERACION.md`.

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

**Triggers:** "mejoras", "mantenimiento", "arregla", "refactorizar", "optimizar", "limpiar código", "brief incompleto", "taxonomía del brief" (→ ciclo directo, ya mapeado en routing.yaml)

```text
└── ⚡ ciclo (F1-F7)
    ├── 🔄 CONTRATO.md / VALIDACION.md / CORRECCIONES.md
    ├── ⚖️ brief de empresas: si seg1 `industria` / seg2 `nicho` están vacíos o [PENDIENTE]
    │      → poblar desde taxonomía (Analista/docs-TAXONOMIA → fallback tipo_negocio.split(',')[0]
    │        al catálogo) · con VALOR REAL → jamás sobreescribir  [MANUAL_OPERACION §5]
    ├── 📖 si cambió configuración de empresas → refrescar GuiaTotal/MANUAL_OPERACION.md
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

## ═══ 11. FICHAS OPERATIVAS (nivel 4 — solo cadena §1.5-1.8) ═══

> Detalle ejecutable por skill: acciones GAS con payload, tablas maestro/espejo + PK, verificación y quirks. Append-only: solo se añade ficha si nace un eslabón.

### Ficha · `empresa-mascara` (§1.8)

| Campo | Valor |
|---|---|
| Lee | `plantillas/MASCARA_CONFIG_EMPRESAS.yaml` + `registro/<id>/MASCARA.yaml` + `GET getAll?id_empresa=X` |
| Acciones GAS | `updateRow {table:"Config_Empresas", matchField:"id_empresa", updates:{A+D}}` · `appendRows {table, rows}` (alta) · `syncToSupabase {id_empresa}` |
| Despachos | `backend/core.js:388` (appendRows) · `:323` (sync) · `backend/utils.js:346` |
| Tablas | maestro GS `Config_Empresas` (57 cols) · espejo Supabase `Config_Empresas` (proj. `egyxgnlnzanxpqyuvmsg`) |
| Verifica | `select count(*) from "Config_Empresas" where id_empresa='X'` = 1 · re-GET getAll |
| Quirks | 404-transitorio del GAS → verificar antes de reintentar · sin columnas nuevas · nunca DELETE · `SUPABASE_KEY` ausente → fallback MCP + PENDIENTES |
| Cascada | switches C: `alta → empresa_registro → clusters → paginas → brief → activos` (`auto\|preguntar\|skip`) |

### Ficha · `empresa-registro` (§1.5)

| Campo | Valor |
|---|---|
| Acciones GAS | `ensureCteFolders {id_empresa}` idempotente · `generateAsset {tipo:"fotoagente", opts:{imageUrl}}` · `updateRow` (10 campos: foto/slogan/mensajes/misión…drive_folder_id) · `syncToSupabase` |
| Despachos | `backend/core.js:377` (ensureCteFolders, fn `:756`) · `:401`/fn `:810` (subirImagenCte_) |
| Drive | `cte<id>/` → `_brief`, `_activos+6`, `_share`; foto en RAÍZ con share ANYONE |
| Verifica | re-GET getAll + MCP `Config_Empresas` + tarjeta `registro/<id>.yaml` |
| Cascada | datos clave modificados → ofrece `clusters-seo`; no clave → refresca `wa/hex/mail` por `id_cluster` |

### Ficha · `clusters-seo` (§1.6)

| Campo | Valor |
|---|---|
| Acciones GAS | `appendRows {table:"Config_SEO", rows}` · `subirImagenCte {id_empresa, fileName, imageUrl, folder}` · `syncToSupabase` |
| Despachos | `backend/core.js:388` · `:401` (fn `:810`) |
| Tablas | maestro GS `Config_SEO` (10 cols) · espejo **PK `(id_empresa, id_cluster)`** = upsert idempotente |
| Drive | `cte<id>/imagenurl-{id_cluster}.jpg` share ANYONE (fallo → PENDIENTE_IMAGEN) |
| Verifica | `select count(*) from "Config_SEO" where id_empresa='X'` (≤9) · GET getAll Config_SEO |
| Reglas | id_cluster kebab descriptivo (nunca SEO-001) · legacy intocado · solo tras aprobación |

### Ficha · `paginas-seo` (§1.7)

| Campo | Valor |
|---|---|
| Acciones GAS | `appendRows {table:"Config_Paginas", rows}` · `syncToSupabase` |
| Despachos | `backend/core.js:388` · `:323` |
| Tablas | maestro GS `Config_Paginas` (6 cols) · espejo **PK `(id_empresa, id_pagina)`** (creada 2026-09-28, dedupe +4 vacías hecho) |
| Validación | 3 JSON parsean (`meta_json`, `schema_json`, `contenido_json` plano) · claims regex · 300-500 pal. |
| Verifica | `select count(*) from "Config_Paginas" where id_empresa='X'` · render `#{id_pagina}` en sitio |
| Reglas | schema Service en columna Y anidado · keywords como ARRAY · `bloques[]` jamás · sin Markdown en contenido |

---

## Mapa de dependencias entre skills

| Skill | Llama a | Alimenta a | Paralelo interno |
|---|---|---|---|
| `guia-total` | `analista-proy`, `panel-juzgador`, `ciclo`, `brief-engine`, `auditoria`, `empresa-registro` | registro, MAPA, manuales, identidad, origen | ver nodos `∥` |
| `empresa-registro` | `guia-total identidad`, `clusters-seo` → `paginas-seo` (cadena), GAS (`ensureCteFolders`/`updateRow`/`syncToSupabase`), `landing-page-copywriter` | tarjeta, `Config_Empresas` (GS), Drive `cte<id>`, espejo Supabase | identidad y copy secuenciales |
| `clusters-seo` | GAS (`appendRows`/`subirImagenCte`), `syncToSupabase` | ≤9 filas en `Config_SEO` + `imagenurl-*.jpg` en Drive → **alimenta a `paginas-seo`** | fotos ∥ por clúster |
| `paginas-seo` | GAS (`appendRows`), `syncToSupabase` | filas en `Config_Paginas` (3 JSON) — encadenada a clusters-seo | redacción serial por página |
| `empresa-mascara` | plantilla YAML + GAS (`updateRow`/`appendRows`/`syncToSupabase`) → cadena | fila `Config_Empresas` (solo A+D) + `registro/<id>/MASCARA.yaml` → **dispara la cadena** | barra de avance por paso |
| `analista-proy` | — | `panel-juzgador`, `CONTRATO` (F0), tarjeta | 4 pilares ∥ |
| `panel-juzgador` | — | tarjeta (veredicto) | 4 agentes ∥ → juez serial |
| `ciclo` | — | `CONTRATO`, `VALIDACION`, `CORRECCIONES` | fases seriales F0→F7 |
| `brief-engine` | catálogos Supabase | Brief en `logo_url` | sub-agentes A-D ∥ |
| `auditoria` | `/suit-memory` (ADRs) | `<Proyecto>/docs/00-16` + tarjeta | reuso Fase 0.5 antes de inspeccionar |

**Orden obligatorio:** `analista-proy` → `panel-juzgador` (este consume el primero). **Cadena secuencial con gates**: `empresa-mascara` (entrada por formulario) → `empresa-registro` → `clusters-seo` → `paginas-seo` (cada eslabón espera aprobación salvo switch `auto`). `auditoria` es independiente: la llama `guia-total` o el usuario. El resto es independiente.

---

*Última actualización del mapa: 2026-09-29 (§1.9 Manual de operación `MANUAL_OPERACION.md` — Config_Empresas + regla taxonomía→brief seg1-2 + check en §6; §11 fichas; `MAPA_VISUAL.html` + `check-map-visual.js`; §1.8 empresa-mascara; léxico-usuario; piloto HMP; PKs de espejo).*
