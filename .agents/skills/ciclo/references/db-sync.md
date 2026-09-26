# Sincronización multi-inquilino

`Config_Empresas` en Google Sheets es la fuente de verdad de configuración. Un registro = una empresa. El campo `db_engine` (`GSHEETS` | `SUPABASE` | `NEON`) decide dónde viven sus datos.

## Qué dispara sincronización
- Cambio de **arquitectura** en la hoja: añadir, quitar, renombrar o reordenar columnas.
- Cambio en **registros** de configuración que el código consume.
- Cambio de `db_engine` de una empresa (implica migración, no solo sync).

## Orden obligatorio
1. Detectar delta (F5) y escribir `PLAN-SYNC.md`.
2. Mostrar el plan y esperar visto bueno.
3. Ejecutar por empresa, nunca en lote ciego.
4. Verificar después de cada empresa y registrar el resultado.

Nunca sincronices en medio del ciclo, aunque parezca trivial.

## Delta de esquema
Compara encabezados actuales de la hoja contra el contrato/esquema en código. Clasifica cada columna: `NUEVA`, `ELIMINADA`, `RENOMBRADA`, `TIPO CAMBIADO`, `REORDENADA`. Para renombrados exige confirmación del usuario: un renombrado mal leído como eliminación + creación borra datos.

## Reglas por motor
- **GSHEETS**: la hoja ya es el destino. Sincroniza solo encabezados y validaciones; escribe por rango explícito, jamás sobrescribas la hoja completa. Respeta el orden de columnas.
- **SUPABASE**: aplica cambios como migración SQL versionada en el repo. Columnas nuevas `NULL` o con default; nunca `DROP COLUMN` sin aprobación nominal en el plan. Verifica con el MCP de Supabase antes y después.
- **NEON**: está vacía. Trátala como bootstrap: crea esquema completo desde el contrato, luego carga datos solo si el usuario lo pide. No asumas paridad con Supabase ni copies datos sin instrucción.

## Limpieza
Si el delta incluye borrar columnas o filas obsoletas, no lo mezcles con la sincronización: pásalo a `PLAN-DEPURA.md` y trátalo en modo depuración (`references/depuracion.md`).

## Seguridad de datos
- Idempotencia: reejecutar el plan no debe duplicar filas ni columnas.
- Identifica cada fila por su clave de empresa, nunca por posición.
- Cambios destructivos (`DROP`, borrado de columnas, borrado de filas) requieren respaldo previo y mención explícita en el plan.
- Si una empresa falla a mitad del lote, detén el resto y reporta estado por empresa.

## Varios subproyectos
Varios subproyectos pueden compartir `Config_Empresas`. El delta se decide una sola vez y por empresa: anota en `PLAN-SYNC.md` qué alcance origina el cambio y avisa si afecta a otro subproyecto, que deberá correr su propio ciclo de validación.

## Cierre
Anota en `PLAN-SYNC.md` el estado final por empresa (`APLICADO`, `OMITIDO`, `FALLIDO`) y haz el commit de la fase 6 citando la aprobación recibida.
