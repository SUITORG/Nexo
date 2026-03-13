# 🛡️ Estándares Inmutables del Proyecto (Guardrails)

Este archivo es la **Única Fuente de Verdad** para el orquestador (IA). Estas reglas **NO deben ser modificadas ni ignoradas** bajo ninguna circunstancia, a menos que el usuario lo solicite explícitamente. Antes de cualquier edición de UI o lógica estructural, la IA debe consultar este archivo.

## 1. estandar-landing
- **Descripción**: Estructura integral de la Landing Page que incluye Barra de Estado, Hero/SEO Body y Footer Institucional.
- **Barra de Estado**: Identificador `BS-T`, versión, nivel de acceso y créditos. Solo visible para STAFF.
- **Cuerpo (Body)**: Hero Banner dinámico de alto impacto y Matriz SEO (Long-tail) obligatoria de alta resiliencia.
- **Footer**: Barra única negra (`#0F0F0F`) con enlaces inyectados y logos sociales con colores corporativos al hover.
- **Inactividad**: Modales del footer activan timer de 30-45s para retorno automático a `#home`.

## 2. estandar-crud
- **Descripción**: Estructura base para tablas de gestión (Leads, Proyectos, Catálogo).
- **Exportación**: DEBE incluir botones de exportación a **PDF** y **VTS** (Tab-Separated).
- **Seguridad**: La eliminación de registros está restringida a Nivel 10 (Admin).

## 3. Prioridad de Rendimiento (PFM)
- En temas de comida (isFood), las tarjetas deben ser compactas (132px) y priorizar la navegación por pestañas de categorías sobre el scroll infinito.

## 4. estandar-operacion
- **Descripción**: Lógica de negocio y flujo de datos según el tipo de empresa.
- **Inmutabilidad**: Una vez validada la operación (Alimentos, Logística, Proyectos), no se permiten cambios estructurales en el flujo de guardado.
- **Venta Express/POS**: Debe grabar obligatoriamente en `Leads`, `Proyectos` y descontar stock en `Catalogo`.
- **Interactividad**: En giros de alimentos, los botones `(+)` y `(-)` deben ser accesibles para el usuario público en todo momento.
- **Identidad Visual**: Productos "NUEVO" o en "OFERTA" deben portar una barra de color distintiva en la esquina superior derecha.
- **Notificaciones**: El mensaje de WhatsApp debe seguir estrictamente el formato definido en `.agent/workflows/orden-whatsapp.md`, asegurando que el total y el ID de orden nunca falten. Los supervisores en POS deben recibir alertas visuales de nuevos pedidos externos sincronizados cada 30 segundos.
- **Integridad de Checkout (3 Pasos)**: Cualquier cambio en el POS debe validar el flujo: 1. Compra (Cápsula visible y total operativo) -> 2. Datos y Pagos (Modal obligatorio) -> 3. WhatsApp (Clean up). Queda prohibido ocultar la cápsula de carrito para el usuario público.

## 5. estandar-creditos
- **Descripción**: Control de acceso y consumo de recursos para el personal STAFF.
- **Validación al Login**: El orquestador debe asegurar que el sistema verifique obligatoriamente la vigencia de acceso (`fecha_limite_acceso`) y el saldo de créditos (`creditos_totales` o `creditos_usuario`) antes de permitir el ingreso a módulos protegidos.
- **Bloqueo Preventivo**: Si los créditos son <= 0 o la fecha de vencimiento ha pasado, el acceso debe ser denegado con un mensaje de alerta. No se permiten accesos de staff "en blanco" o sin validación de saldo.

## 6. Orquestación y Mantenimiento
- El orquestador debe validar la existencia de estos elementos tras cada actualización significativa mediante el uso de herramientas de búsqueda (`grep_search`) o inspección visual.
- Queda prohibido dejar "workflows sueltos" o reglas sin documentar en el `roadmap.md`.
- El flujo de operación se rige por el archivo `.agent/workflows/estandar-operacion.md`.

