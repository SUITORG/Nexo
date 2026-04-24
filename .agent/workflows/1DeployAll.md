---
description: Despliegue Unificado de Frontend y Backend (Caché + Clasp)
---

Este workflow automatiza la sincronización total del sistema SuitOrg.

1. **Actualización de Versión Frontend**:
   - Generar un nuevo string de versión basado en la fecha/hora actual (ej: YYMMDD-HHMM).
   - Actualizar la constante `version` en `js/modules/core.js`.
   - Actualizar TODOS los query strings `?v=...` en `index.html` con la nueva versión.

2. **Sincronización de Backend (GAS)**:
   // turbo
   - Ejecutar `clasp push -f` para subir los cambios locales a la nube.

3. **Generación de Snapshot**:
   // turbo
   - Ejecutar `clasp version "Sync Unificado v[VERSION]"` y capturar el nuevo número de versión generado.

4. **Despliegue Maestro**:
   // turbo
   - Ejecutar `clasp deploy -i AKfycbwcssWoG33qDvfvmbol3QSnwQU00TNt3cyGhphaoiRvRSjsmF8g22ovmB4aidlmyQtR -V [NUMERO_VERSION] -d "v[VERSION] - Despliegue Automático"`

5. **Finalización**:
   - Informar al usuario que el sistema está 100% sincronizado y listo para F5.
