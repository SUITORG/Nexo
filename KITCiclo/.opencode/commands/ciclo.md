---
description: Ciclo de mantenimiento y decision por proyecto o subproyecto (contrato, commits por fase, validacion, sync con visto bueno)
template: |
  Ejecuta el ciclo de mantenimiento definido en @.claude/skills/ciclo/SKILL.md.
  Lee ese archivo y @.claude/skills/ciclo/references/alcance.md completos antes de actuar.

  Alcance y objetivo: $ARGUMENTS
  Si el primer argumento es `depura`, entra en modo depuración de datos
  (lee @.claude/skills/ciclo/references/depuracion.md): diagnostica en solo lectura, propón en
  PLAN-DEPURA.md, exige respaldo y mi aprobación nominal antes de borrar nada.
  Si el primer argumento es `contrato`, entra en modo contrato (lee @.claude/skills/ciclo/references/contrato.md):
  crea, amplía, detalla o normaliza con plantilla el CONTRATO.md/PRP del alcance, muéstrame el diff y los
  POR CONFIRMAR, y solo después decide si hace falta ciclo de código.
  Si el primer argumento es una carpeta existente, ese es el alcance; si no, usa el directorio actual
  y deduce el objetivo de los cambios pendientes.

  Estado inicial:
  !`bash .claude/skills/ciclo/scripts/detectar_cambios.sh $1`

  Reglas: el contrato, VALIDACION.md, CORRECCIONES.md y PLAN-SYNC.md viven dentro del alcance.
  Si no hay contrato, créalo primero leyendo el código del alcance y muéstrame los POR CONFIRMAR.
  No toques código fuera del alcance sin mi permiso.
  No sincronices ninguna base de datos hasta la fase 6 y solo con mi visto bueno explícito.
---