## 7. Regla de Oro: Codificación UTF-8
- **Descripción**: Estándar de comunicación y datos para todo el sistema multi-inquilino.
- **Mandato**: Siempre configura todo (Base de datos, Script y HTML) en UTF-8 para que todos hablen el mismo "alfabeto".
- **Garantía de Integridad**:
    - Forzar la salida de texto exclusivamente en formato UTF-8.
    - Normalizar el texto eliminando caracteres de control invisibles o 'mojibake'.
    - Asegurar que tildes y la letra 'ñ' estén correctamente codificadas.
    - Limpiar datos de entrada extraños antes de procesarlos.
- **Prohibición**: No usar scripts externos (.py) para corregir encoding; la corrección debe ser nativa y preventiva en el flujo de datos.
## 8. Aislamiento Multi-Inquilino Absoluto
Mandato: Pese a compartir tablas físicas, NINGUNA empresa debe tener acceso visual o técnico a la información, reportes o permisos de otra empresa.
Validación: Cada query debe portar el token de id_empresa y el backend debe filtrar estrictamente por este ID.
## 9. Resiliencia del Monitor POS (Operación de Alimentos)
Normalización de Estados: Todos los componentes de UI deben usar una constante unificada (ej. orderStatus) que verifique secuencialmente los campos estatus, status y estado de la base de datos para garantizar la visibilidad de botones de acción.
Inyección Inicial: Todo pedido nuevo (Web u OTS) DEBE ser inyectado con el estado PEDIDO-RECIBIDO en el momento del checkout. Queda estrictamente prohibido crear registros de proyectos sin estado inicial definido.
Seguridad de Renderizado: Se prohíbe la redeclaración de variables de scope (ReferenceError/SyntaxError) dentro de los bucles forEach del monitor. Cualquier error de renderizado debe ser capturado por un bloque try/catch que muestre una alerta visual sin bloquear el sistema completo.
Trazabilidad de Depuración: Cada tarjeta de pedido en el monitor STAFF debe portar un identificador de depuración invisible o sutil que muestre el estado crudo detectado y el tipo de canal (OTS/Local).
## 10. Control de Permisos Monitor POS (RBAC Operativo)
Principio: La visibilidad y capacidad de acción en el Monitor POS (view-pos) se rige estrictamente por nivel_acceso e id_rol. Queda prohibido el uso de nombres de usuario o parches para determinar permisos.
Perfiles Operativos:
ADMIN (Nivel >= 10): Visibilidad de todos los filtros y todas las acciones de cambio de estado.
OPERATIVO / CAJERO (Nivel >= 5 y Rol != REPARTIDOR): Visibilidad de todos los filtros. Acciones: Flujo omnidireccional (v4.7.5). Pueden avanzar pedidos ([COCINAR], [LISTO]) y revertirlos si es necesario para correcciones. Entrega permitida solo para pedidos locales (sin dirección).
REPARTIDOR (Rol == DELIVERY / REPARTIDOR): Visibilidad restringida exclusivamente al filtro "LISTOS". Acción: [ENTREGAR] con validación OTP para pedidos OTS/Domicilio.
Blindaje de Contacto: Todo pedido debe inyectar dirección y teléfono tanto en campos dedicados como en el campo descripcion para garantizar su visibilidad en el Monitor POS independientemente de la estructura de la tabla.
Inmutabilidad: Este flujo de permisos no se altera entre sucursales para garantizar la seguridad de la entrega y la trazabilidad de la cocina.
## 11. Sincronización Atómica de Versiones (Triple Check)
Mandato: Es obligatorio e inmutable que cualquier cambio de versión en 
backend_schema.gs
 sea replicado en el mismo turno en las siguientes ubicaciones para evitar disparidad visual o funcional:
backend_schema.gs
 (Constante CONFIG.VERSION y Cabecera).
