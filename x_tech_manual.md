# Manual Técnico y Operativo - SuitOrg
> **Identidad Principal:** SuitOrg (Powered by EVASOL Engine)
- **Última Versión Estable**: v15.8.8 (PROD - Seed Fix)
- **Estado del Sistema**: Operativo con Memoria GSheets v15.8.8.
- **Total de Líneas Consolidadas**: 14,673 (Auditado 2026-03-20).

## 0. Resumen Ejecutivo (TL;DR) - Para gente con prisa ⚡
1.  **¿Qué es?** Un potente "Food Hub" multi-inquilino especializado en el sector alimenticio (Restaurantes, Snacks, Comida Rápida).
2.  **¿Cómo entro?** Usa tu `Username` y `Password`. No necesitas email.
3.  **¿Qué controlo?** 
    *   **Ventas:** Leads y prospección.
    *   **Proyectos:** "Temperatura" y avance real (%).
    *   **IA:** Agentes inteligentes que redactan y analizan por ti.
4.  **Seguridad:** Si no tienes nivel 10, no puedes borrar nada. Todo queda registrado.
5.  **Créditos:** Cada entrada consume saldo. Si ves una alerta roja en la consola... ¡Recarga!

## 1. Descripción del Sistema
SuitOrg Food Hub es un ecosistema multi-capa diseñado para la gestión integral de negocios alimenticios, optimizado para velocidad en punto de venta (POS) y pedidos express.

## 2. Reglas de Negocio

### A. Niveles de Acceso (Roles)
1.  **DIOS (Nivel 999):** Acceso total a configuraciones, mantenimiento y todos los datos. Inmune a filtros de módulos y restricciones de créditos.
2.  **ADMIN (Nivel 10):** Acceso total a la empresa asignada. Puede gestionar el Catálogo, sincronizar Drive y borrar registros (Leads/Proyectos).
3.  **SUPERVISOR (Nivel 8):** Acceso operativo extendido. Puede añadir log de bitácora y gestionar flujo de proyectos, pero no puede borrar ni editar el Catálogo.
4.  **VENTAS (Nivel 4-6):** Acceso a prospección. Puede crear Leads, consultar Catálogo (solo lectura) y usar Agentes IA si tiene nivel 5+.
5.  **STAFF (Nivel 5):** Acceso operativo base. Consume créditos por login.
6.  **PUBLIC (Nivel 0):** Acceso solo a Landing Page y formularios de contacto.

### B. Sistema de Créditos y Permisos (RBAC)
El sistema soporta dos modos de gestión de políticas configurables en `Config_Empresas`:

1.  **Modo USUARIO:** Las reglas se leen directamente de la fila del usuario en la tabla `Usuarios`.
2.  **Modo ROL:** Las reglas se centralizan en la tabla `Config_Roles`. El sistema busca el `id_rol` del usuario y aplica automáticamente sus permisos, nivel de acceso y módulos visibles.
3.  **Modo DIARIO:** Ideal para suscripciones por día. El sistema descuenta **1 crédito** la primera vez que el usuario accede en el día. Los ingresos subsecuentes durante el mismo día calendario (zona horaria del servidor) no consumen créditos adicionales.
    - **Acceso por Identificador:** Permite login mediante `Email`, `Username` o `Nombre` indiferentemente.

**Prioridad de Restricción:**
- **Fecha de Corte:** Tiene prioridad absoluta. Se calcula sumando `vigencia_dias` (desde la creación del usuario) o usando la fecha fija de la empresa.
- **Créditos:** Se descuenta **1 crédito** (Global o Individual) por acceso exitoso.
- **Módulos Visibles:** El menú de navegación y las tarjetas del Dashboard se filtran dinámicamente según lo definido en la configuración del rol.

**Seguridad de Acción (Granularidad):**
- **Nivel < 10:** Los botones de "Agregar Producto", "Sincronizar Drive" y los botones "Borrar" en tablas están ocultos.
- **Nivel >= 10:** Acceso total a botones de creación y depuración.

**Alertas de Mantenimiento:**
- **Advertencia de Saldo:** Si el saldo de créditos resultante es **<= 5**, se muestra una alerta persistente.
- **Consola de Sistema:** La barra de estado muestra alertas tipo log (`> SYSTEM_OK`, `> ERR: DB_INIT`, etc.) para monitoreo en tiempo real.

**Notas Importantes:**
- Los usuarios con rol **DIOS** tienen créditos infinitos y no descuentan del sistema.
- Si el saldo (individual o global) llega a **0**, el sistema bloquea el acceso.
- Existe una **Fecha de Vencimiento** independiente que puede bloquear el acceso total si se supera.

