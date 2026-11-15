# PROMPT ORIGEN - SuitMisCtas

> Prompt inicial con el que nació el proyecto. **Vivo**: si el proyecto evoluciona, actualizar este archivo para reflejar qué se pidió realmente y qué se resolvió después.

**Fecha de origen:** 2026-10-19/20 (seed desde hoja GS) · **Última actualización:** 2026-11-14

---

## Prompt original (síntesis)
Construir **"SuitMisCtas"**: un dashboard **personal** de finanzas del dueño (gastos · rentas · servicios recurrentes) dentro de SuitOrg, partiendo de su hoja de cálculo privada (pestaña `GastosTarjetas`): sembrar servicios y unidades, permitir captura de movimientos con categorías, alertas de vencimientos, resumen y proyección con la fórmula de la hoja (`Saldo + (gasto−ingreso)×12`).

## Decisiones de origen registradas
1. **Uso estrictamente personal, un usuario** — `id_empresa: null`, `noindex, nofollow`.
2. **localStorage + export/import JSON**; **sin** GS-writeback, **sin** Supabase (decisión del usuario, 2026-10-20).
3. **Siembra** desde `GastosTarjetas` (17 servicios + 12 unidades, 5 cuentas) — hoja es fuente de solo lectura puntual.
4. **Puerta canónica** `http://127.0.0.1:8137` (menú MASTER) — `file://` y `:8137` no comparten localStorage (decisión 2026-10-21).
5. Vanilla JS en **un solo `index.html`** (regla inmutable #7).
6. Extensiones posteriores acordadas: pestaña **Costos AI** (`precios-ai.json`), **Gmail** (`SuitGmail :3021`, ADR-061), **Gastos de herramientas** (`gastos.json` vía `opencode stats`), filtros+subtotales en Registro (2026-11-14), cats Seguro-Afore/Prestamo/Transporte.

## Prompt para regenerar (si se pierde el contexto)
```
Crea SuitMisCtas: dashboard personal de finanzas en SuitMisCtas/index.html
(un solo archivo vanilla JS, noindex, sin frameworks, sin servidor).
localStorage 'suitmisctas_v1' con movimientos (gasto/ingreso/transferencia),
servicios recurrentes (mensual/bimestral con botón Pagado), unidades de renta
(con Recibido y atrasos), cuentas y categorías editables por chips.
Pestañas: Alertas (por saldar + gastos de herramientas desde gastos.json),
Registro (captura con suggest, bandeja por clasificar, movimientos con filtros
y subtotales), Servicios, Rentas, Resumen (mes/categoría/cuenta/histórico/año
+ proyección 12m = saldo + (gasto−ingreso)×12), Datos (export/import JSON,
saldos iniciales), Costos AI (precios-ai.json), Gmail (fetch 127.0.0.1:3021/resumen
degradando si no está). Puerta: iframe en MASTER :8137.
```

## Relación con prompts hermanos
- Sin analista-proy ni panel-juzgador: herramienta personal (no idea comercial).
- Hereda patrón de rucp/`RUCP.md` (estilo oscuro) según decisión visual original.
