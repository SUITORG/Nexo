# Registro de Lecciones y Calibración de Usuario

Este archivo almacena las preferencias aprendidas del usuario para mejorar la precisión de futuras ejecuciones.

| Fecha / Hora | Preferencia Aprendida | Contexto | Regla Implícita para Futuras Tareas |
| :--- | :--- | :--- | :--- |
| 2026-01-21 - --:-- | **Estética BK-Style** | PFM / Comida | Usar border-radius: 20px, tarjetas 25% más pequeñas y botones de acción (+) flotando sobre la imagen. |
| 2026-01-21 - --:-- | **Integración de WhatsApp** | General (Header) | El botón de WhatsApp debe estar en el Header 1, lado izquierdo, como un botón integrado (no flotante en esquina). |
| 2026-01-21 - --:-- | **Persistencia SEO** | Landing Pages | Nunca ocultar la sección `Config_SEO`, incluso si el tema es de comida; el contenido SEO es prioritario. |
| 2026-01-21 - --:-- | **Navegación por Carrusel** | Catálogos (POS/Público) | Preferir carruseles horizontales con pestañas de categoría sobre rejillas (grids) largas. |
| 2026-01-21 - --:-- | **Dualidad POS** | Roles Staff | `staff-pos` es para generar ventas; `POS` (Monitor) es para seguimiento de órdenes y cocina. |
| 2026-01-21 - --:-- | **Costo de Envío Dinámico** | Checkout Express | El cargo por envío debe ser configurable desde la columna `costo_envio` en `Config_Empresas` y mostrarse como un selector automático. |
| 2026-01-21 - --:-- | **Tarjetas Compactas** | Catálogos (POS/Público) | Reducir tamaño de tarjetas food-card a 132px (20% menos) para una vista más densa y moderna. |
| 2026-01-21 - --:-- | **Privacidad de Stock** | Landing / Pedido Express | El stock disponible (`DISP.`) solo es visible para personal STAFF logueado; ocultar para invitados/público. |
| 2026-01-21 - --:-- | **Resiliencia Orbit Hub** | Inicialización / Multi-inquilino | El mensaje `NO BUBBLES FOUND` es un fallo de sincronización; siempre usar UI amigable con botón de reintento e investigar `apiToken` en `app.js` vs `backend_schema.gs`. |
| 2026-01-22 - --:-- | **Interacciones Informales** | Comunicación General | Preguntas como "¿cómo estás?", "¿terminaste?", "¿estás trabajando?" no forman parte del sistema. Responder de forma breve y directa sin iniciar procesos pesados. |
| 2026-01-23 - 10:12 | **Versión Simplificada** | Barra de Estado | Mostrar únicamente el número de la versión (ej. v3.5.2) en la barra de estado, eliminando el texto descriptivo del release. |
| 2026-01-23 22:15 | **Refactorización Segura** | Core / Global | Al renombrar funciones estándar (ej. `updateStatusBar` -> `updateEstandarBarraST`), se debe realizar un reemplazo global en todo el proyecto para evitar "Boot Crashes" que oculten componentes críticos. |
| 2026-01-24 - 06:45 | **Fragilidad getLastColumn** | Google Sheets API | `getLastColumn()` devuelve 0 en hojas vacías. Los procesos de reparación deben validar esto antes de llamar a `getRange` para evitar caídas del script. |
| 2026-01-24 - 06:48 | **Fantasmas en Filas** | Google Sheets API | Hojas con filas "semi-vacías" (con formato pero sin data) rompen `getLastRow()`. Siempre incluir limpieza de filas excedentes en el mantenimiento. |
| 2026-01-24 - 21:48 | **Regla de Oro UTF-8** | Global (DB/HTML/JS) | **Mandato**: Configurar todo en UTF-8. **Prohibición**: No usar scripts externos (.py) para encoding. **Solución**: Implementar `sanitizeString` en el flujo de datos (JS/GS) para eliminar mojibake y caracteres de control invisibles. |
| 2026-01-25 - 10:15 | **Workflow Consolidado Landing** | Landing Page | Centralizar `barra-estado`, `estandar-body` y `estandar-footer` en `estandar-landing.md` para un control unificado que obedece al Orquestador y reporta al Evaluador. |
| 2026-01-25 - 11:20 | **Mantenimiento Proactivo** | Backend (Apps Script) | Siempre incluir una función de "Compactación" (`deleteRows`) para mitigar el crecimiento artificial del archivo de Google Sheets por filas con formato fantasma. |
| 2026-01-27 - 11:30 | **Respuestas Concisas** | Comunicación Terminal | El usuario prefiere respuestas cortas y directas, pero con contenido técnico sustancial (concisas). |
