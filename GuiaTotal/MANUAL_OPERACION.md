# MANUAL DE OPERACIÓN — SuitOrg (solo Config_Empresas)

> **Alcance:** operar la configuración de empresas (tenants) de SuitOrg: alta, edición,
> taxonomía, brief, cadena de enriquecimiento, espejo y problemas conocidos.
> **Fuera de alcance:** subproyectos/módulos (SuitPos, Cotizador, etc.) — cada uno tiene
> sus propios manuales en `<Proyecto>/docs/`.
> **Mantenedor:** cualquier pasada de `guia-total` / `ciclo` que toque configuración →
> refrescar este manual (ver MAPA §6). Última actualización: 2026-09-29.

---

## 1. Dónde viven los datos

| Capa | Qué | Regla |
|---|---|---|
| **Maestro** | Google Sheets `Config_Empresas` (57 columnas) | **Manda.** Solo aquí se escribe. |
| **Espejo** | Supabase `Config_Empresas` (proj. `egyxgnlnzanxpqyuvmsg`) | Nunca se edita a mano; se refleja con `syncToSupabase`. PK = `id_empresa`. |
| **Catálogo taxonomía** | Supabase `industrias` (22) + `nichos` (85) → espejo `GuiaTotal/TAXONOMIA.md` | Solo INSERT de faltantes (`/guia-total taxonomia`). |
| **Tarjeta** | `GuiaTotal/registro/<id>.yaml` | Estado del tenant (activos, cadena, pendientes). |

**Reglas duras (inmutables):**
1. Todo filtrado por `id_empresa` — sin datos cruzados entre tenants.
2. **Baja = `habilitado: FALSE`** (o `activo = FALSE` en tablas con esa columna). **Jamás DELETE físico.**
3. `activo` llega de Supabase en minúsculas → normalizar `String(v).toUpperCase() === "TRUE"`.
4. El espejo puede atrasarse → reparar con `syncToSupabase` por empresa (fallback: MCP SQL).

## 2. Ciclo de vida de una empresa

```text
ALTA        → fila nueva (appendRows) mínima: id_empresa + A + habilitado/mode/db_engine
ENRIQUECIM. → cadena: empresa-registro (Drive+foto+copy+identidad)
              → clusters-seo → paginas-seo → brief-engine → lapvtfu (activos)
OPERACIÓN   → edición de campos vía máscara/chat/hoja + sync
MODIFICACIÓN→ dato clave = regenera clústeres · dato no clave = refresca contactos en clústeres
BAJA        → habilitado=FALSE + sync (nunca borrar filas)
```

## 3. Las 3 formas de editar una empresa

| Vía | Cómo | Cuándo |
|---|---|---|
| 🥇 **Sitio web** | `http://localhost:3001/mascara.html` (celular: `http://<IP-lan>:3001/mascara.html`) — form A/B/C/D, **Guardar** = `updateRow`, **Sync espejo**, **Copiar orden** | Uso diario |
| 🥈 **Chat** | `"máscara <ID>"` (la skill pregunta faltantes y encadena) · `"máscara auto total <ID>"` · `"máscara <ID> — switches: clusters: auto, …` | Cuando quieres que la cadena corra en el mismo turno |
| 🥉 **Hoja directa** | Google Sheets, pestaña `Config_Empresas` | Último recurso — tras editar **obligatorio** correr `syncToSupabase` y verificar espejo |

## 4. Campos de Config_Empresas (57) por bloques

### A. Identidad y contacto (lo que tú declaras)
| Campo | Notas |
|---|---|
| `id_empresa` | PK, mayúsculas, único |
| `nomempresa`, `descripcion` | nombre comercial y descripción |
| **`tipo_negocio`** | **formato `giro,flag_galería`** — p. ej. `Alimentos,no_galeria`. **La parte1 (antes de la coma) es el giro y es el campo de taxonomía**; la parte2 es `si_galeria`/`no_galeria` |
| `giro_especifico` | detalle libre (alimenta clústeres geo) |
| `correoempresarial`, `telefonowhatsapp`, `whatsapp_negocio`, `direccion`, `ubicacion`, `ubicacion_url`, `enlace_oficial`, `rrss` | contacto/cobertura |

### B. Marca y copy (la cadena los genera — editar a mano solo a pedido)
`slogan`, `slogan_empresa`, `mensaje1`, `mensaje2`, `color_tema`, `logo_url` (**aquí vive el brief**, ver §5), `foto_agente`, `url_logo_identidad`, `drive_folder_id`.

### C. Misión y legales (brief/identidad)
`mision`, `vision`, `valores`, `impacto`, `politicas`, `origen_politicas`, `infobanco`, `infocuenta`, `infonom`.

### D. Toggles de módulos (activar/desactivar)
| Campo | Qué controla (resumen) |
|---|---|
| `habilitado` | **maestro del tenant**: FALSE = apagado |
| `modo` | `PROD` / `TEST` (pipe: `PROD,1` = variantes) |
| `modo_sitio` | modo del sitio (p. ej. `NOHYBRID`) |
| `db_engine` | `GSHEETS` \| `SUPABASE` \| `NEON` — motor de datos privados |
| `usa_reservaciones`, `usa_soporte_ia`, `usa_qr_sitio`, `usa_otp_entrega`, `usa_features_estandar`, `agent_enabled`, `formulario`, `factura` | gates de módulos (detalle en ADR-004/005) |
| `stripe_activo`, `stripe_public_key` | pagos |
| `autodepuracion` | días de retención |
| `modo_creditos`, `creditos_totales`, `fecha_vencimiento` | créditos/vigencia |
| `is_isolated`, `es_principal` | aislamiento / tenant principal |

