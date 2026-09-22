---
name: ciclo
description: "Ciclo de mantenimiento y decisión para el proyecto multi-inquilino SUIT y cada uno de sus subproyectos: contrato por carpeta, commits por fase, validación con pruebas reales, compactación de contexto al 60% y sincronización de esquema/registros entre GSHEETS, SUPABASE y NEON según Config_Empresas.db_engine. Úsalo cuando se modifique código, cambie la arquitectura de datos o el usuario escriba /ciclo."
license: MIT
compatibility: "Claude Code y opencode. Requiere git. Opcional: MCP de Supabase, Playwright o Chrome DevTools, y acceso a Google Apps Script."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Ciclo (mantenimiento y decisión)

Regla base: **cada fase termina en commit; la sincronización de bases de datos ocurre solo al final y solo con visto bueno explícito del usuario.**

## Dos entradas

1. **Manual**: el usuario invoca `/ciclo [ruta] [objetivo]`, `/ciclo contrato [ruta] [instrucción]` o `/ciclo depura [ruta] [instrucción]` (ver los modos más abajo).
2. **Automática**: detectas que estás modificando código del proyecto (edición de archivos, migraciones, cambios de esquema, nuevos campos en `Config_Empresas`). Entonces aplicas este ciclo sin que te lo pidan.

Si no hay cambios reales (`git status --porcelain` vacío y sin diff de esquema), **salta fases**: informa "sin cambios, ciclo omitido" y termina. No inventes trabajo.

## Paso 0 — Alcance y contrato

El repo tiene subcarpetas que pueden ser proyectos completos o subproyectos. El ciclo corre **en el alcance donde se invoca**, con sus propios `CONTRATO.md`, `VALIDACION.md`, `CORRECCIONES.md` y `PLAN-SYNC.md` dentro de esa carpeta.

```bash
bash .claude/skills/ciclo/scripts/detectar_cambios.sh [ruta-del-alcance]
```

Lee `references/alcance.md` siempre en este paso. Resumen: el alcance es la carpeta indicada por el usuario o la actual; se sube por los padres hasta la raíz y gana el primer directorio con contrato (`CONTRATO.md`, `CONTRATOPRP.MD`, `PRM.md`). Ese contrato manda sobre esta skill; el de la raíz es marco general y el del subproyecto gana en conflicto.

**Si el alcance no tiene contrato, créalo antes de la fase 1**: lee el código, `README*`, `package.json`, configuración, esquema y el uso de `Config_Empresas`, rellena `templates/CONTRATO.md`, marca lo no verificado como `POR CONFIRMAR`, muéstralo al usuario y haz commit como fase 0. No inventes reglas de negocio.

Declara siempre: `Alcance: <ruta> · Contrato: <archivo o NUEVO>`. No modifiques código fuera del alcance sin permiso explícito.

## Modos

**`contrato`** — `/ciclo contrato [ruta] [instrucción]`, o cuando el usuario pide crear, ampliar, detallar, corregir o normalizar el contrato/PRP, o aplicar una plantilla. El entregable es el contrato, no el código: editas por secciones sin borrar reglas vigentes y solo pasas al ciclo normal si las reglas nuevas exigen cambios de código. Lee `references/contrato.md`.

**`depura`** — `/ciclo depura [ruta] [instrucción]`, o cuando el usuario pide limpiar, compactar o adelgazar la base de datos (no confundir con la compactación de contexto). Es la operación más destructiva: diagnostica en solo lectura, propone en `PLAN-DEPURA.md`, exige respaldo verificado y aprobación nominal, ejecuta por empresa y valida después. Nunca la ejecutes dentro de otro ciclo: si detectas basura de datos al validar, anótala en `PLAN-DEPURA.md` y sigue. Lee `references/depuracion.md`.

## Fases

Ejecuta en orden. Cada fase: actuar → validar → `commit_fase.sh` → evaluar contexto.

1. **Encuadre 20/80**: enumera los cambios pendientes y elige el 20% de acciones que resuelve el 80% del riesgo o valor. Escribe esa lista corta antes de tocar código y descarta el resto explícitamente.
2. **Implementación**: aplica los cambios de código de esa lista, nada más.
3. **Validación**: obligatoria, ver `references/validacion.md`. Nunca declares algo correcto sin evidencia ejecutada.
4. **Iteración**: si la validación falla, corrige y registra el aprendizaje en `CORRECCIONES.md`. Máximo 3 vueltas; a la cuarta detente y consulta al usuario.
5. **Plan de sincronización**: detecta deltas de esquema/registros y redacta `PLAN-SYNC.md`. No ejecutes nada aún.
6. **Visto bueno y sync**: pide aprobación explícita mostrando el plan. Solo con un "sí" aplicas la sincronización (`references/db-sync.md`).
7. **Cierre GitHub**: push solo si el usuario lo decide o ya lo autorizó para este ciclo. Sin cambios, sin push.

Commit tras cada fase:

```bash
bash .claude/skills/ciclo/scripts/commit_fase.sh <n> "<fase>" "<resumen corto>" <alcance> <db_engine> "<objetivo>"
```

Formato: `ciclo(f<n>/<fase>)[<alcance>]: <resumen>` y pie `Alcance: ... | Ciclo: ... | db_engine: ...`. El commit incluye solo archivos del alcance.

## Compactación al 60%

Al llegar cada fase a ~60% de la ventana de contexto, compacta antes de seguir: conserva contrato, objetivo, decisiones, deltas de esquema y errores aprendidos; **borra** lo que no pertenece al proyecto (búsquedas web, logs crudos, archivos ajenos, exploraciones descartadas). Detalle y checklist en `references/compactacion.md`. Relee el contrato después de cada compactación.

## Multi-inquilino

Cada registro de `Config_Empresas` es una empresa y su campo `db_engine` (`GSHEETS` | `SUPABASE` | `NEON`) decide el destino de datos. NEON está vacía: trátala como destino nuevo que requiere creación de esquema, nunca asumas datos existentes. Nunca mezcles datos entre empresas ni escribas en un motor distinto al declarado en su registro. Reglas completas en `references/db-sync.md`.

## Archivos vivos

Todos dentro del alcance, nunca en la raíz si el alcance es un subproyecto:

- `CONTRATO.md` — reglas del alcance; se crea en fase 0 si falta.
- `VALIDACION.md` — evidencia de pruebas de este ciclo (plantilla en `templates/`).
- `CORRECCIONES.md` — errores y aprendizajes acumulados; léelo antes de validar para no repetir fallas.
- `PLAN-SYNC.md` — delta propuesto y pendiente de visto bueno.
- `PLAN-DEPURA.md` — hallazgos y acciones de limpieza de datos, pendientes de visto bueno.

Crea los que falten copiando desde `templates/`.

## Referencias

- `references/depuracion.md` — limpieza y compactación de datos por motor. Léelo en modo depuración.
- `references/contrato.md` — crear, ampliar o normalizar el contrato con plantilla. Léelo al entrar en modo contrato.
- `references/alcance.md` — resolución de alcance en subproyectos y creación del contrato. Léelo en el paso 0.
- `references/fases.md` — criterios de entrada/salida de cada fase. Léelo la primera vez del ciclo.
- `references/validacion.md` — cómo probar con MCP Playwright/Chrome, Supabase y GAS.
- `references/db-sync.md` — sincronización de esquema y registros por motor.
- `references/compactacion.md` — qué conservar y qué borrar al 60%.
- `assets/AGENTS-fragmento.md` — pegar en `AGENTS.md`/`CLAUDE.md` para activación automática.