### C. Seguridad e Interfaz
- **Timeout:** 120 segundos de inactividad redirigen al Landing (Inicio).
- **Consola de Sistema:** Visualiza en tiempo real el estado del backend. Los errores críticos disparan un indicador rojo parpadeante.
- **Identidad:** Los visitantes son identificados con el icono de "Escudo de Seguridad" para reforzar la confianza en la plataforma.

### D. Reglas de Interfaz (UI/UX)
- **Modales Seguros:** Todo modal de captura (Leads, Productos, Proyectos) debe incluir obligatoriamente un botón de **"Cancelar / Volver"** visible, además de la 'X' de cierre.
- **Gestión de Temperatura (Avance):** El progreso de los proyectos se mide por "Fases de Negocio" configuradas en `Config_Flujo_Proyecto`. Cada fase tiene un **Peso Porcentual** que actualiza la barra de progreso de forma automática.
- **Estética:** Uso de bordes redondeados (`border-radius: 50px` en botones), colores corporativos suaves y tipografía legible.

### E. Aislamiento Multi-Inquilino Absoluto
- **Privacidad de Datos:** Pese a compartir la misma base de datos física, ninguna empresa puede acceder a la información, reportes o configuración de otra.
- **Validación de Token:** Cada consulta debe portar el `id_empresa` y el backend filtra los resultados de forma estricta para garantizar la privacidad total.

### F. Integridad de Checkout y Caja
- **Flujo 100% Error-Free:** El proceso de cierre de venta es crítico. Debe ser una transacción atómica que registre la Orden, actualice el Lead y descuente el Stock simultáneamente.
- **Transparencia en Caja:** Las operaciones de POS deben ser claras, auditadas y generar folios únicos para evitar discrepancias.

### G. Identidad Dinámica y Localización (v6.0.7)
- **Nomenclatura de Origen:** En el contexto público, se prioriza el término **"Sitio"** sobre "Hub" para mensajes de contacto, mejorando la comprensión del usuario final.
- **Parametrización Visual (QR):** La visibilidad del código QR oficial en el Banner/Hero está controlada por el campo `usa_qr_sitio` en `Config_Empresas`.
- **Branding Proxy:** Los enlaces de WhatsApp y códigos QR en la Matriz SEO heredan automáticamente el nombre y el color de tema del inquilino, eliminando menciones estáticas a la empresa matriz.

### G. Glosario de Módulos (IDs Técnicos)
Para que el sistema active correctamente el menú y el Dashboard, se deben usar exactamente estos identificadores en la columna `modulos_visibles` de la tabla `Config_Roles` o `Usuarios`:

| ID Técnico | Nombre en Interfaz | Función Principal |
| :--- | :--- | :--- |
| `dashboard` | Panel de Control | Resumen de créditos, accesos directos y estadísticas. |
| `staff-pos` | Venta (POS) / Caja | Interfaz de cobro directo para personal de ventas. |
| `pos` | Monitor de Pedidos | Control de estatus de órdenes (Nuevos, Cocina, Listos). |
| `projects` | Proyectos | Tabla de gestión de avance y temperatura de negocio. |
| `reservations` | Citas | Control de reservaciones vinculadas a Google Calendar. |
| `leads` | Gestión de Leads | Registro y seguimiento de clientes potenciales. |
| `BACKEND_MISSING_SEEDS` | Nuevos agentes o roles no se creaban si la tabla ya existía pero estaba incompleta. | Implementar lógica de "Upsert" en la inicialización para verificar registros uno por uno en lugar de solo tablas vacías. | ✅ Resuelto | 20 min |
| `SEED_LOGIC_INDEX_FAIL` | La verificación de seeds fallaba por depender de índices fijos o nombres de tabla incorrectos. | Refactorizar a función `ensureSeed` que busca dinámicamente el encabezado 'id' para insertar con precisión. | ✅ Resuelto | 15 min |
| `catalog` | Catálogo | Gestión de productos, stock y precios de oferta. |
| `catalog_add` | (Permiso) Agregar | Permite crear nuevos productos con ID correlativo. |
| `catalog_edit` | (Permiso) Editar | Permite modificar cualquier campo del producto. |
| `catalog_delete` | (Permiso) Borrar | Permite realizar borrado lógico (Ocultar). |
| `catalog_stock` | (Permiso) Stock | Permite ajustar niveles de inventario. |
| `agents` | Agentes IA | Panel de Agentes inteligentes (Gemini). |
| `home` | Inicio / Landing | Vista principal pública de la empresa seleccionada. |
| `orbit` | Orbit Hub | Interfaz de navegación entre divisiones (Burbujas). |
| `contact` | Contacto | Formulario público de captura de leads. |

