# Manual de Operación POS, POS/Express y OTS (SuitOrg) v4.6.8

Este documento define la lógica operativa "de oro" para el sistema de punto de venta y pedidos web. No debe modificarse sin una validación técnica exhaustiva.

## 1. Ciclo de Pedidos Web (OTS)
El flujo está diseñado para garantizar trazabilidad y control total:
1.  **RECIBIDO (Fase Nueva)**: El pedido entra con estatus `PEDIDO-RECIBIDO`. Se genera un **Folio Corto** (ej. #180) y un **Código OTP**. El cliente recibe confirmación destacada en pantalla y por WhatsApp.
2.  **COCINAR (Fase Staff)**: El personal de cocina cambia el estatus a `EN-COCINA`. El pedido se mueve a la pestaña "En Cocina". 
3.  **LISTO (Fase Staff)**: Al terminar, se cambia a `LISTO-ENTREGA`. El pedido se mueve a la pestaña "Listos".
4.  **REPARTO (Fase Delivery)**: 
    *   **Domicilio/Web**: El Repartidor ve la dirección y el **Total a Cobrar** claramente en la tarjeta. Solo el Repartidor (o Admin) puede accionar el botón de **"Verificar y Entregar"**.
5.  **FINALIZACIÓN**: Se requiere el código OTP del cliente. El personal de Staff puede verlo en texto claro si el cliente lo pierde, pero el Repartidor lo ve protegido (Blur).

## 2. Reglas de Negocio Operativas
-   **Pago Contra Entrega**: Es el método por defecto para envíos. El botón indica claramente "Contra Entrega" para evitar confusiones.
-   **Montos Visibles**: El total de la orden se muestra en un recuadro amarillo brillante en el monitor para evitar errores en el cobro final.
-   **Instrucción WhatsApp**: Al finalizar la compra, el sistema muestra en **negritas** la indicación de enviar el resumen para mayor agilidad.

## 3. Roles y Restricciones (RBAC Operativo)
### 👨‍🍳 Staff / Cajero (OPERATIVO)
-   **Control Total**: Ve el código OTP en las tarjetas en todo momento (Fondo naranja) para auxiliar al cliente o cocina.
-   **Entregas Locales**: Encargado de marcar como entregados los pedidos de pickup.

### 🛵 Repartidor (DELIVERY / REPARTIDOR)
-   **Navegación Libre**: Puede consultar cualquier pestaña de estatus.
-   **Escudo de Seguridad**: Ve el campo OTP difuminado. Debe solicitarlo físicamente al cliente para presionar el botón de entrega.
-   **Información de Cobro**: Tiene visibilidad del monto total y el teléfono/dirección en texto plano.

## 4. Estándares Visuales y UX
-   **Compactación**: La interfaz de checkout ha sido optimizada disminuyendo espacios en un 50% para mayor eficiencia en dispositivos móviles.
-   **Sync Indicator**: El sistema muestra la versión (v4.6.8) para asegurar que todos los usuarios operan en el mismo canal.

---
*Última actualización: 2026-01-29 | Versión del Sistema: v4.6.8*
