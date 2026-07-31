---
trigger: always_on
---

## Restricciones de Modo Visual

Estás en **Modo Ajustes Visuales**. En este modo:

1. **Archivos permitidos**: Solo puedes modificar:
   - Archivos CSS (`.css`, estilos inline).
   - Archivos JS de UI en carpeta `js/modules/` (solo secciones de render/HTML).
   - Archivos HTML (solo estructura visual, no lógica).

2. **Archivos PROHIBIDOS**: NO toques:
   - Google Apps Script (`.gs`).
   - Archivos de servicios/repositorios de datos.
   - Archivos de lógica de negocio o backend.
   - Hojas de Google Sheets.

3. **Alcance reducido**:
   - Límite al componente/sección específica mencionada por el usuario.
   - No leas más de 2 archivos (estilos + módulo UI).
   - No requieres APROBADO_GLOBAL.

4. **Plan simplificado**: máximo 3 pasos. Sigue requiriendo APROBADO.

5. **Validación post-cambio**: verificar invariantes UI (seo-matrix, pos-express).
