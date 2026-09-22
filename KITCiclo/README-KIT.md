# KIT `/ciclo`

Skill de mantenimiento y decisión para el proyecto multi-inquilino, compatible con Claude Code y opencode.

## Instalación
1. Copia `.claude/` y `.opencode/` a la raíz del proyecto (opencode lee también `.claude/skills/`).
2. Pega `.claude/skills/ciclo/assets/AGENTS-fragmento.md` en tu `AGENTS.md` o `CLAUDE.md` para que el ciclo se active solo al detectar cambios de código.
3. Las plantillas (`CONTRATO.md`, `VALIDACION.md`, `CORRECCIONES.md`, `PLAN-SYNC.md`) se copian **dentro de cada proyecto o subproyecto**, no solo en la raíz. Si un alcance no tiene contrato, el ciclo lo redacta leyendo su código y te pide confirmar los puntos dudosos.
4. Asegura permisos: `chmod +x .claude/skills/ciclo/scripts/*.sh`.

## Uso
- Manual en la raíz: `/ciclo mejorar lectura de Config_Empresas`
- Manual en un subproyecto: `/ciclo apps/portal ajustar sync de NEON`
- Modo depuración de datos: `/ciclo depura apps/portal limpia filas huérfanas`
- Modo contrato: `/ciclo contrato apps/portal detalla reglas de aislamiento por empresa` o `/ciclo contrato . aplica la plantilla`
- Automático: el agente aplica el ciclo al detectar modificaciones relevantes.

## Fases
Alcance y contrato → Encuadre 20/80 → Implementación → Validación → Iteración → Plan de sync → Visto bueno y sync → Cierre GitHub. Commit al final de cada fase, compactación al ~60%.
