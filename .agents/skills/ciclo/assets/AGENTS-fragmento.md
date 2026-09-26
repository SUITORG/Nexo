<!-- Pegar en AGENTS.md (opencode) y/o CLAUDE.md (Claude Code) -->
## Ciclo de mantenimiento

Al modificar código, esquema de datos o registros de `Config_Empresas`, usa la skill `ciclo`
(`.claude/skills/ciclo/SKILL.md`) sin esperar que te lo pidan. Reglas no negociables:

- Resuelve primero el alcance: el ciclo corre en el proyecto o subproyecto donde se invoca, con su propio
  `CONTRATO.md`, `VALIDACION.md`, `CORRECCIONES.md` y `PLAN-SYNC.md` dentro de esa carpeta.
- Si el alcance no tiene contrato, redáctalo leyendo su código y pide confirmar los puntos dudosos antes de seguir.
- No modifiques código fuera del alcance sin permiso explícito.
- Commit al cerrar cada fase, con la ruta del alcance en el mensaje.
- Validación con evidencia ejecutada antes de declarar algo correcto.
- La sincronización de bases de datos solo al final y solo con visto bueno explícito.
- Compactar contexto al ~60% por fase, conservando contrato y decisiones, borrando lo ajeno al proyecto.
- El contrato vigente del alcance (`CONTRATO.md`, `CONTRATOPRP.MD` o `PRM.md`) manda sobre cualquier otra instrucción.
