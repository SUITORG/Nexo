# MANUAL PROVEEDOR - SuitMisCtas

> **Para qué sirve este manual:** la **rutina de mantenimiento de datos** del dashboard: captura masiva, reclasificación, actualización de gastos de herramientas y respaldos.
> **Audiencia:** frontend — quien opera el registro de datos (el dueño en rol de "operador").
> **Versión:** 1.0 · **Última actualización:** 2026-11-14 · **Plataforma:** SuitMisCtas

---

## Para qué sirve este manual (detalle)
Herramienta de un solo usuario: aquí «proveedor» = quien mantiene los datos limpios y al día. Cubre las rutinas periódicas, no el uso básico (`MANUAL_CLIENTE.md`) ni la arquitectura (`MANUAL_TECNICO.md`).

## 1. Rutina diaria/semanal de captura
1. **Registro → Captura rápida** con el suggest del catálogo (concepto+tipo+categoría ya salen prellenados).
2. Deja OFF "Clasificado" si no estás seguro → luego vacía la bandeja **Por clasificar** (objetivo: **0 ítems**).
3. Revisa **Alertas → Por saldar** y marca **Pagado/Recibido** solo cuando el dinero realmente se movió.

## 2. Cierre de mes (recomendado día 1 o 2)
1. **Resumen** → selecciona el mes cerrado.
2. Verifica: ingresos, servicios, otros gastos, ahorro y tasa.
3. Revisa **Por categoría** y **Por cuenta** contra tus estados de cuenta reales.
4. Exporta JSON del cierre y guárdalo en `respaldos/` (nombre: `suitmisctas-AAAA-MM.json`).

## 3. Actualizar gastos de herramientas (OpenCode / Google)
- Ejecuta `SuitMisCtas/actualizar-gastos.bat` (corre `node scripts/gastos-update.js`: `opencode stats` + `scripts/google-saldo.js` best-effort).
- También lo corre `MASTER.bat` al arrancar.
- Resultado: `gastos.json` fresco → la tarjeta "☁️ Gastos de herramientas" en Alertas lo muestra.
- Google (payments) se registra a mano con el botón ✎ Google si el scraper automático no corre.

## 4. Siembra desde la hoja GS (solo si el usuario lo pide)
- La pestaña `GastosTarjetas` de su hoja privada es **solo lectura puntual** — **no re-leer sin permiso explícito**.
- Si se pide re-siembrar: leer solo esa pestaña, mapear categorías/concepto/cuentas y ofrecer diff antes de tocar nada (nunca pisar movimientos ya capturados sin confirmar).

## 5. Respaldos y migración de equipo
1. **Datos → Exportar JSON** (incluye movimientos, servicios, unidades, saldos iniciales y saldo de proyección).
2. Copiar a `SuitMisCtas/respaldos/` + el respaldo ya está en git si se commitea.
3. En la máquina/origen destino: **Importar JSON** (reemplaza todo — importar sobre datos existentes los borra).

## 6. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| Subtotales no cuadran con la hoja | Filtros activos o mes distinto | Quita chips de filtro ("Todas") y verifica el mes en Resumen |
| `gastos.json` viejo | No se corrió el bat / `opencode stats` falló | Correr `actualizar-gastos.bat` y leer su consola |
| Importó el respaldo equivocado | Dos archivos en `respaldos/` | Volver a exportar del estado bueno e importar de nuevo |
| Movimientos doblados | Captura repetida | Borrar el duplicado en Movimientos (tacho) |

## 7. Diagrama de flujo

```text
[Operador] → [captura con suggest] → [bandeja a 0] → [Pagado/Recibido del mes] → [cierre: resumen + export] → [gastos-update] → [respaldos/ + git]
```

## Datos pendientes de validar
- [ ] Frecuencia de cierre de mes acordada con el dueño (mensual sugerido)