**Reglas de activación:**
1. Los IDs deben escribirse en **minúsculas**.
2. Pueden separarse por comas (`,`) o espacios.
3. No utilizar el símbolo `#` (el sistema lo limpia automáticamente, pero es mejor omitirlo).
4. Si un ID es incorrecto, el módulo permanecerá oculto por seguridad.

## 3. Estructura de Datos (Tablas)

| Tabla | Descripción |
| :--- | :--- |
| **Config_Empresas** | Parámetros generales, políticas, colores, modo de créditos y Feature Toggles (`usa_features_estandar`, `usa_qr_sitio`). |
| **Config_Roles** | Definición de jerarquías, módulos visibles y vigencia por rol. |
| **Config_Flujo_Proyecto** | Definición de etapas comerciales con pesos porcentuales y colores. |
| **Usuarios** | Credenciales, roles, créditos y fechas límite. |
| **Prompts_IA** | Configuración de Agentes (Nombre, Prompt Base, Activo). |
| **Leads** | Prospectos capturados con origen y estado. |
| **Catalogo** | Productos y Servicios con control de stock y precios. |
| **Proyectos** | Control de obras vinculado a Leads. |
| **Logs** | Registro de eventos del sistema y diagnóstico de modelos Gemini. |

## 4. Agentes de Inteligencia Artificial (Gemini)
El sistema utiliza la API de Google Gemini para procesar consultas inteligentes basadas en el contexto corporativo.

### A. Acceso y Uso
- **Nivel Requerido**: Los agentes son accesibles para usuarios con **Nivel 5 (Staff)** en adelante o rol **DIOS**.
- **Ubicación**: Se encuentran en el Dashboard principal bajo la sección **"HERRAMIENTAS IA"**.
- **Funcionamiento**: Selecciona un agente (Escritor, Analista, etc.) y el sistema enviará el contexto de la empresa y los documentos sincronizados para generar una respuesta personalizada.

### B. Conocimiento (RAG)
- Los agentes "leen" los archivos que hayas subido a la carpeta de Google Drive configurada.
- **Acción Crucial**: Para que los agentes trabajen con información actualizada, debes usar el botón **"Sincronizar"** en el módulo de **Conocimiento**. Esto indexa los textos de tus PDFs y documentos para que la IA los use de referencia.

### C. Configuración Técnica
- **Modelos**: `gemini-2.0-flash` y `gemini-flash-latest` (v1beta).
- **Personalización de Comportamiento**: En la tabla `Prompts_IA` de Google Sheets, puedes editar el `prompt_base` de cada agente para cambiar su personalidad o instrucciones específicas (ej. "Escribe siempre en tono formal").
- **Autodiagnóstico y Resiliencia**: El sistema implementa una arquitectura de **Loop de Fallback Multi-modelo**. Si el modelo configurado no está disponible en la región o cuenta, el backend intentará automáticamente una lista de alternativas (`gemini-2.5-flash`, `2.0-flash`, `1.5-flash`, etc.) hasta obtener una respuesta válida.
- **Log de Recuperación**: Cada intento fallido queda registrado en la hoja `Logs` bajo el evento `AI_FALLBACK`, permitiendo al administrador identificar qué modelos están activos realmente para su API Key.

## 5. Guía de Mantenimiento
- **Registro de Errores (Logs):** Si los Agentes IA fallan, revisa la hoja `Logs`. Busca eventos `AI_FAILURE` o `DIAGNOSTIC_MODELS`. Este último muestra la lista exacta de modelos permitidos por Google para tu API Key.
- **Reset de Empresa:** Borra Leads y Proyectos. (Requiere Rol DIOS).
- **Auto-Depuración:** Mantiene solo últimos 2 meses de Logs.

## 6. Estrategias SEO Implementadas
El sistema cuenta con una arquitectura optimizada para buscadores:
- **Metadatos Dinámicos:** Título y descripción configurados para Grupo EVASOL.
- **Micro-Copy de Divisiones:** Cada una de las 8 divisiones tiene atributos `alt` y `title` enriquecidos con palabras clave industriales.
- **Clusters de Cola Larga:** Sección de "Soluciones Especializadas" con 24 frases clave (3 por división).
- **Pilares Estratégicos:** Sección dedicada a Misión, Visión, Impacto y Valores en la Landing Page para fortalecer el Branding Corporativo.