### E. Técnicos/misc
`fecha_creacion`, `alias_seo`, `impacto`… (columnas de apoyo; no editar sin motivo).

## 5. Taxonomía y Brief (los2 primeros segmentos)

### Dónde se guarda la taxonomía de un negocio
1. **Declarada**: `tipo_negocio` parte1 (`Alimentos`, `Hospedaje`, `Seguros`…).
2. **Analizada**: `GuiaTotal/registro/<id>/Analista_Proy.md` y `<Proyecto>/docs/TAXONOMIA.md` → Industria · Nicho · Especialización (match exacto al catálogo).
3. **Catálogo**: Supabase `industrias`+`nichos` (espejo: `GuiaTotal/TAXONOMIA.md`).
4. **En el brief**: segmentos **1 `industria`** y **2 `nicho`** del vector en `logo_url`.

### El brief
- `Config_Empresas.logo_url` = vector de **21 segmentos separados por `|`**:
  `industria: … |nicho: … |especializacion: … |vendes: … |…` (LAPVTFU = segmento 10).
- Escrito por **brief-engine** (reglas y confianza A/B/C ya existentes).

### ⚖️ Regla de los 2 primeros campos (obligatoria al correr el brief)
```text
Al hacer assemble/edición del brief:
1. Si `industria` (seg1) o `nicho` (seg2) tienen VALOR REAL → NO se tocan (jamás borrar).
2. Si están vacíos o "[PENDIENTE]" → rellenar con la taxonomía detectada:
   a. si existe Analista_Proy / docs-TAXONOMIA de la empresa → usar Industria·Nicho de ahí
   b. si no → tipo_negocio.split(',')[0] → match EXACTO al catálogo (Supabase/TAXONOMIA.md)
3. El resto del brief se escribe con sus reglas actuales (21 segmentos, LAPVTFU intacto,
   campos vacíos = [PENDIENTE - motivo], confianza A/B/C).
```
- **Prueba conocida:** `HMP` (logo_url vacío → rellena) · `NOET`/`TOÑOTOQUES` (valor real → no se pisa) · `TOPLUXF`/`PRPT` (`[PENDIENTE]` → rellenable).

## 6. Cadena de enriquecimiento (switches)

Por empresa: `GuiaTotal/registro/<id>/MASCARA.yaml` → bloque `C_cadena`
(`alta`, `empresa_registro`, `clusters`, `paginas`, `brief`, `activos`) con
`auto` (sin preguntar) · `preguntar` (default, preview + [s/n]) · `skip` (ya hecho/no aplica).

| Eslabón | Skill | Escribe |
|---|---|---|
| estructura+copy+identidad | `empresa-registro` | Drive `cte<id>/`, foto, slogan/mensajes, misión… |
| clústeres | `clusters-seo` | ≤9 filas `Config_SEO` + fotos (PK id_cluster) |
| páginas | `paginas-seo` | filas `Config_Paginas` (3 JSON, PK id_pagina) |
| brief | `brief-engine` | vector21 segmentos en `logo_url` |
| activos | `lapvtfu` | `cte<id>/_activos` |

## 7. Modificación: clave vs no clave

| Tipo | Ejemplos | Efecto |
|---|---|---|
| **Clave** | `giro_especifico`, servicios, cobertura/`direccion`, `tipo_negocio` | `updateRow` + sync → **ofrecer regenerar clústeres** |
| **No clave** | teléfono, `color_tema`, correo, logo | `updateRow` + sync → **refresca `wa_directo`/`hex_color`/`mail_directo`** en `Config_SEO` por `id_cluster` |

## 8. Accesos (mínimo)

- `Usuarios` y `Config_Roles` también son tablas MASTER en Sheets.
- RBAC: `DIOS(999)` · `ADMIN(10)` · `STAFF(5)` · `DELIVERY(-)`.
- Tokens: `API_AUTH_TOKEN` en todo POST al GAS (el GAS local acepta sin token, pero producción lo exige).

## 9. Problemas conocidos

| Problema | Qué hacer |
|---|---|
| GAS responde **404 pero ejecuta** (transitorio) | **Verificar estado en la hoja antes de reintentar** (ya causó duplicados) |
| `SUPABASE_KEY` ausente en GAS | fallback MCP SQL + anotar en PENDIENTES fijar ScriptProperties |
| Espejo atrasado | `syncToSupabase` **por empresa** (loop para catch-up) |
| Duplicados/huérfanas en `Config_Paginas` | higiene pendiente en PENDIENTES (espejo ya saneado: PK) |
| Logo roto (ORB de Drive) | placeholder `app.utils.DEFAULT_IMG` en el frontend |
| `no-cors` a GAS = respuesta opaca | desde navegador usar GET legible (getAll) o POST `text/plain` como hace el admin |

## 10. Checklist de alta (5 pasos)

1. **Crear fila**: máscara web (➕ Nueva) o `appendRows` → id + A + `habilitado/mode/db_engine`.
2. **Sync espejo** y verificar `count = 1` por `id_empresa`.
3. **Estructura/copy**: cadena `empresa-registro` (Drive `cte<id>/` + foto + identidad).
4. **SEO**: `clusters-seo` → `paginas-seo` (con gates).
5. **Brief + activos**: `brief-engine` (aplica regla §5) → `lapvtfu`.

**Enlaces:** `MAPA.md` §1.5-1.9 · `MAPA_VISUAL.html` · `PENDIENTES.md` ·
plantilla `GuiaTotal/plantillas/MASCARA_CONFIG_EMPRESAS.yaml` · ADR-004/005 (flags).