js/modules/core.js
 (Constante app.version y Cabecera).
roadmap.md e index.html (Cache busting y bitácora).
Control: La Barra de Estado (BS) brillará en amarillo si desaparece esta sincronización. No se permite dejar versiones asíncronas entre Frontend y Backend.
## 12. Privacidad de Código de Entrega (Anti-Fraude OTP)
Descripción: Blindaje del código OTP en el Monitor POS.
Mandato:
Staff/Cajero/Admin: Ven el código OTP visible para informar o validar al cliente.
Repartidor (Delivery): Ve el código DIFUMINADO. Debe solicitarlo físicamente al cliente para la entrega.
Propósito: Garantizar que el repartidor realice la entrega presencial mientras el staff mantiene control de soporte.
## 13. Restricción de Fecha en Monitor POS (Protocolo HOY)
Descripción: El monitor POS es para la operación viva inmediata.
Mandato: Nadie (incluyendo Delivery) puede ver pedidos de fechas anteriores en el monitor POS. El filtro de fecha es estrictamente hoy para todos los roles.
Fundamento: Reducir carga cognitiva del staff y asegurar que los repartidores se enfoquen en la producción del turno actual.
Histórico: Cualquier consulta de días anteriores se realiza por reportes, no por el monitor activo.
## 14. Blindaje Universal de Imágenes (fixDriveUrl)
Descripción: Garantizar la visualización de imágenes almacenadas en Google  Drive o cualquier origen externo.
Mandato: Es obligatorio pasar toda URL de imagen por la función centralizadora app.utils.fixDriveUrl() antes de inyectarla en el src de cualquier elemento <img> o backgroundImage.
## 15. Persistencia de Contacto en Proyectos
Descripción: Asegurar que los datos de entrega (dirección y teléfono) sean visibles en el monitor POS sin depender exclusivamente de tablas externas.
Mandato: Todo pedido generado vía 
checkout
 o 
checkoutStaff
 debe inyectar obligatoriamente los campos direccion y telefono dentro del objeto project antes de enviarlo al backend. Esto garantiza que el personal de cocina y entrega vea la información directamente en la tarjeta del pedido.
## 16. Protocolo de Feedback Auditivo (v4.7.0)
Notificación de Orden: Se debe usar exclusivamente un sonido de campanilla suave (bell-ringing-05.mp3). Queda prohibido el uso de sonidos estridentes o de tipo "alerta" genérica.
Interacción Universal: Todo elemento interactivo (botones, enlaces, burbujas) debe disparar la función app.utils.playClick() para confirmar la acción al usuario mediante un sonido de clic táctil suave.
## 17. Protocolo de Integridad POS/Express (Visitante)
Reinicio por Inactividad: Todo usuario no identificado (Visitante) que permanezca inactivo por más de 5 minutos (300s) en cualquier sección diferente al Hub, debe ser redirigido automáticamente a #orbit con una recarga de limpieza (location.reload()) para garantizar que el siguiente usuario encuentre un estado limpio.
Transparencia de Total: Al limpiar el carrito (
clearCart
) o si este está vacío, el total visual de la aplicación DEBE marcar estrictamente $0.00, ignorando cualquier cargo por envío configurado, para evitar confusión en el usuario.
## 18. Mandato de Integridad Contable (Doble Escritura)
- **Descripción**: Para garantizar la transparencia y el reporte histórico, todo pago procesado debe registrarse en dos destinos simultáneamente.
- **Mandato**: Queda estrictamente prohibido omitir la escritura en la tabla **Pagos** al procesar una orden. El orquestador DEBE asegurar la doble llamada en el backend: `Proyectos_Pagos` (Operativo) y `Pagos` (Contable).
- **Lección Aprendida**: No sacrificar la visibilidad histórica por "optimización" de velocidad; la integridad de la base de datos es prioritaria sobre la reducción de latencia.