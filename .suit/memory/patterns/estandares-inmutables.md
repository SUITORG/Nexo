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
- **Identidad Visual**: Productos "NUEVO" o en "OFERTA" deben portar una barra de color distintiva en la esquina superior izquierda (Público y Staff). En el monitor STAFF-POS (Caja) y vista interna, es obligatorio mostrar el stock numérico disponible. Queda ESTRICTAMENTE PROHIBIDO mostrar el stock numérico en la landing page pública.
- **Integridad de Checkout y Caja (100% Error-Free)**: El flujo de cierre de venta debe ser infalible. Queda prohibido ocultar la cápsula de carrito para el usuario público.

## 5. estandar-creditos
- **Descripción**: Control de acceso y consumo de recursos para el personal STAFF.
- **Validación al Login**: Verificar obligatoriamente vigencia de acceso (`fecha_limite_acceso`) y saldo de créditos antes de permitir ingreso.
- **Bloqueo Preventivo**: Si créditos <= 0 o vencimiento pasado, denegar acceso con alerta.

## 6. Orquestación y Mantenimiento
- El orquestador debe validar la existencia de estos elementos tras cada actualización significativa.
- Queda prohibido dejar "workflows sueltos" o reglas sin documentar en el `roadmap.md`.

## 7. Regla de Oro: Codificación UTF-8
- **Mandato**: Siempre configura todo en UTF-8.
- **Garantía**: Forzar salida UTF-8, normalizar texto, asegurar tildes y 'ñ', limpiar datos de entrada.
- **Prohibición**: No usar scripts externos (.py) para corregir encoding.

## 8. Aislamiento Multi-Inquilino Absoluto
- **Mandato**: Ninguna empresa debe tener acceso a datos de otra empresa.
- **Validación**: Cada query debe portar `id_empresa` y el backend filtrar por este ID.

## 9. Resiliencia del Monitor POS
- Usar constante unificada `orderStatus` que verifique `estatus`, `status` y `estado`.
- Todo pedido nuevo DEBE inyectarse con estado `PEDIDO-RECIBIDO`.
- Prohibida redeclaración de variables en bucles `forEach` del monitor.
- try/catch obligatorio en renderizado.

## 10. Control de Permisos Monitor POS (RBAC Operativo)
- ADMIN/DIOS (>=10): visibilidad total.
- OPERATIVO/CAJERO (>=2, rol != REPARTIDOR): flujo omnidireccional.
- REPARTIDOR (rol DELIVERY): solo LISTO/CAMINO, puede RUTA y ENTREGAR (con OTP).
- Inyectar dirección y teléfono en `descripcion` como respaldo.

## 11. Estándar de Feedback en Login
- Mensajes claros: ACCESO EXPIRADO, Usuario en otra empresa, Contraseña incorrecta.

## 12. Sincronización Atómica de Versiones
- Cualquier cambio de versión en `backend_schema.gs` debe replicarse en: `core.js`, `roadmap.md`, `index.html`.

## 13. Privacidad de Código de Entrega (OTP)
- Staff/Cajero/Admin: ven OTP visible.
- Repartidor: ve código DIFUMINADO.

## 14. Restricción de Fecha en Monitor POS
- Nadie puede ver pedidos de fechas anteriores en el monitor. Filtro estrictamente hoy.

## 15. Blindaje Universal de Imágenes
- Toda URL de imagen debe pasar por `app.utils.fixDriveUrl()` antes de inyectarse.

## 16. Persistencia de Contacto en Proyectos
- Inyectar `direccion` y `telefono` en el objeto `project` antes de enviar al backend.

## 17. Protocolo de Feedback Auditivo
- Notificación: campanilla suave (`bell-ringing-05.mp3`).
- Interacciones: `app.utils.playClick()`.

## 18. Protocolo de Integridad POS/Express (Visitante)
- Inactividad >5min: redirigir a `#orbit` con `location.reload()`.
- Carrito vacío: total debe marcar `$0.00`.

## 19. Estándar RESPONSIVE-UI
- Tipografía: variables `clamp()`.
- Layout: `.ui-grid` sobre floats/absolutas.
- Overlays: `.ui-overlay-full` con gradientes.
- Prohibido hardcodear anchos fijos en píxeles para componentes principales.
