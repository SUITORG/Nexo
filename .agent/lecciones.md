# Lecciones Aprendidas y Reglas Implícitas (SuitOrg)
**Última Actualización:** 2026-01-28 19:02:00


## Gestión de Código
1. **Verificación de Sintaxis**: Antes de confirmar un fix, hacer un `grep` o revisión visual rápida para detectar redeclaraciones obvias.
2. **Evitar Duplicación de Variables**: Al inyectar código en funciones largas (ej. `renderPOS` en `ui.js`), verificar siempre si variables comunes (`today`, `todayStr`, `user`, `isAdmin`) ya están definidas al inicio del scope. El uso de `const` duplicado provoca `SyntaxError` y caída total del módulo.
3. **Validación de Integridad**: Si se usa `replace_file_content` en archivos grandes, verificar que no se trunque el final del archivo. Siempre verificar el cierre correcto de objetos y funciones.

## Diagnóstico de Errores en Consola
1. **Errores de Extensiones (Falsos Positivos)**: 
   - `TypeError: Cannot set property ethereum...`: Conflicto entre extensiones de criptomonedas (MetaMask, Phantom). **No afecta** a la aplicación.
   - `Unchecked runtime.lastError`: Error interno del navegador/extensiones. **Ignorar**.
2. **Version Mismatch**:
   - `[VERSION_MISMATCH] Backend: X.X.X | Frontend: Y.Y.Y`: Indica que se actualizó el código JS local pero no el script de Google Apps Script (GAS). **No bloqueante**, pero sugiere sincronizar versiones.
3. **Errores Críticos de Arranque**:
   - `Cannot read properties of undefined (reading 'applyTheme')`: Indica fallo de carga total por `SyntaxError`.
   - **Pantalla Negra (Conflicto de IDs)**: Si la consola no muestra errores pero la pantalla está negra, verificar duplicidad de IDs en el HTML. `document.getElementById` solo encuentra el primero; si ese está oculto o vacío, la UI se rompe aunque el JS sea correcto.

## Diagnóstico Proactivo (Lecciones del 2026-01-28)
1. **La trampa del ID Duplicado**: Al restaurar secciones (como `view-orbit`), NUNCA asumir que no existen solo porque un `grep` falló (puede haber espacios o tabs). Un ID duplicado es "invisible" para el compilador pero mortal para el Router.
2. **Interpretación de capturas**: La presencia de un texto específico (ej. "< MUEVE EL PUNTERO... >") es la mejor pista para localizar EXACTAMENTE qué bloque de código se está renderizando, ignorando lo que uno "cree" que añadió.
3. **Rollback Selectivo**: Ante un fallo total, es mejor buscar el elemento que "bloquea" la vista antes de re-escribir funciones completas que podrían ya estar ahí.

