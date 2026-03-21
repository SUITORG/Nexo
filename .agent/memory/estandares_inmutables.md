# 🛡️ Estándares Inmutables del Proyecto (Guardrails)

Este archivo es la **Única Fuente de Verdad** para el orquestador (IA). Estas reglas **NO deben ser modificadas ni ignoradas** bajo ninguna circunstancia, a menos que el usuario lo solicite explícitamente. Antes de cualquier edición de UI o lógica estructural, la IA debe consultar este archivo.

## 1. estandar-landing
- **Descripción**: Estructura integral de la Landing Page que incluye Barra de Estado, Hero/SEO Body y Footer Institucional.
- **Header**: Debe ser responsivo con menú hamburguesa (`#menu-toggle`) en móvil, permitiendo acceso siempre a la sección Staff y navegación pública.
- **Barra de Estado**: Identificador `BS`, versión, nivel de acceso y créditos. Solo visible para STAFF.

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
- **Identidad Visual**: Productos "NUEVO" o en "OFERTA" deben portar una barra de color distintiva en la esquina superior izquierda (Público y Staff). En el monitor **STAFF-POS (Caja)** y vista interna, es obligatorio mostrar el stock numérico disponible. Queda **ESTRICTAMENTE PROHIBIDO** mostrar el stock numérico en la landing page pública (visitantes) para mantener un diseño limpio y enfocado a la venta.
- **Integridad de Checkout y Caja (100% Error-Free)**: El flujo de cierre de venta debe ser infalible. Cualquier cambio en el POS debe validar el flujo completo: 1. Compra (Cápsula visible y total operativo) -> 2. Datos y Pagos (Modal obligatorio) -> 3. Transacción Atómica (Orden, Lead y Stock). La operación de Caja debe ser clara, auditada y sin ambigüedades. Queda prohibido ocultar la cápsula de carrito para el usuario público.

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
- **Mandato**: Pese a compartir tablas físicas, NINGUNA empresa debe tener acceso visual o técnico a la información, reportes o permisos de otra empresa.
- **Validación**: Cada query debe portar el token de `id_empresa` y el backend debe filtrar estrictamente por este ID.

## 9. Resiliencia del Monitor POS (Operación de Alimentos)
- **Normalización de Estados**: Todos los componentes de UI deben usar una constante unificada (ej. `orderStatus`) que verifique secuencialmente los campos `estatus`, `status` y `estado` de la base de datos para garantizar la visibilidad de botones de acción.
- **Inyección Inicial**: Todo pedido nuevo (Web u OTS) DEBE ser inyectado con el estado `PEDIDO-RECIBIDO` en el momento del checkout. Queda estrictamente prohibido crear registros de proyectos sin estado inicial definido.
- **Seguridad de Renderizado**: Se prohíbe la redeclaración de variables de scope (ReferenceError/SyntaxError) dentro de los bucles `forEach` del monitor. Cualquier error de renderizado debe ser capturado por un bloque `try/catch` que muestre una alerta visual sin bloquear el sistema completo.
- **Trazabilidad de Depuración**: Cada tarjeta de pedido en el monitor STAFF debe portar un identificador de depuración invisible o sutil que muestre el estado crudo detectado y el tipo de canal (OTS/Local).

## 10. Control de Permisos Monitor POS (RBAC Operativo v4.7.8)
- **Principio**: La visibilidad y capacidad de acción en el Monitor POS se rige por `nivel_acceso` e `id_rol`. 
- **Contadores Atómicos**: Los botones de filtro deben mostrar el conteo de pedidos del día entre paréntesis.
- **Perfiles Operativos**:
    - **ADMIN / DIOS (Nivel >= 10)**: Visibilidad total y acciones completas.
    - **OPERATIVO / CAJERO (Nivel >= 2 y Rol != REPARTIDOR)**: Flujo omnidireccional (COCINAR, LISTO, RUTA, ENTREGAR). Pueden revertir estados para correcciones.
    - **REPARTIDOR (Rol == DELIVERY)**: Visibilidad de pedidos "LISTO" y "CAMINO". Acciones: Puede activar [RUTA] (para marcar salida) y [ENTREGAR] (dispara validación OTP). No puede cocinar ni revertir.
- **Blindaje de Contacto**: Todo pedido debe inyectar dirección y teléfono tanto en campos dedicados como en el campo `descripcion` para garantizar su visibilidad en el Monitor POS independientemente de la estructura de la tabla.

## 11. Estándar de Feedback en Login
- **Principio**: El usuario debe recibir mensajes claros (Warnings) sobre por qué falló su acceso para evitar frustración y tickets innecesarios.
- **Mensajes Obligatorios**:
    - **⚠️ ACCESO EXPIRADO (Fecha)**: Se dispara si la `fecha_limite_acceso` es menor al día de hoy.
    - **⚠️ Usuario en otra empresa**: Se dispara si el usuario existe en la DB global pero no está asignado al `id_empresa` desde el que intenta loguearse (Hub/Orbit).
    - **❌ Contraseña incorrecta**: Solo si el usuario y empresa coinciden pero la clave no.
