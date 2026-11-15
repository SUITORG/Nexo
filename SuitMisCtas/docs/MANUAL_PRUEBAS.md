# MANUAL DE PRUEBAS - SuitMisCtas

> **Para qué sirve este manual:** validar el módulo antes de subir cambios: sintaxis + recorrido E2E manual.
> **Audiencia:** desarrollador que valida cambios antes de subirlos.
> **Versión:** 1.0 · **Última actualización:** 2026-11-14 · **Plataforma:** SuitMisCtas

---

## Para qué sirve este manual (detalle)
Sin test framework ni servicios propios: la validación = sintaxis + recorrido manual determinista en la puerta canónica. No cubre uso cotidiano ni arquitectura.

## 1. Qué es el modo de pruebas
No hay flag de modo dev. Todo se prueba en el navegador real sobre la puerta `:8137`. Datos de prueba = localStorage de la sesión de prueba (exportar antes si hay datos reales).

## 2. Activación rápida
```bash
# Sintaxis: extraer el JS inline de index.html a un .js temporal y
node --check <temporal>.js
```
Abrir por la puerta: `suitorg-menu.bat` → [4] Sistemas → [7] MASTER → SuitMisCtas → DevTools consola (vacía).

## 3. Qué se mockea y qué no

| Servicio | En pruebas | En producción |
|---|---|---|
| SuitGmail `:3021` | apagado → estado "no conectado" | opcional encendido |
| `gastos.json` | el del repo | refrescado por `actualizar-gastos.bat` |
| Persistencia | localStorage de la pestaña de prueba | localStorage real |
| Hoja GS | no se toca | no se toca (solo siembra histórica) |

## 4. Datos de prueba
- Estado limpio: DevTools → `localStorage.removeItem('suitmisctas_v1')` → recargar.
- Datos de humo: 1 gasto, 1 ingreso, 1 transferencia entre cuentas, 1 movimiento OFF "Clasificado".
- ⚠️ Nunca probar con el LS del dueño sin exportar antes.

## 5. Recorrido E2E completo

```text
[Alertas carga] → [captura gasto con suggest] → [bandeja clasificar → reclasificar] →
[Movimientos: filtros + subtotales] → [Servicios: Pagado] → [Rentas: Recibido] →
[Resumen: mes + histórico + proyección] → [Datos: export → import] → [Gmail degrada]
```

Resultados esperados:
1. Alertas renderiza "Por saldar" del mes y tarjeta de gastos de herramientas (OpenCode con `gastos.json` o "—").
2. Captura con suggest prellena tipo/categoría; OFF "Clasificado" cae a bandeja; reclasificar la vacía.
3. Filtros de cuenta/categoría actualizan **Subtotal**; quitar chips ("Todas") restaura total.
4. Pagado/Recibido registran movimiento del mes (bimestral solo en meses pares).
5. Resumen: stats + por categoría/cuenta + histórico clicable + proyección usa `saldoProyeccion`.
6. Export baja `suitmisctas-AAAA-MM-DD.json`; importar ese archivo restaura; **Reiniciar todo** vacía.
7. Gmail sin `:3021` → mensaje, sin excepción en consola.
8. Consola **sin errores** en todo el recorrido.

## 6. Criterios de pasada
- [ ] `node --check` del JS extraído → OK
- [ ] Consola sin errores (alertas → datos → gmail)
- [ ] Subtotales cuadran con los filtros aplicados
- [ ] Proyección = `saldo + (gasto−ingreso)×12` con los datos cargados
- [ ] Export → import round-trip conserva movimientos/servicios/unidades
- [ ] Reiniciar todo deja estado limpio

## 7. Problemas frecuentes del modo pruebas

| Problema | Causa | Solución |
|---|---|---|
| Aparecen datos de otra prueba | LS compartido con la sesión real | Exportar real antes; limpiar LS en la pestaña de pruebas |
| Consola: CORS en `gastos.json` | servido con `file://` | usar puerta `:8137` |
| Gmail "falla" | `:3021` apagado | esperado — verificar mensaje, no excepción |

## Datos pendientes de validar
- [ ] Ninguno (recorrido E2E cubierto; re-ejecutar tras cambios)
