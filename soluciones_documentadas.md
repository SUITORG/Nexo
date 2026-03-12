# 🛠️ Soluciones Documentadas (Bitácora de Errores y Mejoras)

## [2026-02-04 19:15] - Error de Monitor POS y Datos de Contacto
**Problema:**
1. Los Cajeros (Staff) no podían interactuar con los botones de cambio de estado en el monitor POS.
2. Los pedidos de usuarios visitantes no mostraban dirección ni teléfono en el monitor, apareciendo como "Entrega Local".
3. Sonido de notificación estridente ("grito").
4. Falta de feedback táctil (sonido de clic) en la aplicación.

**Causa Raíz:**
1. La lógica de permisos en `getPosActionButtons` no normalizaba el estado a mayúsculas y tenía comprobaciones restrictivas que fallaban ante variaciones de texto en la base de datos.
2. El objeto `project` enviado al backend no incluía los campos `direccion` y `telefono`, aunque estos existieran en el `lead`. El monitor consultaba directamente la tabla de proyectos.
3. El archivo `core.js` usaba una URL de audio de alerta genérica.
4. No existía un listener global para eventos de clic vinculados a la función `playClick`.

**Solución Implementada:**
1. **Normalización RBAC:** Se añadió `.toUpperCase()` a los estados en `pos.js` y se flexibilizó la detección de palabras clave como "COCINA", "CAMINO" o "RUTA".
2. **Persistencia Directa:** Se modificó la función `checkout` en `pos.js` para inyectar `direccion` y `telefono` directamente en el payload del objeto `project`.
3. **Optimización de Audio:**
   - Se cambió la notificación a `bell-ringing-05.mp3` (Campanilla).
   - Se configuró un listener global en `events.js` que dispara `app.utils.playClick()` al detectar clics en botones, enlaces, burbujas o elementos con `cursor: pointer`.
4. **Blindaje de Estándares:** Se añadieron los puntos 15 y 16 a `estandares_inmutables.md` para evitar regresiones.

**Estado:** ✅ SOLUCIONADO

## [2026-02-04 20:45] - Error de Total en Carrito Vacío y Falta de Reset por Inactividad
**Problema:**
1. Al limpiar el carrito ("Limpiar"), el total visual seguía mostrando el costo de envío (ej. $30.00) en lugar de $0.00.
2. Los visitantes permanecían en secciones privadas o de pedido indefinidamente, lo que permitía que el siguiente usuario viera selecciones previas.

**Causa Raíz:**
1. La función `updateCartVisuals` sumaba el `deliveryFee` siempre que el método fuera "DOMICILIO", sin verificar si había productos en el carrito.
2. No existía un timeout de inactividad para usuarios sin sesión activa (Public).

**Solución Implementada:**
1. **Lógica de Total Atómico:** Se modificó `pos.js` para que si `count === 0`, el total sea forzosamente `0`, ignorando cualquier recargo.
2. **Watchdog de Visitante:** Se extendió el monitor de `app.js` para detectar inactividad de más de 300 segundos en usuarios públicos, disparando un reset completo a `#orbit` vía `location.reload()`.
3. **Estandarización:** Se creó el **Estándar Inmutable #17** para proteger este comportamiento.

**Estado:** ✅ SOLUCIONADO

## [2026-02-04 21:05] - Fallos Generales: Login, Audio, Burbujas y Permisos POS
**Problema:**
1. El modal de login no se cerraba tras un inicio de sesión exitoso.
2. Sonido de notificación "tipo grito" al cambiar de empresa.
3. Burbujas del Hub usaban `foto_agente` en lugar de `logo_url`.
4. La dirección no aparecía en las tarjetas del monitor.
5. El Cajero no podía manipular los estados de los pedidos.

**Causa Raíz:**
1. Desconexión lógica entre `auth.js` y `ui.js`: `login` llamaba a una función obsoleta de `ui`.
2. El contador de órdenes externas no se sincronizaba bien entre inquilinos, disparando la notificación por defecto.
3. Prioridad incorrecta en la asignación de `bubbleImg`.
4. El backend no persistía los nuevos campos `direccion` y `telefono` en la tabla física de Proyectos.
5. Los roles y estados no estaban estandarizados en el componente de botones de acción.

**Solución Implementada:**
1. **Sincronización Auth:** Se estandarizó `id_rol` y se corrigió el llamado a `setLoggedInState` dentro de `auth.js`, asegurando el cierre del modal.
2. **Audio Pop:** Se reemplazó la campanilla por un "Pop" sutil generado por oscilador.
3. **Identidad Visual:** Se reordenó la prioridad para favorecer `logo_url` en el Hub.
4. **Resiliencia de Datos:** Se inyectó la dirección en el campo `descripcion` como respaldo y se mejoró el renderizado para detectar este formato.
5. **Flujo Omnidireccional:** Se permitió al Staff (Nivel >= 5) mover estados hacia adelante y atrás para correcciones operativas.

**Estado:** ✅ SOLUCIONADO

## [2026-02-05 10:45] - Bloqueo de Login Silencioso y Casos de Hub/Vigencia
**Problema:**
1. Los usuarios operativos (Staff) no podían ingresar al sistema a pesar de tener credenciales correctas.
2. El sistema no proporcionaba feedback claro sobre por qué fallaba el acceso (si era por contraseña, empresa o vigencia).

**Causa Raíz:**
1. **Aislamiento de Empresa:** Al intentar loguear desde el Hub (#orbit) sin empresa seleccionada, el `companyId` nulo impedía encontrar al usuario aunque existiera en la DB Global.
2. **Vigencia Expirada:** Varios usuarios tenían una `fecha_limite_acceso` superada (ej. Enero 2026), disparando el bloqueo preventivo del Estándar #5 sin notificar al usuario.

**Solución Implementada:**
1. **Warnings Descriptivos (v4.7.7):** Se modificó `auth.js` para diferenciar entre:
   - ❌ "Usuario no encontrado" vs ⚠️ "Usuario en otra empresa" (detectando si el ID existe en la DB global).
   - ⚠️ "ACCESO EXPIRADO (Fecha)" indicando explícitamente la fecha de vencimiento.
2. **Standard de Feedback:** Se añadió el **Estándar #11** a la memoria del sistema para obligar a que todo fallo de acceso sea descriptivo y no genérico.

**Estado:** ✅ SOLUCIONADO

## [2026-03-11] - Error de Carga Modular (Race Condition)
**Problema:**
Error crítico en el arranque: `Cannot read properties of undefined (reading 'renderHome')`. El sistema falla al iniciar localmente o bajo condiciones de red lenta.

**Causa Raíz:**
El orquestador (`core.js`) inicia el flujo de pintado (`applyTheme`) antes de que el navegador termine de cargar y registrar los módulos secundarios (`public.js`). 

**Solución Implementada:**
1. **Queue Boot (v6.5.3):** Se añadió en `core.js` un ciclo de espera (poll) que retarda el arranque hasta 1.5 segundos si detecta que los módulos críticos no están presentes.
2. **Guarismo de UI:** Se añadieron guardas `if (app.public)` en `ui.js` para evitar colisiones fatales.
3. **Optimización Local:** Se documentó que el protocolo `file:///` es incompatible y se forzó el uso de `localhost:3000`.

**Estado:** ✅ SOLUCIONADO
