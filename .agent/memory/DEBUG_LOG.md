# 🐞 DEBUG LOG & INCIDENT HISTORY

## 2026-01-26: Error 403 Forbidden (Google Apps Script)
**Incidente:** El backend respondía con error 403 Forbidden al intentar acceder desde `core.js`, mientras que el script estaba desplegado como "Cualquier persona".
**Causa:** Conflicto de múltiples sesiones de Google en el mismo navegador (Chrome con múltiples usuarios logueados). Apps Script no logra determinar la identidad de ejecución correcta.
**Solución:** 
1. Abrir ventana de **Incógnito**.
2. Acceder a la URL del script (`.../exec?action=ping`).
3. Google solicitará autorización/login limpio. Autorizar.
4. El backend empieza a responder correctamente.

## 2026-01-26: Inestabilidad Matriz SEO
**Incidente:** La tabla de "Soluciones Integrales" (SEO) aparecía al cargar la página pero desaparecía al navegar y volver a Inicio.
**Causa:** El módulo `router.js` manejaba la visibilidad de secciones pero no re-invocaba `app.ui.renderSEO()` al volver a la ruta `#home`.
**Solución:** Se agregó la llamada explícita a `renderSEO()` dentro de la lógica de ruta `#home` en `js/modules/router.js`.
