---
name: empresa-mascara
description: "Máscara de Config_Empresas: formulario de SOLO campos obligatorios (identidad, giro, cobertura, contacto) que escribe la fila en Google Sheets, sincroniza el espejo y lanza la cadena por switches auto|preguntar|skip (alta → empresa-registro → clusters-seo → paginas-seo → brief → activos) con barra de avance en cada paso. Úsala cuando el usuario diga 'máscara', 'mascara', 'máscara empresa', 'llenar máscara', 'form empresa', 'nueva máscara', 'máscara auto total', o pida llenar/configurar una empresa en vez de editar GS a mano. Skill canónica SuitOS; plantilla en GuiaTotal/plantillas/; los flags de cadena viven SOLO en el YAML (sin columnas nuevas en la hoja)."
license: MIT
compatibility: "Claude Code y opencode. Requiere: red al webapp GAS de .clasp.json, MCP supabase (espejo), skills de cadena (empresa-registro, clusters-seo, paginas-seo, brief-engine, lapvtfu)."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Empresa-Máscara — obligatorios de Config_Empresas + cadena por switches

## Propósito

Dejar de editar `Config_Empresas` a mano en Google Sheets: la máscara recoge **solo los
campos obligatorios** (bloque A), escribe la fila, sincroniza el espejo y **desde ahí
ordena la cadena** — cada eslabón con su switch `auto | preguntar | skip` y **barra de
avance** visible en cada paso. Flags y switches viven **solo en el YAML de la empresa**
(0 columnas nuevas en la hoja).

## Rutas

| Qué | Dónde |
|---|---|
| Plantilla maestra | `GuiaTotal/plantillas/MASCARA_CONFIG_EMPRESAS.yaml` |
| Máscara por empresa | `GuiaTotal/registro/<id>/MASCARA.yaml` |
| Tarjeta | `GuiaTotal/registro/<id>.yaml` |
| Léxico (gíros del usuario) | `.suit/memory/patterns/lexico-usuario.md` (activación automática vía AGENTS.md pre-flight) |

## Endpoint GAS

Mismo webapp que `empresa-registro` (scriptId `1ne8mrUA…`, deploy @25):

```
https://script.google.com/macros/s/AKfycbzlkAI09chbtmf3VX5jKA9N4-6Ka2pcc6P65YqCXHn9amzACDCjuJBpFm2A8tPFyDwrsA/exec
```

POST JSON `{action, …}` · GET `?action=getAll&id_empresa=X`. **Quirk:** devuelve 404
transitorio que aún puede ejecutar — tras cualquier 404 **verificar estado en la hoja
antes de reintentar**.

## Bloques de la máscara

| Bloque | Quién lo llena | Se escribe en GS |
|---|---|---|
| **A_datos_tuyos** (obligatorios): `id_empresa`, `nomempresa`, `tipo_negocio`, `giro_especifico`, `color_tema`, `direccion`, `whatsapp_negocio`, `correoempresarial` | usuario (la skill pregunta los que falten) | ✅ sí |
| **B_generados**: slogan, mensajes, descripción, logo, foto, misión/visión/valores | cadena (nunca a mano) | solo si el usuario lo pide |
| **C_cadena**: `alta`, `empresa_registro`, `clusters`, `paginas`, `brief`, `activos` → `auto\|preguntar\|skip` | usuario | ❌ (solo YAML) |
| **D_toggles**: módulos (habilitado, modo, db_engine, usa_*, …) | usuario (solo descomenta lo distinto) | ✅ sí |

## Barra de avance (siempre visible)

Formato: `[▓▓▓▓░░░░░░] 40% · paso 3/7 — escribiendo Config_Empresas (updateRow)`
Total de pasos N = 3 base (valida · escribe · sync) + número de eslabones con switch
distinto de `skip`. Ejemplos:

```text
[▓░░░░░░░░░] 10% · paso 1/7 — validando bloque A (3 faltantes)
[▓▓▓▓░░░░░░] 40% · paso 3/7 — syncToSupabase + verificación espejo
[▓▓▓▓▓▓░░░░] 60% · paso 5/7 — clusters: mode preguntar → ¿creo los clústeres? [s/n]
[▓▓▓▓▓▓▓▓▓▓] 100% · completo — ↪ CIERRE DE TODA PASADA
```

## Flujo

```text
0. Declara: Alcance: raíz (proyecto SuitOrg) · Tabla: Config_Empresas · Maestro: Google Sheets
1. 📄 lee plantilla → si GuiaTotal/registro/<id>/MASCARA.yaml no existe, la crea (copia
   con id_empresa) · si existe, úsela tal cual
2. [1/N] ✅ valida bloque A + C: faltantes de A → pregunta (≤3 por turno, nunca inventar);
   C sin definir → asume "preguntar" · "auto total <ID>" → todos a "auto" ·
   el pedido puede traer los switches en una línea
   (`máscara HMP — switches: alta: skip, clusters: auto, …`) → aplícalos a C_cadena
   antes de F1 (la UI local `mascara.html` arma esa orden con "Copiar orden")
3. [2/N] ✍️ escribe Config_Empresas: SOLO A (+ D descomentado)
   · fila existe → GAS updateRow {table:"Config_Empresas", matchField:"id_empresa"}
   · no existe y C.alta=auto/preguntar aprobado → GAS appendRows (fila nueva mínima)
   · C.alta=skip y no existe → PARA y explica (no crea empresas en silencio)
4. [3/N] ⚡ GAS syncToSupabase {id} → 📁 verifica espejo (MCP select) ·
   si SUPABASE_KEY ausente → fallback MCP + anota en PENDIENTES
5. [4..N] ▶ CADENA eslabón por eslabón según C (cada uno con su barra):
   · empresa_registro → ⚡ empresa-registro (Drive + fotoagente + copy + identidad)
   · clusters         → ⚡ clusters-seo F1-F4
   · paginas          → ⚡ paginas-seo F1-F5
   · brief            → ⚡ brief-engine (vector en logo_url)
   · activos          → ⚡ lapvtfu (cte<id>/_activos)
   mode auto → ejecuta directo · mode preguntar → preview 2-3 líneas + [s/n] · skip → no toca
6. ✔ [N/N] 100% → ✍️ tarjeta (actualiza bloque máscara/estado) → ↪ CIERRE DE TODA PASADA
```

## Reglas

- **Nunca DELETE** de empresas ni filas: solo `updateRow`/`appendRows` con aprobación.
- **Nunca inventar** campos A: si falta, pregunta (≤3 por turno).
- **Sin columnas nuevas** en `Config_Empresas`: switches solo en el YAML.
- **Espejo verificado** tras cada sync (patrón: PK `(id_empresa, …)` hace el upsert
  idempotente — si un 404 del GAS deja dudas, verificar ANTES de reintentar).
- Bloque B: la skill no lo escribe salvo pedido explícito ("escribe el bloque B").
- Si el eslabón `alta` está en `skip` y la fila no existe → no escribir nada; solo avisar.
- Cadena respeta los gates de cada skill salvo switch `auto` (decisión del usuario).
