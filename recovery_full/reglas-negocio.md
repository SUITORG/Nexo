# Reglas de Negocio - SuitOrg (PFM / EVASOL)
> **Versión:** 1.1.0 | **Fecha:** 2026-01-29

Este documento centraliza las políticas operativas y lógicas del sistema para asegurar la consistencia multi-inquilino.

## 1. Ciclo de Vida del Sitio (SaaS)
*   **Persistencia Visual:** El sitio/landing permanecerá accesible para el público incluso si la cuota del negocio ha expirado.
*   **Control de Operación:** La habilitación o deshabilitación total de un negocio se controla exclusivamente mediante el campo `habilitado` (TRUE/FALSE) en la tabla `Config_Empresas`.
*   **Cuotas vs. Acceso:** Las cuotas registradas en `Cuotas_Pagos` son de carácter administrativo y para auditoría del Superusuario (DIOS). No bloquean el renderizado del front-end automáticamente a menos que se defina lo contrario en fases futuras.

## 2. Aislamiento Multi-Inquilino (Multi-Tenant)
*   **Filtrado Estricto:** Toda consulta al backend debe incluir el `id_empresa`. El servidor filtrará los datos para que ningún negocio vea la información de otro.
*   **Datos Globales:** Las tablas marcadas como "GLOBAL" solo pueden ser modificadas por el usuario DIOS de SuitOrg.

## 3. Roles y Permisos (RBAC)
*   **DIOS (Lvl 999):** Control total, visión consolidada de cuotas y mantenimiento global.
*   **ADMIN (Lvl 10):** Gestión total de su propia empresa, catálogo y reportes. Puede ver su propio estatus de cuota con OTP visible.
*   **STAFF / CAJERO (Lvl 5):** Operación de punto de venta, monitor de pedidos y atención al cliente. 
    *   **Visibilidad OTP:** Ve el código OTP en **TODAS** las etapas (Nuevos, Cocina, Listo) para informar al cliente o control interno.
*   **DELIVERY / REPARTIDOR:** 
    *   **Visibilidad Extendida:** Puede navegar por todas las pestañas para anticipar carga de trabajo, pero solo puede accionar entregas en la pestaña "LISTO-ENTREGA".
    *   **Privacidad de Código (Escudo visual):** El OTP se muestra difuminado (Blur) o protegido. Debe solicitarlo físicamente al cliente final para completar la entrega en el sistema.

## 4. Gestión de Pagos y Checkout
*   **Nomenclatura Estándar:** El término oficial para pagos en efectivo al recibir es **"Contra Entrega"**.
*   **Generación de OTP:** El código de entrega (OTP) se genera automáticamente para toda orden de alimentos (Food Hub) al momento del checkout.
*   **Visibilidad Financiera:** Todas las tarjetas de pedido en el monitor POS muestran el **Total a Cobrar** de forma destacada para asegurar el flujo de caja.

## 5. Integridad Operativa
*   **Stock:** Cada venta confirmada en el POS debe descontar stock real en el backend de forma atómica.
*   **Folios:** Cada orden genera un folio corto secuencial (ej. #101) para facilitar la comunicación operativa.
*   **Flujo WhatsApp:** El mensaje final de ticket incluye una instrucción en **negritas** resaltando la necesidad de enviar el resumen para agilizar el proceso.
## 6. Estándar de Identificadores (Regla Inmutable)
*   **Catálogo**: `PROD-XX` (Autoincremental por empresa).
*   **Proyectos / Órdenes**: `ORD-XXX` (Folio secuencial).
*   **Leads**: `LEAD-XXX` (Folio secuencial centralizado).

---
**Nota:** El sistema ignorará cualquier ID generado localmente para Leads nuevos y asignará el folio `LEAD-XXX` oficial al momento de la inserción en el servidor.
