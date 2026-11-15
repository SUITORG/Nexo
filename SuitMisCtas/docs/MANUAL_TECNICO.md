# MANUAL TECNICO - SuitMisCtas

> **Para qué sirve este manual:** arquitectura, datos y mantenimiento del dashboard.
> **Audiencia:** backend — quien mantiene o extiende el código.
> **Versión:** 1.0 · **Última actualización:** 2026-11-14 · **Plataforma:** SuitMisCtas

---

## Para qué sirve este manual (detalle)
Arquitectura del módulo, modelo de datos, dependencias y reglas de edición. No cubre uso (`MANUAL_CLIENTE.md`) ni pruebas (`MANUAL_PRUEBAS.md`).

## 1. Arquitectura
- **Un solo archivo** `SuitMisCtas/index.html` (~1510 líneas): HTML + CSS + JS vanilla inline (`'use strict'`), sin frameworks, sin build (regla inmutable #7).
- **Sin servidor propio**: sirve estático desde `MASTER.bat` (`python -m http.server 8137`) → iframe en `MASTER.html` (puerta canónica `suitorg-menu.bat` → [4] → [7]).
- **Persistencia**: `localStorage['suitmisctas_v1']` — un objeto `db` con movimientos, servicios, unidades, saldos iniciales, saldo de proyección, categorías/cuentas editables. `load()`/`save()` centralizados.
- **Vistas** (botones `data-v`): `alertas` (default), `registro`, `servicios`, `rentas`, `resumen`, `datos`, `ai`, `gmail`.

## 2. Archivos

| Archivo | Rol |
|---|---|
| `index.html` | Toda la app |
| `gastos.json` | Generado: `scripts/gastos-update.js` (`opencode stats` → total/promDia/sesiones/tokens/mes30) + `scripts/google-saldo.js` (best-effort; conserva último valor si falla) |
| `precios-ai.json` | Catálogo de precios AI (pestaña 🤖; hay `.bak-stars` de respaldo) |
| `actualizar-gastos.bat` | Lanza `node scripts/gastos-update.js` desde raíz del repo |
| `respaldos/` | Exportaciones JSON del usuario (ref: `suitmisctas-2026-10-21.json`) |

## 3. Integraciones
- **SuitGmail** (opcional): `GET http://127.0.0.1:3021/resumen?t=` → pestaña 📬 (semaforo correos). Sin servidor → estado "no conectado", no rompe el resto.
- **MASTER.html**: botón/iframe; sin él, servir con `python -m http.server` temporal.
- **Hoja GS privada** (`GastosTarjetas`): solo siembra puntual 2026-10-20 — sin write-back, sin re-leer sin permiso.
- **No hay**: GAS, Supabase, `id_empresa`, auth, puertos propios.

## 4. Modelo de datos (esquema v1)
```
db = {
  movimientos: [{id, fecha, concepto, tipo: gasto|ingreso|transferencia, monto, cuenta, categoria, nota, clasificado}],
  servicios:   [{nombre, monto, frecuencia: mensual|bimestral, diaVence, pagadoMes}],
  unidades:    [{nombre, renta, inquilino, atrasoDias, recibidoMes}],
  saldosIniciales: {cuenta: monto},
  saldoProyeccion: number,
  categorias: [...], cuentas: [...], seededAt
}
```
- Cuentas default al arrancar sin LS: `['STD','LU','M40 IMSS','Efectivo','Efectivo Casa']` (el seed histórico trajo BBVA/STD/IVX/LU/FAL — migrado a lo que el usuario editó).
- Transferencia: mueve saldos, **no** cuenta como gasto ni ingreso.
- Mes activo (selector en Resumen) es estado compartido: filtra Registro/Servicios/Rentas/Alertas.

## 5. Fórmulas clave
- **Proyección 12m**: `Saldo actual + (gasto − ingreso) × 12` (promedio de meses registrados) — misma fórmula de su hoja GS.
- Subtotales de Movimientos: según chips de filtro cuenta/categoría activos.
- Alertas: vencidos/por vencer (servicios por día de vencimiento; bimestral solo meses pares), atraso de rentas por `atrasoDias`.

## 6. Cómo editar
1. Tocar **solo** `SuitMisCtas/**` (dependencia documentada: `scripts/gastos-update.js`, `scripts/google-saldo.js`).
2. JS inline en HTML → extraer el bloque a un `.js` temporal y `node --check` antes de guardar, o smoke en navegador.
3. **Invariantes** (`docs/CONTRATO.md`): personal/unusuario, noindex, datos solo en LS, puerta `:8137` (origenes no comparten LS), vanilla JS, no write-back GS/Supabase, categorías/cuentas editables.
4. Tras cambio de datos: exportar respaldo y actualizar `docs/` si cambia el flujo.

## 7. Respaldos
- Código: git + `scripts/backup.sh`.
- Datos del usuario: **solo localStorage** — riesgo aceptado; mitigación = rutina de export en `MANUAL_PROVEEDOR.md` §5. Reiniciar = borra LS (`resetAll()`).

## 8. Problemas frecuentes

| Problema | Causa | Solución |
|---|---|---|
| "Datos perdidos" al abrir | Origen distinto (`file://` vs `:8137`) | Puerta MASTER; importar respaldo |
| `gastos.json` "—" | `opencode stats` no está en PATH o falló | Correr bat y leer consola |
| Gmail colgado | `:3021` apagado | Esperado; degradar con mensaje |
| Editar inline sin ver error | JS dentro de HTML | `node --check` en copia del bloque |

## Datos pendientes de validar
- [ ] ADR pendiente del usuario: decisión de respaldo (solo LS) registrada como asunción en contrato
