---
description: Ciclo de mantenimiento y decision por proyecto o subproyecto (contrato, commits por fase, validacion, sync con visto bueno)
template: |
  Ejecuta el ciclo de mantenimiento definido en SuitOS.
  Lee @.suit/skills/domain/contrato-subproyecto.yaml, @.suit/skills/domain/data-sync.yaml,
  @.suit/skills/domain/data-cleanup.yaml y @.suit/skills/process/iteration-loop.yaml
  completos antes de actuar.

  Alcance y objetivo: $ARGUMENTS
  Si el primer argumento es `depura`, entra en modo depuración de datos
  (lee @.suit/skills/domain/data-cleanup.yaml y @.suit/templates/PLAN-DEPURA.md):
  diagnostica en solo lectura, propón en PLAN-DEPURA.md, exige respaldo y mi aprobación
  nominal antes de borrar nada.
  Si el primer argumento es `contrato`, entra en modo contrato
  (lee @.suit/skills/domain/contrato-subproyecto.yaml y @.suit/templates/CONTRATO.md):
  crea, amplía, detalla o normaliza el CONTRATO.md del alcance, muéstrame el diff y los
  POR CONFIRMAR, y solo después decide si hace falta ciclo de código.
  Si el primer argumento es una carpeta existente, ese es el alcance; si no, usa el directorio actual
  y deduce el objetivo de los cambios pendientes.

  Estado inicial:
  !`bash scripts/detectar-cambios.sh $1`

  Reglas: el contrato, VALIDACION.md, CORRECCIONES.md y PLAN-SYNC.md viven dentro del alcance.
  Si no hay contrato, créalo primero leyendo el código del alcance y muéstrame los POR CONFIRMAR.
  No toques código fuera del alcance sin mi permiso.
  No sincronices ninguna base de datos hasta la fase 6 y solo con mi visto bueno explícito.
  Commits por fase con scripts/commit-fase.sh, no al final.
---
