---
description: Sincronización técnica de versiones y actualización de documentación para el backend.
---
Este workflow unifica la sincronización técnica de versiones con la actualización de la documentación para asegurar que el sistema y su manual siempre coincidan.

### 1. Sincronización Técnica (Versiones)
Este paso es **obligatorio** tras cualquier cambio en `app.js` o `backend_schema.gs`.

1.  **Actualizar Backend**:
    - Incrementar la versión en el encabezado de `backend_schema.gs`.
  3.  **Actualizar Versión en Frontend (`js/modules/core.js`)**:
    - Modificar la constante `app.version` y la cabecera del archivo para que coincida exactamente con la del backend.
4.  **Actualizar Metadata en Documentación**:
    -   Modificar la bitácora técnica (`tech_manual.md`).
    -   Actualizar hitos en `roadmap.md`.
5.  **Audit de Líneas**:
    -   Contar líneas de `index.html`, `style.css`, `app.js` y el total de la carpeta `js/modules/`.
    -   Actualizar la tabla de auditoría en el header de `backend_schema.gs` y en `tech_manual.md`.
3.  **Aviso de Apps Script**:
    - Informar EXPLÍCITAMENTE al usuario que debe copiar el código al editor de Google Apps Script.
4.  **Verificación de Semillas (Seeds)**:
    - Asegurar que registros maestros (Agentes IA, Roles Críticos, SEO base) existan en el backend mediante lógica de "Upsert".
    - **Requisito**: La verificación debe ser por ID único del registro, no solo por si la tabla esta vacía.

### 2. Actualización Documental
Asegura que el conocimiento del sistema no se pierda.

1.  **Manual Técnico (`tech_manual.md`)**:
    - Actualizar estadísticas de líneas en la sección 8.
    - Documentar nuevas reglas de negocio o tablas si aplica.
2.  **Hoja de Ruta (`roadmap.md`)**:
    - Marcar tareas completadas.
    - Actualizar la versión actual en la base del documento.