- **v2.7.0:** Implementación de "Temperatura de Negocio" (Flujo Dinámico), Consola de Sistema en tiempo real y UX de Modales mejorada (Botones de escape).
- **v2.6.5:** Unificación de RBAC (Tabla `Config_Roles`) y soporte para acceso por Username/Nombre sin Email.
## 7. Visión de Futuro: Ecosistema SuitOrg
El sistema está preparado para ramificarse en soluciones específicas según el inquilino (Tenant):
*   **Módulo POS:** Para negocios de retail o comida (Burbuja "Pollo").
*   **Módulo Pedidos/Logística:** Para distribución.
*   **Módulo Contable/Seguimiento:** Para consultorías o servicios profesionales.
*   **Interfaz Orbit:** Navegación disruptiva mediante burbujas interactivas según búsqueda del usuario.

### H. Optimización con WSL (v4.7.0)
A partir de la versión 4.7.0, el ecosistema de desarrollo se ha optimizado mediante la integración de **WSL 2 (Windows Subsystem for Linux)**.

1.  **Herramientas de Alto Rendimiento**: Se han instalado y configurado herramientas Unix-native para acelerar el análisis y gestión del código:
    *   **ripgrep (rg)**: Motor de búsqueda ultra-rápido para análisis de código a gran escala.
    *   **fd-find (fd)**: Alternativa rápida a `find` para localización de archivos en milisegundos.
    *   **zip**: Compresión nativa de alta velocidad para respaldos consistentes.
2.  **Protocolo de Respaldo WSL**: Los respaldos se generan ahora mediante un motor Linux-native, garantizando la integridad de caracteres especiales y una velocidad superior:
    *   `DATE_STR=$(date +%d%m%y); zip -r "SUIT_${DATE_STR}_WSL.zip" . -x "*/node_modules/*" "*/.git/*" "*.zip" "*/.agent/*"`

---

- **v14.1.0** (2026-03-13): **"Multi-Tenant Business & Pareto Vault"**.
    - **Pensión Inteligente:** Lanzamiento oficial de CMARJAV con branding Marina/Oro.
    - **Drive:** Implementación de despacho dinámico en `DriveManager.gs` para soporte de múltiples estructuras de negocio.
    - **Marketing:** Integración de la jerarquía Pareto (El Quién, Cómo, Qué) en la Bóveda Digital.
    - **Backend:** Actualización de lógica de Post-Action para soporte multi-inquilino granular.

- **v14.0.3** (2026-03-12): **"Gallery Precision & Identity Coordinates"**.
    - **UI:** Rediseño de galería 4x1 con 10% de aire y fondo de marca.
    - **Identity:** Anclaje de 3 puntos (Slogan, M1, M2) mediante posicionamiento absoluto sobre la foto del agente.

- **v6.2.0** (2026-03-08): **"Dynamic Content Engine (Narrativa IA)"**.
    - **Backend:** Creación de tabla `Config_Paginas` para almacenamiento de JSON estructurado (Meta, Schema, Contenido).
    - **SEO:** Inyección automática de `JSON-LD (Schema.org)` dinámico según el contexto de la página (ONG, Museo).
    - **UX:** Implementación de subpáginas dinámicas inteligentes (ej: `#museo`) que ocultan el hero-banner estándar y muestran narrativa personalizada.
    - **Parametrización:** Las empresas ahora pueden administrar su Hero, H1, H2 y botones de acción desde celdas de Excel.

- **v6.1.8** (2026-03-08): **"Secure Drive Vault & Private Token"**.
    - **Drive:** Integración con Google Drive API para creación automática de jerarquía de carpetas (Identidad, Solicitudes, Médicos).
    - **Auth:** Generación de `Vault Tokens` (TX-XXXX) para acceso seguro de clientes financieros (TopLux Finance).
    - **CRM:** Auto-creación de usuarios con nivel 1 y tokens como credenciales desde el flujo de Leads.
    - **UI:** Nueva sección "Mi Bóveda Segura" con soporte para Drag & Drop y visualización de expedientes.

- **v6.1.0** (2026-03-05): **"Calendar & Reservations Engine"**.
    - **Backend:** Integración nativa con Google Calendar API. Creación automática de calendarios por empresa.
    - **UI Pública:** Formulario de reservación dinámico y botón condicional en Hero.
    - **Staff UI:** Módulo de 'Citas' para gestión administrativa de reservas.
    - **Database:** Nueva tabla `Reservaciones` y parámetro `usa_reservaciones` en `Config_Empresas`.