- **Inmutabilidad**: Este flujo de permisos no se altera entre sucursales para garantizar la seguridad de la entrega y la trazabilidad de la cocina.

## 11. Sincronización Atómica de Versiones (Triple Check)
- **Mandato**: Es **obligatorio e inmutable** que cualquier cambio de versión en `backend_schema.gs` sea replicado **en el mismo turno** en las siguientes ubicaciones para evitar disparidad visual o funcional:
    1.  `backend_schema.gs` (Constante `CONFIG.VERSION` y Cabecera).
    2.  `js/modules/core.js` (Constante `app.version` y Cabecera).
    3.  `roadmap.md` e `index.html` (Cache busting y bitácora).
- **Control**: La Barra de Estado (`BS`) brillará en amarillo si desaparece esta sincronización. No se permite dejar versiones asíncronas entre Frontend y Backend.

## 12. Privacidad de Código de Entrega (Anti-Fraude OTP)
- **Descripción**: Blindaje del código OTP en el Monitor POS.
- **Mandato**: 
    - **Staff/Cajero/Admin**: Ven el código OTP visible para informar o validar al cliente.
    - **Repartidor (Delivery)**: Ve el código **DIFUMINADO**. Debe solicitarlo físicamente al cliente para la entrega.
- **Propósito**: Garantizar que el repartidor realice la entrega presencial mientras el staff mantiene control de soporte.

## 13. Restricción de Fecha en Monitor POS (Protocolo HOY)
- **Descripción**: El monitor POS es para la operación viva inmediata.
- **Mandato**: **Nadie** (incluyendo Delivery) puede ver pedidos de fechas anteriores en el monitor POS. El filtro de fecha es **estrictamente hoy** para todos los roles.
- **Fundamento**: Reducir carga cognitiva del staff y asegurar que los repartidores se enfoquen en la producción del turno actual.
- **Histórico**: Cualquier consulta de días anteriores se realiza por reportes, no por el monitor activo.

## 14. Blindaje Universal de Imágenes (fixDriveUrl)
- **Descripción**: Garantizar la visualización de imágenes almacenadas en Google Drive o cualquier origen externo.
- **Mandato**: Es **obligatorio** pasar toda URL de imagen por la función centralizadora `app.utils.fixDriveUrl()` antes de inyectarla en el `src` de cualquier elemento `<img>` o `backgroundImage`.

## 15. Persistencia de Contacto en Proyectos
- **Descripción**: Asegurar que los datos de entrega (dirección y teléfono) sean visibles en el monitor POS sin depender exclusivamente de tablas externas.
- **Mandato**: Todo pedido generado vía `checkout` o `checkoutStaff` debe inyectar **obligatoriamente** los campos `direccion` y `telefono` dentro del objeto `project` antes de enviarlo al backend. Esto garantiza que el personal de cocina y entrega vea la información directamente en la tarjeta del pedido.

## 16. Protocolo de Feedback Auditivo (v4.7.0)
- **Notificación de Orden**: Se debe usar exclusivamente un sonido de **campanilla suave** (`bell-ringing-05.mp3`). Queda prohibido el uso de sonidos estridentes o de tipo "alerta" genérica.
- **Interacción Universal**: Todo elemento interactivo (botones, enlaces, burbujas) debe disparar la función `app.utils.playClick()` para confirmar la acción al usuario mediante un sonido de clic táctil suave.

## 17. Protocolo de Integridad POS/Express (Visitante)
- **Reinicio por Inactividad**: Todo usuario no identificado (Visitante) que permanezca inactivo por más de **5 minutos (300s)** en cualquier sección diferente al Hub, debe ser redirigido automáticamente a `#orbit` con una recarga de limpieza (`location.reload()`) para garantizar que el siguiente usuario encuentre un estado limpio.
- **Transparencia de Total**: Al limpiar el carrito (`clearCart`) o si este está vacío, el total visual de la aplicación **DEBE** marcar estrictamente `$0.00`, ignorando cualquier cargo por envío configurado, para evitar confusión en el usuario.

## 18. Estándar RESPONSIVE-UI (v1.0.0)
- **Principio**: Todo desarrollo visual debe regirse por el archivo `RESPONSIVE-UI.css`.
- **Mandatos**:
    - **Tipografía**: Usar exclusivamente variables `clamp()` (ej. `--font-size-h1`) para asegurar legibilidad sin overrides manuales constantes.
    - **Layout**: Priorizar `.ui-grid` sobre floats o posiciones absolutas.
    - **Overlays**: Usar `.ui-overlay-full` con gradientes de contraste para asegurar que el texto sea legible sobre cualquier imagen (especialmente en Marca Personal).
    - **Responsividad**: Las flechas de carrusel/galería deben ubicarse en los bordes absolutos de la pantalla para facilitar la interacción táctil y en PC.
- **Inmutabilidad**: Queda prohibido hardcodear anchos fijos en píxeles (ej: `width: 450px`) para componentes principales; siempre usar porcentajes, `vw` o `clamp`.
