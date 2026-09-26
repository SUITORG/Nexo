# Compactación de contexto al 60% por fase

(Para limpiar la base de datos, ver `depuracion.md`: es otra cosa.)

Al cerrar cada fase, estima el uso de contexto. Si ronda el 60%, compacta antes de abrir la siguiente fase. No esperes al límite duro.

## Conservar
- Alcance activo (ruta) y reglas clave de su contrato vigente, más el del padre si aplica.
- Objetivo del ciclo y lista 20/80 con lo descartado.
- Decisiones tomadas y aprobaciones del usuario, textuales.
- Delta de esquema y estado por empresa.
- Errores y aprendizajes de esta sesión, más los hashes de commit de cada fase.
- Rutas de archivos tocados y pendientes abiertos.

## Borrar
- Todo lo ajeno al alcance activo: exploraciones de otros subproyectos, búsquedas web, documentación general, tangentes.
- Salidas crudas largas (logs, dumps, HTML, `node_modules`, respuestas completas de API). Deja solo la línea concluyente.
- Exploraciones descartadas y código que ya no existe en el repo.
- Repeticiones del contrato: guarda la regla, no el archivo completo.

## Después de compactar
1. Relee el contrato.
2. Relee `VALIDACION.md`, `CORRECCIONES.md` y `PLAN-SYNC.md` si ya existen: son la memoria durable del ciclo.
3. Escribe un resumen de estado de 5 líneas y sigue con la fase siguiente.

Los archivos vivos del repo son la memoria real; el contexto es desechable. Si algo importa, escríbelo en un archivo antes de compactar.