- **v6.0.7** (2026-03-05): **"Dynamic Identity & QR Engine"**.
    - **SEO Matrix:** Eliminación de menciones estáticas "EVASOL". Enlaces y QR ahora heredan el nombre de la empresa actual.
    - **Localization:** Cambio de terminología "Hub" por "Sitio" por "Sitio" en mensajes de WhatsApp para mayor claridad UX.
    - **Branding:** Integración de Código QR dinámico en Banner/Hero (incluyendo Marca Personal) vinculado al `color_tema`.
    - **Config:** Parametrización de visibilidad del QR mediante la columna `usa_qr_sitio` en la tabla `Config_Empresas`.

- **v5.8.9:** Optimización responsiva del Orbit Hub (-60% móvil) y lógica jerárquica de contacto WhatsApp (SEO Proxy). Elevación de Project Ranking a Invariante de Seguridad.
- **v5.8.7:** Chat Persistence & WA Summary.
- **v5.3.6** (2026-02-22): **"Brand Hierarchy & Identity Reset"**.
    - **Branding:** Soporte para `es_principal` y `modo_sitio` (WHITE/HYBRID/HUB).
    - **UX:** Neutralización automática de Shell al entrar al Hub (Orbit).
    - **SEO:** Refinamiento de jerarquía H2/H3 para secciones administrativas.

- **v5.2.5** (2026-02-15): **"Lead Sync & Timestamps"**.
    - **Leads:** Sincronización oficial de columnas `fecha`, `nom_negocio` y `dir_comercial`.
    - **Traceability:** Implementación de timestamp completo (Fecha + Hora) en todos los registros.
    - **Analytics:** El registro de hora permite análisis de frecuencia horaria de ventas.

- **v5.2.4** (2026-02-15): **"Smart ID & Project Traceability"**.
    - **Leads:** Implementación de folios secuenciales `LEAD-XXX` centralizados en backend.
    - **Projects:** Activación de creación de proyectos con folios `ORD-XXX` y timestamps ISO.
    - **Architecture:** Creación de `backend_schema.md` como referencia técnica oficial.
    - **Cleanup:** Eliminada generación de IDs temporales basados en tiempo en el frontend.

- **v5.2.2** (2026-02-13): **"CRM Intelligence & Robust Billing"**.
    - **Frontend:** Implementación de niveles CRM (1 y 2) automáticos basados en completitud de datos.
    - **UX:** Reordenamiento de formulario de contacto con prioridad en WhatsApp.
    - **Backend Sync:** Detección de flags de facturación insensible a mayúsculas para compatibilidad universal.

- **v4.9.2** (2026-02-10): **"Health System & Auto-Purge"**.
    - **Backend:** Implementación del motor `runAutoPurge` en Google Apps Script.
    - **Logic:** Depuración quirúrgica de la tabla `Logs` según los días configurados por cada empresa.
    - **Maintainability:** Reducción automática de la huella de datos en Google Sheets.

- **v4.9.1** (2026-02-10): **"SEO Infrastructure Update"**.
    - **SEO:** Generación de `sitemap.xml` multi-inquilino.
    - **SEO:** Configuración de `robots.txt`.
    - **UX:** Implementación de Deep Linking vía parámetro `id` en la URL.
    - **Sync:** Actualización masiva de cache-busting a v4.9.1.

- **v4.9.0** (2026-02-10): **"Visual Color Refinement"**.
    - **UI:** Iconos de Redes Sociales con colores oficiales permanentes.
    - **UI:** Enlaces del footer destacados con color de acento y hover dinámico.
    - **Sync:** Actualización masiva de cache-busting a v4.9.0.

- **v4.8.9** (2026-02-09): **"UX Refinement & Mobile Fixes"**.
    - **UI:** Menú lateral reducido al 65% de ancho para mejor contexto.
    - **UX:** Auto-cierre de menú al seleccionar cualquier opción.
    - **UX:** Forzado de Grid Vertical (1-Col) en Express y Staff POS para móviles.

- **v4.8.8** (2026-02-09): **"Premium Mobile UX for Staff POS"**.
    - **UI:** Implementación de Drawer lateral para categorías y grid de 1 columna para productos en móvil.
    - **UX:** Cierre automático de menú al seleccionar y targets táctiles de 48px para operaciones sin error.
    - **Sync:** Actualización masiva de cache-busting a v4.8.8.

- **v4.8.6 (2026-02-06):** **"Accounting Integrity Restoration"**.
    - **BACKEND:** Restauración del protocolo de Doble Escritura en tablas `Pagos` y `Proyectos_Pagos`.
    - **GUARDRAIL:** Implementación del Estándar Inmutable #18 para prevenir sesgos de visibilidad histórica.
