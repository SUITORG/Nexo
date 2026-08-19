# DEBUG LOG & INCIDENT HISTORY

## 2026-01-26: Error 403 Forbidden (Google Apps Script)
**Incidente:** Backend respondía 403 Forbidden desde `core.js`.
**Causa:** Múltiples sesiones Google en el mismo navegador.
**Solución:** Ventana Incógnito → autorizar URL del script → backend responde.

## 2026-01-26: Inestabilidad Matriz SEO
**Incidente:** Tabla "Soluciones Integrales" desaparecía al navegar.
**Causa:** router.js no re-invocaba `app.ui.renderSEO()` al volver a `#home`.
**Solución:** Llamada explícita a `renderSEO()` en ruta `#home`.
