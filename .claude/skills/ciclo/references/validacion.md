# Validación efectiva

Objetivo: que nadie tenga que creerte. Toda afirmación de "funciona" apunta a una línea de `VALIDACION.md` con comando y salida real.

Antes de empezar, lee `CORRECCIONES.md` y convierte cada aprendizaje previo en una prueba de esta ronda.

## Selección 20/80 de pruebas
Elige 3 a 6 pruebas, en este orden de prioridad:
1. **Camino crítico multi-inquilino**: una empresa por cada `db_engine` presente en `Config_Empresas`.
2. **Aislamiento**: la empresa A no ve ni escribe datos de la empresa B.
3. **Delta de esquema**: los campos añadidos se leen y escriben; los eliminados ya no rompen lecturas.
4. **Regresión del último error** de `CORRECCIONES.md`.
5. **Caso límite** más barato de provocar (registro vacío, `db_engine` inválido, credencial ausente).

Ignora pruebas cosméticas mientras haya alguna de las anteriores sin cubrir.

## Herramientas por tipo de cambio
- **Base Supabase / Neon**: MCP de Supabase para consultar esquema y filas reales; para Neon usa su cliente SQL del proyecto. Verifica: existencia de tabla, tipo de columna, conteo de filas afectadas antes/después.
- **Google Sheets / Apps Script**: Google Apps Script para leer encabezados de `Config_Empresas` y una fila de muestra. Verifica que el orden de columnas del código coincide con el de la hoja, no solo los nombres.
- **UI y flujos de navegador**: MCP de Playwright (preferido, es reproducible) o MCP de Chrome DevTools cuando necesites inspeccionar red o consola. Captura: URL, acción, texto esperado, texto observado, errores de consola.
- **Lógica pura**: ejecuta el test o un script mínimo en Node y pega la salida.

Si una herramienta no está disponible, dilo en `VALIDACION.md` como GAP con su riesgo; no la sustituyas por suposiciones.

## Registro
Una fila por prueba en `VALIDACION.md`: id, qué verifica, empresa/motor, comando o acción, resultado observado, veredicto, evidencia. Cierra con veredicto global y lista de GAPs.

## Cuando falla
1. Una causa raíz, no una lista de sospechas.
2. Arregla lo mínimo.
3. Reejecuta la prueba que falló **y** las que dependían de ese código.
4. Anota en `CORRECCIONES.md`: síntoma, causa, arreglo, regla preventiva.