- **v4.8.5 (2026-02-06):** **"Report Consolidation & Payment Fix"**.
    - **ADMIN:** Motor de Consolidación de Reportes que une `Proyectos` y `Pagos` en una sola fuente de verdad.
    - **POS:** Reparación de selectores de interfaz para activar pagos con Tarjeta y Transferencia en Caja.
    - **UX:** Normalización de fecha local (YYYY-MM-DD) para eliminar errores de desfase UTC en reportes.
- **v4.7.5 (2026-02-04):** **"POS Integrity & RBAC Omnidirectional"**.
    - **POS:** Protocolo de inyección redundante de dirección/teléfono en descripción para visualización garantizada.
    - **UX:** Sonido "Pop" sutil generado por oscilador y limpieza de audio intrusivo en el Hub.
    - **RBAC:** Flujo omnidireccional de estados para Cajeros/Staff (Adelantar/Revertir).
    - **Stability:** Cierre automático del modal de login y normalización de roles en memoria.
- **v4.7.0 (2026-02-01):** **"WSL & High-Perf Sync"**.
    - **Performance:** Integración de WSL 2 como motor de desarrollo. Instalación de `ripgrep`, `fd` y `zip`.
    - **Architecture:** Mapeo completo de la jerarquía del Orquestador (v4.7.0) y validación de la capa de pegamento (`ui.js`).
    - **Backup:** Implementación del primer sistema de respaldos Linux-native.
- **v4.7.0 (2026-01-31):** **"Catalog CRUD & Sequential IDs"**.
    - **Backend:** IDs secuenciales por inquilino (`PROD-XX`). Borrado lógico mediante `activo = FALSE`.
    - **RBAC:** Permisos granulares de catálogo (`add`, `edit`, `delete`, `stock`).
    - **UI:** Tarjetas de producto premium con ribbons de oferta y micro-acciones CRUD integradas.
- **v4.6.9 (2026-01-30):** **"Premium Branding & UX Guard"**.
- **v4.6.7 (2026-01-29):** **"Public Module Consolidation"**.
- **v4.6.0 (2026-01-28):** **"Delivery Flow V2" (3 Steps)**. 
    - **Logic:** Introducido estado intermedio `EN-CAMINO`. El flujo ahora es: Recibido -> Cocina -> Listo -> En Camino -> Entregado.
    - **Security:** El OTP ahora solo es accesible cuando el pedido está en estado `EN-CAMINO` o superior.
    - **UI:** Implementado sistema de alertas laterales de 3 niveles (Nuevos/Listos/Fin) y nueva pestaña de filtro.
- **v4.5.2 (2026-01-28):** **"Dual Alert & Delivery Fix"**. 
    - **UI Split:** Dividida la alerta de pedidos externos en "Nuevos Web" (Azul) y "Por Entregar" (Naranja).
    - **Logic Refine:** Filtro "Entregados" ahora acepta variantes de estado (substring matching) para evitar falsos negativos.
- **v4.5.1 (2026-01-28):** **"POS Frozen"**. 
- **v4.6.6 (2026-01-29):** **Authoritative Persistent Shield Protocol (Shield 2min)**.
    - **Sync:** Bloqueo autoritativo de 2 minutos para evitar regresiones de estatus causadas por latencia de Google Sheets.
    - **Router:** Implementado enrutado automático de Repartidores a pestaña "Listos" al entrar al monitor.
    - **Robustness:** Aumentado el cooldown de refresco local a 10s tras actualización para permitir confirmación del backend.
- **v4.6.5 (2026-01-29):** **Table-based Persistent Shield Protocol**.
    - **Sync Robustness:** Implementada la reconciliación atómica mediante `fecha_estatus` (timestamps) en la base de datos.
    - **Persistence:** El cache de estados y logs ahora reside en `localStorage`, sobreviviendo a cierres de navegador y refrescos accidentales.
    - **Infinite Grace:** Eliminado el límite de 3 minutos; el estado local manda hasta que el servidor confirma que tiene datos iguales o más nuevos.
    - **Structural Hotfix:** Corregido error de variable no definida (`dailyOrders`) y eliminación de funciones duplicadas que causaban bloqueos en el arranque (Black Screen Fix).
- **v4.6.2 (2026-01-28):** **Stability Fix**.
    - **Critical Rescue:** Restaurada la carga de `ui.js` tras fallo de sintaxis.
    - **Orbit Restored:** Función de monitoreo de servidores recuperada. 
    - **Logs UI:** Sistema de logs persistente en barra de estado (`[LOGS]`).
    - **POS:** Contadores dinámicos en filtros (Nuevos/Listos).
