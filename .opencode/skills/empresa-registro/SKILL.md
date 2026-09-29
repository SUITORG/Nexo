---
name: empresa-registro
description: "Registro semiautomatico de empresas (tenants) en Config_Empresas: dada una fila con id_empresa en Google Sheets, investiga el giro, crea la estructura Drive cte<id> si no existe, sube la fotoagente, genera slogan/mensajes/identidad, llena los campos del registro y replica en Supabase. Tras el alta (o modificación de datos clave) dispara clusters-seo para generar los clústeres SEO con aprobación. Úsala cuando el usuario diga 'empresa-registro', 'alta de empresa', 'modifica empresa', 'actualiza empresa', 'registro id_empresa', 'crea estructura drive', 'llena config empresas', 'registro semiautomatico', 'nueva empresa en sheets', o pida dar de alta/onboardear/modificar una empresa en la plataforma. No borra jamás: solo update/insert. Fase 2 (brief y activos) la ejecutan brief-engine y lapvtfu. Skill canónica SuitOS."
license: MIT
compatibility: "Claude Code y opencode. Requiere: red al webapp GAS de .clasp.json, MCP supabase (espejo/lectura), websearch para fotos libres."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Empresa-Registro — alta semiautomatica de tenants

## Propósito

Dado un registro con `id_empresa` en `Config_Empresas` (Google Sheets, maestro), dejarlo **operativo**: giro clasificado, estructura Drive `cte<id>`, fotoagente, copy (slogan/mensajes), identidad (misión…políticas), campos llenados y espejo Supabase reflejado. Herramienta acumulativa: las funciones nuevas se agregan a esta skill, no a mano.

## Endpoint GAS

Webapp del script de `.clasp.json` (scriptId `1ne8mrUA…`):

```
https://script.google.com/macros/s/AKfycbzlkAI09chbtmf3VX5jKA9N4-6Ka2pcc6P65YqCXHn9amzACDCjuJBpFm2A8tPFyDwrsA/exec
```

POST JSON `{action, ...}` · GET `?action=getAll&id_empresa=X`. Si cambia el deployment: `npx clasp deployments` (mantener `-i <id>` al hacer `clasp deploy` para no romper esta URL — gotcha TD-005).

## Flujo

```text
0. Declara: Alcance: raíz (proyecto SuitOrg) · Tabla: Config_Empresas · Maestro: Google Sheets
1. 📁 lee el registro: GET getAll?id_empresa=<ID>
   └─ si NO existe la fila → pedir alta al usuario (no inventar empresas)
2. 📁 lee GuiaTotal/TAXONOMIA.md → clasifica Industria · Nicho · Especialización (match exacto)
   └─ si pide análisis completo → ⚡ analista-proy (4 pilares) y guarda
     GuiaTotal/registro/<id>/Analista_Proy.md
3. ⚡ GAS ensureCteFolders {id} → árbol cte<id>/ (_brief, _activos+6, _share) — IDEMPOTENTE
4. 📁 busca foto libre (Unsplash/Pexels, licencia free) del giro
   ⚡ GAS generateAsset {tipo:"fotoagente", opts:{imageUrl}} → cte<id>/fotoagente.jpg
   en RAÍZ con share ANYONE (patrón lf-005) → fileUrl
5. ⚡ landing-page-copywriter → slogan (sobreescribe la columna `slogan` a pedido),
   mensaje1 (bienvenida), mensaje2 (propósito) — sin claims no verificables
6. ⚡ guia-total identidad → doc completo en GuiaTotal/registro/<id>/IDENTIDAD_CORPORATIVA.md
   (reglas del prompt: nada inventado, [PENDIENTE DE VALIDAR] lo falte)
7. ✍️ GAS updateRow {table:"Config_Empresas", matchField:"id_empresa", matchValue:<ID>,
   updates:{foto_agente, slogan, mensaje1, mensaje2, mision, vision, valores, impacto,
   politicas, drive_folder_id}}
8. ⚡ GAS syncToSupabase {id} → espejo Supabase
   └─ si responde SUPABASE_KEY ausente → fallback: MCP supabase (UPDATE … WHERE id_empresa)
     + anota en PENDIENTES: "fijar SUPABASE_KEY en ScriptProperties del GAS"
9. ✍️ verifica espejo (MCP select) · ✍️ tarjeta GuiaTotal/registro/<id>.yaml
10. ⚡ **clusters-seo** [tras ALTA o modificación de datos clave] → fases F1-F3
    (inspección + propuesta de ≤9 clústeres + vista previa) y espera aprobación
    para F4 (escritura en `Config_SEO`). Ver skill `clusters-seo`.
    └── ↪ CIERRE DE TODA PASADA (PENDIENTES + MAPA + 3 líneas)

## Modificación de empresa (mismo flujo, otra entrada)

Cuando el usuario pida **modificar** una empresa existente:

1. 📁 lee el registro actual y detecta **qué cambia**:
   - **Datos clave** (`giro_especifico`, servicios/productos, cobertura geográfica / `direccion`, `tipo_negocio`) → aplica la modificación en GS (`updateRow`) + sync → **ofrece regenerar clústeres** (`⚡ clusters-seo` F1-F4 con vista previa — nunca escribe sin aprobación).
   - **Datos no clave** (teléfono, `color_tema`, correo, logo) → `updateRow` + sync → **refresca contactos en clústeres existentes**: `updateRow` por `id_cluster` sobre `Config_SEO` (campos `wa_directo`/`hex_color`/`mail_directo` solo si cambiaron) + `syncToSupabase`.
2. Actualiza la tarjeta y cierra (PENDIENTES + MAPA).
```

## Fase 2 (NO ejecutar sin instrucciones del usuario)

BRIEF → `⚡ brief-engine` (21 segmentos en `logo_url`) · Activos → `⚡ lapvtfu` (7 slots). Delegadas a sus skills canónicas — esta skill no toca el vector Brief.

## Reglas

- **Nunca DELETE** de empresas ni filas: solo `updateRow`/UPDATE/insert con aprobación.
- **Idempotente**: `ensureCteFolders` reutiliza; `fotoagente.jpg` hace overwrite (nunca duplica); re-correr el flujo no crea copias.
- **Drive**: estructura = estándar KitBrief §5 vía `ensureCteFolders` (no reimplementar — `DriveManager` con `if CMARJAV/TOPLUX` es legado, no usar para empresas nuevas).
- **Share ANYONE con vista** antes de publicar cualquier URL de Drive.
- **Campos**: si falta dato real → `[PENDIENTE DE VALIDAR]`, jamás inventar (regla del prompt de identidad).
- **Maestro = Google Sheets**; Supabase = espejo por sync (nunca escribir Supabase como maestro).
- `node --check` tras tocar `backend/*.js` + `clasp push && clasp deploy -i <id>` si cambió GAS.

## Archivos vivos

| Archivo | Ubicación |
|---|---|
| Tarjeta del tenant | `GuiaTotal/registro/<id>.yaml` |
| Análisis / identidad | `GuiaTotal/registro/<id>/*.md` |
| Estructura + fotoagente | Drive `cte<id>/` |
| Registro maestro | Google Sheets `Config_Empresas` |
| Espejo | Supabase `Config_Empresas` |
