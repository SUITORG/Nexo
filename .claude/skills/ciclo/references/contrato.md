# Modo contrato

Entradas válidas:

- `/ciclo contrato` — contrato del alcance actual.
- `/ciclo contrato <ruta>` — contrato de ese proyecto o subproyecto.
- `/ciclo contrato <ruta> <instrucción>` — p. ej. `detalla reglas de aislamiento por empresa`, `añade sección de despliegue`, `aplica la plantilla`.
- Sin subcomando: cualquier petición de crear, ampliar, detallar, corregir o normalizar el contrato/PRP, o adjuntar una plantilla.

## Procedimiento

1. **Resolver alcance** con `scripts/detectar_cambios.sh <ruta>` y declarar `Alcance: <ruta> · Contrato: <archivo o NUEVO>`.
2. **Elegir archivo destino**: el contrato existente del alcance. Si hay varios (`CONTRATO.md` y `PRM.md`), pregunta cuál es el vigente y no escribas en ambos. Si no hay ninguno, crea `CONTRATO.md` desde `templates/CONTRATO.md`.
3. **Reunir hechos antes de escribir**: código del alcance, `README*`, `package.json`, configuración, migraciones o esquema, uso de `Config_Empresas` y `db_engine`, contrato padre y `CORRECCIONES.md`. Toda regla nueva se apoya en un hecho verificado, en la instrucción del usuario o va como `POR CONFIRMAR`.
4. **Editar por secciones**: añade o reescribe solo las secciones pedidas. No borres invariantes ni límites vigentes; para retirar una regla, muéstrala y pide confirmación. Si la instrucción contradice el contrato actual, señala el conflicto antes de aplicar.
5. **Aplicar plantilla** (si se pide): usa `templates/CONTRATO.md` o la que el usuario adjunte como estructura destino. Mapea el contenido actual a las secciones nuevas sin perder texto: lo que no encaje va a una sección `Anexo heredado` para clasificar después. Nunca reemplaces el archivo por la plantilla vacía.
6. **Mostrar el diff** del contrato y la lista de `POR CONFIRMAR`, y pedir visto bueno.
7. **Commit** como fase 0 del alcance:
   `bash .claude/skills/ciclo/scripts/commit_fase.sh 0 contrato "<qué se amplió>" <alcance>`
8. **Propagar**: si el contrato nuevo exige cambios de código, esquema o registros, entra al ciclo normal desde la fase 1 con ese objetivo. Si solo documenta lo que ya existe, cierra aquí y dilo. Si cambia reglas de datos, la sincronización sigue esperando hasta la fase 6.

## Reglas
- El contrato es la autoridad: al ampliarlo, las reglas nuevas aplican desde el commit, no retroactivamente a trabajo ya validado.
- Mantén las secciones estables (Propósito, Stack, Datos y multi-inquilino, Límites, Invariantes, Definición de terminado, POR CONFIRMAR) para que todos los alcances se lean igual.
- Versiona el contrato con fecha y una línea de cambio al final; no lleves un historial largo, para eso está git.
- Un contrato por alcance. Si la instrucción afecta a varios subproyectos, edita el del padre y anota qué hereda cada hijo.
