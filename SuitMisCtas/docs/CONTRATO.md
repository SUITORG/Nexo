# CONTRATO - SuitMisCtas
Alcance: `SuitMisCtas/` · Contrato padre: ninguno (herramienta personal, no tenant) · Fecha: 2026-11-14

## Propósito
Dashboard **personal** de finanzas del dueño: gastos, rentas y servicios recurrentes en un solo HTML local. Captura rápida con catálogo, bandeja "Por clasificar", alertas (servicios vencidos/por vencer, rentas atrasadas), stats (ingresos/gastos/ahorro por categoría y cuenta, histórico), **proyección 12 meses** con la fórmula del usuario (`Saldo + (gasto−ingreso)×12`), más pestañas de apoyo: Costos AI, Gmail (consumo de SuitGmail :3021) y Gastos de herramientas (OpenCode/Google).

## Stack y ejecución
- Lenguaje / runtime: un solo `index.html` (HTML + JS vanilla inline, sin frameworks, sin build)
- Comandos: puerta canónica `suitorg-menu.bat` → [4] Sistemas → [7] MASTER → `MASTER.bat` (`python -m http.server 8137`) → iframe `http://127.0.0.1:8137/SuitMisCtas/` · sintaxis: validar el JS inline extraído o smoke en navegador · `node scripts/gastos-update.js` (refresca `gastos.json`)
- Variables de entorno requeridas: **ninguna** (Gmail tab usa `http://127.0.0.1:3021` opcional)

## Datos y multi-inquilino
- Consume `Config_Empresas`: **no** (`id_empresa: null`, herramienta personal — asumido de "uso estrictamente personal")
- Motor de datos: `localStorage['suitmisctas_v1']` + export/import JSON (decisión del usuario 2026-10-20: **sin** GS-writeback, **sin** Supabase)
- Siembra inicial (2026-10-20): pestaña `GastosTarjetas` de la hoja GS privada del usuario (17 servicios + 12 unidades); la hoja es fuente de solo lectura puntual — **no re-leer sin permiso**
- Archivos estáticos auxiliares: `gastos.json` (generado por `scripts/gastos-update.js` vía `opencode stats` + `google-saldo.js`), `precios-ai.json` (catálogo de precios AI), `actualizar-gastos.bat` (lanzador), `respaldos/`
- Multi-tenant: N/A (un solo usuario, un solo navegador)

## Límites
- Puede modificar: `SuitMisCtas/**`; como dependencia documentada, `scripts/gastos-update.js` / `scripts/google-saldo.js` (generadores de `gastos.json`)
- No debe tocar: fuera del alcance; no añadir frameworks, servidores propios ni write-back a GS/Supabase
- Dependencias: `MASTER.html` (botón/iframe), SuitGmail opcional (`:3021`), registro en `.suit/registry/projects.yaml` (suit-misctas) y `GuiaTotal/registro/suitmisctas.yaml`

## Invariantes (no romper nunca)
1. **Uso estrictamente personal, un usuario**; `noindex, nofollow` siempre (regla EvaSol)
2. Los datos viven **solo en el navegador** (`suitmisctas_v1`) — sin servirlos a terceros; respaldo = Exportar JSON a `respaldos/`
3. **Puerta canónica = origen `http://127.0.0.1:8137` (menú MASTER)** — `file://` y `:8137` **no** comparten localStorage; usar solo esa puerta (decisión 2026-10-21). Migrar de origen solo con export+import
4. Vanilla JS en un solo archivo (regla inmutable #7); validar sintaxis + smoke tras cada edición
5. La hoja GS origen es privada: **no re-leer sin que el usuario vuelva a compartir**
6. Categorías/cuentas/ servicios/ unidades son **editables** por el usuario en la UI — no acoplar valores hardcodeados que impidan editarlos

## Definición de terminado
- Smoke sin errores de consola: alertas, captura, filtros+subtotales, servicios/rentas, resumen+proyección, export/import
- `gastos-update.js` OK si se tocó ese flujo
- Commit por fase; ADR si hay cambio arquitectónico

## Cambios
- 2026-11-14: contrato inicial (guia-total, etapa construcción) — verificado contra código: `index.html` (vistas `alertas|registro|servicios|rentas|resumen|datos|ai|gmail`), `gastos.json`, `precios-ai.json`, `actualizar-gastos.bat`
