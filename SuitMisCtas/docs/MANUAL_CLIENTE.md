# MANUAL CLIENTE - SuitMisCtas

> **Para qué sirve este manual:** enseña a usar el dashboard de finanzas personales: capturar movimientos, revisar alertas, saldar servicios/rentas y leer tu resumen y proyección.
> **Audiencia:** frontend — el dueño (uso personal, sin conocimientos técnicos).
> **Versión:** 1.0 · **Última actualización:** 2026-11-14 · **Plataforma:** SuitMisCtas

---

## Para qué sirve este manual (detalle)
Cubre el uso diario de la interfaz: pestañas, captura, clasificación, alertas, resumen y respaldo. No cubre mantenimiento técnico (`MANUAL_TECNICO.md`) ni pruebas (`MANUAL_PRUEBAS.md`).

## 1. Bienvenida
- Todo tu dinero en un solo lugar: gastos, ingresos/rentas y servicios recurrentes.
- Alertas automáticas: servicios vencidos o por vencer, rentas atrasadas, movimientos sin clasificar.
- Resumen por mes, categoría y cuenta + **proyección a 12 meses** con tu fórmula.
- Los datos viven **en tu navegador**; exportas un JSON cuando quieras respaldo.

## 2. Cómo abrirlo (puerta correcta)
1. Ejecuta `suitorg-menu.bat` → [4] Sistemas → [7] MASTER (`MASTER.bat`).
2. Abre **SuitMisCtas** desde MASTER (iframe en `http://127.0.0.1:8137`).
3. ⚠️ Usa **solo esta puerta**: abrir el `index.html` con doble clic (`file://`) crea "otra memoria" — tus datos no se ven entre orígenes.

## 3. Pestañas

| Pestaña | Para qué |
|---|---|
| ** Alertas** | Vencidos/por vencer, rentas atrasadas, bandeja "Por clasificar", gastos de herramientas (OpenCode automático + Google a mano) y "Por saldar" del mes |
| **Registro** | Captura rápida, bandeja Por clasificar, tabla de Movimientos con filtros y subtotales |
| **Servicios** | Tus 17 servicios recurrentes: botón **Pagado** registra el gasto del mes (el bimestral solo en meses pares) |
| **Rentas** | Tus unidades: botón **Recibido** registra el ingreso; badges de atraso por inquilino |
| **Resumen** | Mes seleccionado: ingresos/gastos/ahorro, por categoría, por cuenta, histórico, resumen del año y **Proyección 12 meses** |
| **Datos** | Exportar/Importar JSON, Reiniciar, saldos iniciales por cuenta, saldo base de la proyección |
| ** Costos AI** | Catálogo de precios de modelos AI (`precios-ai.json`) |
| ** Gmail** | Semáforo de correos (banco/pagos/luz/agua/teléfono) vía SuitGmail en `127.0.0.1:3021` — si no corre, la pestaña lo indica |

## 4. Flujo principal (captura y clasificar)
1. **Registro → Captura rápida**: escribe el concepto (aparece el suggest del catálogo), Tipo (Gasto / Ingreso-Renta / Transferencia), Monto, Fecha, Cuenta (chips) y Categoría (chips) → **Agregar**.
2. Si dejas OFF "Clasificado", el movimiento cae a la bandeja **Por clasificar**; reclasifícalo desde ahí.
3. En **Movimientos**: ordena por Recientes / Por categoría / Por cuenta; filtra por cuenta y categoría (chips "Todas" para quitar) — verás **Subtotal** según filtros.
4. Mes activo: el selector en **Resumen** también filtra Registro, Servicios, Rentas y Alertas.

## 5. Servicios y rentas del mes
- Servicios → **Pagado**: descuenta y registra el gasto del mes en un clic (bimestral = solo meses pares).
- Rentas → **Recibido**: registra el ingreso; si hay días de atraso aparece badge.
- Alertas → **Por saldar** lista lo que falta del mes con botones de liquidar.

## 6. Respaldo (obligatorio de vez en cuando)
1. **Datos → Exportar JSON** (baja `suitmisctas-AAAA-MM-DD.json`).
2. Guárdalo en `SuitMisCtas/respaldos/` (hay uno de referencia: `suitmisctas-2026-10-21.json`).
3. Para restaurar/mover de compu: **Importar JSON** (reemplaza los datos actuales).

## 7. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| No veo mis datos | Abierto en otro origen (doble clic vs menú) | Abre por la puerta MASTER `:8137`; si cambiaste de origen, Importa el respaldo |
| Gmail dice "no conectado" | SuitGmail (`:3021`) apagado | Corre SuitGmail o ignora la pestaña (el resto funciona) |
| Gastos OpenCoach "—" | `gastos.json` desactualizado o `opencode stats` falló | `actualizar-gastos.bat` (o MASTER al arrancar) |
| Movimiento fantasma en el mes equivocado | Fecha mal escrita | Edita/bórralo en Movimientos y recaptura |

## 8. Diagrama de flujo

```text
[Dueño] → [puerta MASTER :8137] → [captura / Pagado / Recibido] → [clasificar] → [alertas al día] → [resumen + proyección] → [export JSON de respaldo]
```

## Datos pendientes de validar
- [ ] Confirmar con el dueño la frecuencia deseada de export de respaldo (sugerido: semanal)
