# Memoria de Soluciones y Optimización

| Fecha | Huella | Problema | Solución | Estado |
|:---|:---|:---|:---|:---|
| 2026-01-23 | UI_SOCIAL_LOGOS_MISSING | Logos sociales como cuadros vacíos | Inyección de Font Awesome 6 + clases fa-brands | ✅ |
| 2026-01-23 | BODY_SEO_HERO_STANDARD | Inconsistencia visual en landing body | estandar-body con Hero Banner + Matriz SEO | ✅ |
| 2026-01-23 | FOOTER_SINGLE_BAR_REDESIGN | Footer con secciones separadas | Barra Única dinámica horizontal | ✅ |
| - | AI_GEMINI_V1_NOT_FOUND | Modelo no encontrado | AI Doctor con escaneo y auto-selección | ✅ |
| - | AI_GEMINI_V1BETA_NOT_FOUND | Error 404 v1beta | Cambiar endpoint a v1 | ✅ |
| - | AI_GEMINI_NO_CANDIDATES | Respuesta 200 sin candidates | Validar estructura JSON + manejo errores | ✅ |
| - | RBAC_STATUS_BAR_LEAK | Nivel acceso visible tras logout | Resetear sb-level e indicator en setLoggedOutState | ✅ |
| - | SEO_DYNAMIC_MATRIX | Clústeres SEO hardcodeados | Migración a Config_SEO con render dinámico | ✅ |
| - | FOOTER_SOCIAL_DYNAMIC | Redes estáticas/rotas | Render dinámico + estado "en construcción" | ✅ |
| - | UI_PILLARS_POLICIES_FOOTER | Acceso difícil a Pilares/Políticas | Integración en footer + refactor applyTheme | ✅ |
| - | UI_CHAT_HTML_SPACES | Tags HTML literales en chat | Eliminar espacios tras < y antes de > en templates | ✅ |
| - | BACKEND_MISSING_SEEDS | Tablas existentes sin seeds | Upsert en inicialización | ✅ |
| - | SEED_LOGIC_INDEX_FAIL | Fallo por índices fijos | ensureSeed con búsqueda dinámica de header 'id' | ✅ |
| - | UI_LOGIN_TRIGGER_LOST | Evento Staff perdido al cambiar empresa | onclick inline en template lateral | ✅ |
| - | DB_PAYMENTS_COL_SHIFT | Datos de pago corridos de columna | appendToSheetByHeader + doble escritura | ✅ |
| - | POS_LAST_SALE_SYNC | Última venta no actualizada | Refactor updateLastSaleDisplay con orden robusto | ✅ |
| - | RBAC_DASHBOARD_GRANULAR | Staff veía herramientas admin | IDs únicos + filtro por nivel_acceso | ✅ |
| - | ORCH_IMMUTABLE_STANDARDS | Riesgo de modificar estándares | estandares_inmutables.md como matriz de validación | ✅ |
| 2026-01-23 | POS_EXT_ORDER_ALRT | Supervisores no sabían de pedidos web | pos-external-alert con sync 30s | ✅ |
| 2026-01-23 | POS_EXT_ORDER_SND | Alerta visual ignorada | playNotification en cambio 0→N pedidos | ✅ |
| 2026-01-23 | UI_CART_BAR_CONTRAST | Cápsula carrito perdida contra fondo | Borde 2px + sombra profunda + hover | ✅ |
| 2026-01-23 | BOOT_CRASH_STBAR | updateStatusBar is not a function | Refactor global a updateEstandarBarraST | ✅ |
| 2026-01-24 | DB_WRITE_FAILURE_STRUCTURAL | No escribía datos tras horas | Refactor initializeRbac + limpieza filas fantasma | ✅ |
| 2026-01-25 | RESOURCE_OPTIM_GLOBAL | Latencia por filas vacías | ejecutarMantenimientoGlobal en Apps Script | ✅ |
| 2026-01-25 | LANDING_STD_SYNC | Desfase funciones barra estado | Corrección updateEstandarBarraST fecha AAMMDD | ✅ |
| 2026-01-25 | UTF8_GOLDEN_RULE_SYNC | Mojibake en logs/alertas | Limpieza masiva en ui.js y auth.js | ✅ |
| 2026-01-26 | POS_SYNC_ACTION_FAIL | Acción desconocida: updateProjectStatus | Sincronizar parámetros frontend/backend v4.2.1 | ✅ |
| 2026-01-26 | POS_STATE_INIT_MISSING | Pedidos sin estado inicial | Inyectar PEDIDO-RECIBIDO en checkout | ✅ |
| 2026-01-26 | UI_RENDER_CRASH_SCOPE | currentStatus is not defined | Declarar en scope correcto | ✅ |
| 2026-01-26 | UTF8_WA_MOJI_CLEAN | Mojibake en WhatsApp | Limpieza emojis/accentos con Unicode limpio | ✅ |
| 2026-01-26 | POS_REDUNDANT_SCOPE_FIX | Redeclaración currentStatus | Refactor a orderStatus constante | ✅ |
| 2026-01-29 | SYNC_PERSISTENT_SHIELD | Pedidos regresaban a "Nuevo" | Reconciliación por timestamps + localStorage | ✅ |
| 2026-01-29 | BOOT_CRASH_RENDER_POS | Pantalla negra por dailyOrders | Restauración filtrado + saneamiento localStorage | ✅ |