- **v4.6.0 (2026-01-28):** **Delivery Flow v2**. 
    - **Optimistic UI:** Feedback instantáneo en POS.
    - **Strict Colors:** Código de colores unificado para estados.
    - **Delivery Button:** Botón nativo para repartidores con validación OTP.
- **v4.5.10 (2026-01-28):** **Monitor POS Refinado**.
    - **SaaS:** Módulo de Cuotas con restricción estricta (Solo SUITORG/DIOS).
    - **Express:** Contador de pedidos web dinámico (State-Aware) que resta pedidos entregados.
    - **Auditoría:** Código congelado para pruebas de campo.
- **v4.4.9 (2026-01-27):** **Sincronización Crítica & SaaS**. 
    - **CORS Fix:** Documentado que Google Apps Script rechaza peticiones con `preflight (OPTIONS)`. Se eliminó `mode: 'cors'` del fetch frontal para permitir el flujo nativo de redirección de Google mediante `GET`.
    - **OTP Unification:** Unificada la propiedad `otp` en todo el sistema (anteriormente se usaba `codigo_otp` en algunos módulos), asegurando visibilidad para Staff y ocultamiento para Repartidores.
    - **SaaS Matrix:** Integrada tabla `Cuotas_Pagos` y servidor local Node.js.
- **v4.4.5 (2026-01-27):** **Excepción de SLA**. Repartidores ven pedidos LISTOS sin importar la fecha. Normalización de estados y sincronización atómica.
- **v4.4.4 (2026-01-27):** **Filtro de Fecha Robusto**. Normalización manual de fecha (YYYY-MM-DD) y UI minimalista (texto plano).
- **v4.4.3 (2026-01-27):** **RBAC Estricto**. Eliminación de parches por nombre; permisos puramente por Nivel y Rol (Estándar Inmutable 10).
- **v4.4.2 (2026-01-27):** **Cajero Access Fix**. Restaurados botones de Cocina/Listo para Nivel 5 y blindaje de filtros.
- **v4.4.1 (2026-01-27):** Estabilidad Operativa POS + Seguridad DELIVERY. Restricción de monitor para repartidores, inclusión de OTP en WhatsApp y Cache Busting (?v=).
- **v4.4.0 (2026-01-27):** Estabilidad Operativa POS. Folios secuenciales cortos, descuento automático de stock en backend.
- **v4.3.5:** **Giro Gourmet Final**. Sincronización técnica de versión y auditoría de líneas (Workflow IBackend). Integration of dynamic links in POS and OTS channel badges.
- **v4.3.0**: Giro Gourmet. Especialización del Agente Chef, corrección de renderizado en Monitor POS, limpieza UTF-8 profesional y sincronización de parámetros de actualización de estados.
- **v4.2.1**: **Sincronización POS & Escritura**. Corregido el monitor de pedidos (updateProjectStatus) y reactivada la lógica de escritura (doPost) con blindaje multi-inquilino.
- **v4.2.0**: **Privacidad e Integridad**. Implementación de aislamiento multi-inquilino absoluto y reglas de oro para checkout y caja 100% libres de errores.
- **v4.1.0**: **IA Resiliente**. Restauración de lógica de semillas (Seeds) y RBAC. Implementación de llamadas reales a Gemini API con bucle de fallback.
- **v3.5.0**: **Total Staff Focus**. Ocultamiento automático de Footer y Botón de WhatsApp al iniciar sesión para maximizar el área de trabajo operativa.
- **v3.4.9**: **Staff UI Focus**. Ocultamiento dinámico del footer principal tras iniciar sesión.
- **v3.4.8**: **AI Chat Auto-Close**. Cierre automático del modal de chat tras frase de despedida o 45 segundos de inactividad.
- **v3.4.7**: **Ai Fix & SEO Refine**. Upgrade de API Gemini a v1beta y ocultamiento quirúrgico del título de SEO en Landing.
- **v3.4.6**: **Support Agent Activation**. Seed de AGT-001 restaurado e indicador visual de soporte en Landing Page y Menú PFM.
- **v3.4.5**: **Dashboard Granular (Blindaje)**. Control estricto de visibilidad para 'Mantenimiento' e 'IA Tools' mediante IDs únicos y lógica de Nivel/Módulo.
- **v3.4.4**: **Fix Transición Inquilino**. Persistencia de eventos `onclick` al cambiar de empresa; corrección de triggers de login perdidos.
- **v3.4.3**: **Mapeo de Cabeceras Robusto**. El backend ahora es resiliente a cambios de orden en Google Sheets mediante el uso de `appendToSheetByHeader`.
- **v3.4.2**: **Synchronized Payments**. Doble escritura en `Pagos` y `Proyectos_Pagos` para asegurar integridad de datos.
- **v3.4.0**: **Delivery Engine Stage**. Implementación de cargo por envío dinámico y selector de método de entrega (Recoger/Domicilio) en Checkout Express. Optimización visual de tarjetas de catálogo.
- **v3.3.9**: **Desbloqueo de Flujo de Desarrollo**. Implementación de **Modo Turbo** en Workflows and automatización de políticas de ejecución para Node.js/NPM. Documentación de infraestructura de desarrollo.
- **v3.3.8**: Parche de Estabilidad y Seguridad. Implementación de Blindaje de Tokens en todas las llamadas API (app.js) y protección de secretos en el backend. Filtrado estricto multi-inquilino.
- **v3.3.7:** Refuerzo del Protocolo de Semillas con función `ensureSeed`. Fix de sincronización AI Agentes.
- **v3.3.6:** Implementación del Protocolo de Verificación de Semillas (Seeds):
    - Asegurar que registros maestros (Agentes IA, Roles Críticos, SEO base) existan en el backend mediante lógica de "Upsert".
    - **NUEVO**: La lógica de Upsert debe verificar por ID y no depender del estado "vacío" de la tabla.
    - Botón de soporte en landing.
