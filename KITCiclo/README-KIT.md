# KIT `/ciclo`

Skill de mantenimiento y decisión para el proyecto multi-inquilino, compatible con Claude Code y opencode.

**Ya instalada en la raíz de este repo** — vive en `.agents/skills/ciclo/` (fuente única), visible nativamente en ambos CLIs vía junctions: `.claude/skills/ciclo` → `.agents/skills/ciclo` y `.opencode/skills/ciclo` → `.agents/skills/ciclo`. Esta carpeta (`KITCiclo/`) queda solo como referencia histórica del kit original; no hay nada que copiar ni mantener aquí.

## Instalación en otro repo (portar el kit)
1. Copia `.agents/skills/ciclo/` (carpeta completa) a la raíz del proyecto destino.
2. Crea los junctions/symlinks: `.claude/skills/ciclo` → `.agents/skills/ciclo` y `.opencode/skills/ciclo` → `.agents/skills/ciclo`.
3. Pega `.agents/skills/ciclo/assets/AGENTS-fragmento.md` en tu `AGENTS.md` (y asegúrate de que `CLAUDE.md`/`opencode.json:instructions` lo referencien) para que el ciclo se active solo al detectar cambios de código.
4. Las plantillas (`CONTRATO.md`, `VALIDACION.md`, `CORRECCIONES.md`, `PLAN-SYNC.md`) se copian **dentro de cada proyecto o subproyecto**, no solo en la raíz. Si un alcance no tiene contrato, el ciclo lo redacta leyendo su código y te pide confirmar los puntos dudosos.
5. Asegura permisos: `chmod +x .agents/skills/ciclo/scripts/*.sh`.

## Uso
- Manual en la raíz: `/ciclo mejorar lectura de Config_Empresas`
- Manual en un subproyecto: `/ciclo apps/portal ajustar sync de NEON`
- Modo depuración de datos: `/ciclo depura apps/portal limpia filas huérfanas`
- Modo contrato: `/ciclo contrato apps/portal detalla reglas de aislamiento por empresa` o `/ciclo contrato . aplica la plantilla`
- Automático: el agente aplica el ciclo al detectar modificaciones relevantes.

## Fases
Alcance y contrato → Encuadre 20/80 → Implementación → Validación → Iteración → Plan de sync → Visto bueno y sync → Cierre GitHub. Commit al final de cada fase, compactación al ~60%.
