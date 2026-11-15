# MANUAL VENTAS - SuitMisCtas

> **Para qué sirve este manual:** pitch y objeciones de la herramienta. Es **uso personal**; sirve para presentarla internamente y, si algún día se abriera a otros, como base.
> **Audiencia:** quien presenta la herramienta.
> **Versión:** 1.0 · **Última actualización:** 2026-11-14

---

## Producto
Dashboard personal que junta **gastos, rentas y servicios recurrentes** en una sola pantalla: alertas de vencimientos, captura rápida con catálogo, subtotales por cuenta/categoría, resumen mensual/anual y **proyección a 12 meses** con tu propia fórmula — sin hojas de cálculo dispersas.

## ICP (perfil)
- **Interno (hoy):** el propio dueño (finanzas personales: 5 cuentas, 17 servicios, 12 unidades de renta).
- **Futuro (no activo):** personas con gastos recurrentes multi-cuenta que viven de hojas de cálculo.

## Pitch 60s
«Tu plata vive en cinco apps y una hoja: la tarjeta, el banco, los servicios, las rentas y el Excel que nunca cuadra. SuitMisCtas lo junta en una pantalla: capturas en 3 segundos con tu catálogo, las alertas te dicen qué vence hoy, el botón Pagado liquid el mes de un clic y la proyección te dice a dónde vas en 12 meses con tu propia fórmula. Todo local en tu navegador, con respaldo JSON cuando quieras.»

## Precios
- Interno: **US$0** (herramienta propia).
- Comercialización futura: **sin definir** (no ofrecer).

## Objeciones

| Objeción | Respuesta |
|---|---|
| «¿Y si pierdo los datos?» | Exportas un JSON cuando quieras a `respaldos/` y a git; importar restaura todo. |
| «¿Sube mi info a internet?» | No: vive en tu navegador; sin servidores ni nube (decisión explícita). |
| «¿Por qué no mi app del banco?» | Las apps ven una cuenta; aquí ves todas, con clasificación propia y alertas de servicios/rentas. |
| «¿Se actualiza solo?» | Captura con suggest en 3 segundos; gastos de herramientas se refrescan con un .bat; el resto es una rutina de 2 minutos al día. |

## Script (preguntas clave)
1. ¿En cuántas cuentas y tarjetas mueves tu dinero?
2. ¿Cuántos servicios recurrentes pagas al mes y cuántos te han llegado con recargo por atraso?
3. ¿Qué tanto te toma cerrar el mes en tu hoja actual?

## Cierre
«Ábrelo desde el menú, captura el último gasto que hiciste y mira tu proyección. Si en 5 minutos no lo ves más claro que tu hoja, no lo usemos.»

## Qué NO prometer
- Rendimiento financiero, ahorro garantizado ni asesoría fiscal.
- Sincronización multi-dispositivo en tiempo real (el respaldo es manual por diseño).
- Alertas automáticas push (hoy son visuales en la pestaña Alertas).