- **v3.3.5:** Implementación del módulo de Atención al Cliente (`Atencion_Cliente`). Integración de notificaciones por correo y cierre inteligente de chat IA tras reporteo.
- **v5.7.0:** Suit BI Matrix. Dashboard dinámico basado en configuración de metadatos desde Excel.
- **v5.5.0:** Motor de Reportes Dinámicos. Permite crear reportes desde Google Sheets sin tocar código.
- **v5.4.0:** Lanzamiento de Fábrica de Negocios (Onboarding) con autogeneración de identidad visual y corporativa (IA).
- **v3.3.4:** Optimización de Workflows e implementación del Orquestador inteligente. Unificación de flujos en `/integridad-total` y blindaje `/multi-inquilino` en reparaciones.
- **v3.3.3:** Fix de renderizado HTML en el chat de agentes IA. Actualización de auditoría de líneas.
- **v3.3.1:** Footer Dinámico y Enlaces de Redes Sociales con manejo de "en construcción". Integración de Pilares y Políticas.
- **v3.3.0:** Migración de clústeres de SEO de cola larga a matriz dinámica (`Config_SEO`). Soporte multi-inquilino para palabras clave industriales.
- **v3.2.1:** Fix de persistencia en Barra de Estado y visibilidad global (siempre on).
- **v3.2.0:** Implementación de RBAC Granular. Niveles 7 (Jr) y 8 (Sr) para Leads/Proyectos. Módulo `mantenimiento` habilitado para Nivel 9 o por ID.
- **v3.1.9:** Protección de God Tools mediante contendor oculto por nivel.
- **v5.8.9:** Optimización responsiva del Orbit Hub (-60% móvil) y lógica jerárquica de contacto WhatsApp (SEO Proxy). Elevación de Project Ranking a Invariante de Seguridad.
- **v5.8.7:** Chat Persistence & WA Summary.
- **v3.1.3:** Synchronized Search, Sort, and UI Polish. Audit lines updated to v5.4.0.
- **v3.1.2:** Implementación de búsqueda dinámica, ordenamiento de leads por nombre y pulido estético de tablas CRUD.
- **v2.8.1:** Integración del **Modo DIARIO** de créditos. Gestión de acceso persistente y control de fecha de último ingreso por usuario.
- **v2.8.0:** Implementación de "Temperatura de Negocio" (Flujo Dinámico) por empresa (`id_empresa`) y Consola de Sistema.
- **v2.7.5:** Transición de identidad a **SuitOrg**. Implementación de Resumen Ejecutivo y esquema de módulos especializados.
- **v2.7.0:** Implementación de "Temperatura de Negocio" (Flujo Dinámico) y Consola de Sistema.

## 8. Estadísticas del Proyecto (Auditoría de Código)

| Archivo / Carpeta | Líneas | Comentario |
| :--- | :--- | :--- |
| index.html | 1803 | Estructura base / Bóveda v15.8.7 |
| style.css | 3829 | UI/UX Premium (Refactorización) |
| js/modules/ | 7808 | Lógica AI & Vault Engine |
| app.js | 70 | Router y Orquestación Inicial |
| backend_schema.gs | 1163 | Seed Fix & AI Memory |
| **TOTAL** | **14673** | Producción v15.8.8 Estándar |

---
*Manual generado automáticamente por Antigravity AI.*
