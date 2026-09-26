# Depuración y compactación de datos

No la confundas con la compactación de contexto (`compactacion.md`). Aquí se limpia la base de datos del alcance. Es la operación **más destructiva** del ciclo: siempre en modo propuesta, siempre con respaldo, siempre con visto bueno nominal.

Invocación: `/ciclo depura [ruta] [instrucción]`, o cuando detectes basura de datos al validar (filas huérfanas, columnas muertas, duplicados por empresa). En ese caso no limpies: anótalo en `PLAN-DEPURA.md` y sigue con tu ciclo.

## Fases dentro del modo
1. **Diagnóstico (solo lectura).** Mide antes de proponer. Prohibido escribir.
2. **Propuesta.** Rellena `templates/PLAN-DEPURA.md`: hallazgo, evidencia, empresas afectadas, motor, acción, reversible sí/no, respaldo, ganancia esperada.
3. **20/80.** Ordena por riesgo eliminado y espacio o latencia recuperados. Ejecuta solo los 2 o 3 primeros; el resto queda documentado.
4. **Respaldo.** Sin respaldo verificado (conteo de filas y ruta del archivo o snapshot) no se ejecuta nada destructivo.
5. **Ejecución por empresa**, nunca en lote. Verifica después de cada una y registra estado.
6. **Validación post-depuración** obligatoria en `VALIDACION.md`: la app sigue leyendo y escribiendo por cada `db_engine` presente, y los conteos coinciden con lo previsto.
7. **Commit** de la fase con `commit_fase.sh` y cierre del plan con estado por empresa.

## Qué buscar por motor
- **GSHEETS**: filas y columnas vacías dentro del rango usado, rangos con nombre rotos, duplicados de la clave de empresa, fórmulas volátiles en `Config_Empresas`, hojas y pestañas de respaldo olvidadas, celdas con espacios o tipos inconsistentes. Compactar = recortar el rango usado y normalizar encabezados, no reordenar columnas sin aprobación.
- **SUPABASE**: filas huérfanas sin empresa válida, columnas declaradas y nunca leídas por el código, índices duplicados o ausentes en las claves de filtrado por empresa, tablas temporales de migraciones, bloat recuperable (`VACUUM (ANALYZE)`; `VACUUM FULL` solo en ventana acordada porque bloquea).
- **NEON**: está vacía; aquí depurar significa no heredar basura. Antes de cargar datos crea el esquema desde el contrato con las columnas que el código realmente usa y sin las que ibas a borrar en Supabase.

## Reglas duras
- `DROP`, `DELETE`, `TRUNCATE`, borrado de columnas o de hojas requieren aprobación nominal, citada en el commit.
- Identifica filas por clave de empresa, nunca por posición ni por rango visual.
- Idempotencia: reejecutar el plan no debe borrar nada nuevo.
- Nada de limpiar datos de una empresa cuyo `db_engine` no coincide con el motor donde estás operando.
- Si la validación post-depuración falla, restaura del respaldo antes de intentar otro arreglo.
- Conserva el registro: qué se borró, cuántas filas, cuándo, con qué aprobación.
