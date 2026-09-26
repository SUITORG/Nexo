# CONTRATO — SuitDashboard
Alcance: `SuitDashboard/` · Contrato padre: `CONTRATO.md` (raíz) · Fecha: 2026-09-25

## Propósito
Dashboard local HTML de solo lectura que escanea el monorepo SuitOrg (MCPs configurados, skills instaladas, proyectos independientes, puertos activos) y los muestra en tarjetas filtrables/buscables, para diagnosticar desincronización de MCPs, configuración rota o servidores caídos. No forma parte del pipeline de build/deploy de `grupoevasol.com` — es una herramienta de introspección para el operador del monorepo.

## Stack y ejecución
- Lenguaje / runtime: Node.js (script CLI, sin dependencias npm) + HTML/CSS/JS vanilla (sin build, sin framework)
- Comandos:
  - `node scan.js` — escanea el repo y escribe snapshot estático en `data.js`
  - `node scan.js --live` — además comprueba en vivo qué puertos están escuchando
  - `node scan.js --live --probe` — además sondea `opencode mcp list` y `claude mcp list` (real, ~1 min)
  - `abrir.bat` — corre `scan.js --live` y abre `index.html`
  - `sondear.bat` — corre `scan.js --live --probe` y abre `index.html`
  - Sin pruebas automatizadas, sin paso de build
- Variables de entorno requeridas: ninguna propia; lee `.env` de la raíz y de cada subproyecto solo para detectar qué claves existen (no las consume)

## Datos y multi-inquilino
- Consume `Config_Empresas`: no
- Motores soportados: N/A — no tiene base de datos propia
- Ubicación de esquema o migraciones: N/A
- Fuente real de datos: lectura del filesystem del monorepo en cada corrida de `scan.js` (`.suit/registry/projects.yaml`, `scripts/mcp-manager.js` → `PROJECT_OPTIMAL`, `opencode.json`/`.mcp.json`/`package.json` de cada subcarpeta, `~/.claude.json`, `.claude/settings.json`); escribe el snapshot en `SuitDashboard/data.js` (`window.SUIT = {...}`), consumido únicamente por `index.html`
- Activadores de scripts (`triggers`): `scan.js` lee una sola vez `AGENTS.md`, `CLAUDE.md`, `package.json`, `*.bat` de la raíz, `.suit/**/*.{yaml,md}`, `.github/workflows/*.yml` (incluye `schedule:` → cron) y `opencode.json`/`.mcp.json` (raíz + nivel-1) y detecta en ellos la referencia `scripts/<ruta>`; etiqueta `CLI manual` si nadie lo referencia. Descripciones de scripts: mapa local `SCRIPT_DESC_ES` en `scan.js` (las cabeceras de `scripts/*` quedan intactas — fuera del alcance)
- Reglas de aislamiento entre empresas: N/A — no maneja datos de negocio ni de tenants

## Límites
- Puede modificar: `SuitDashboard/*` (`scan.js`, `index.html`, `data.js`, `*.bat`)
- No debe tocar: código de otros subproyectos (solo los lee)
- Se auto-excluye del escaneo (lista `EXCLUDE` en `scan.js`) para no autolistarse como proyecto
- Dependencias con otros subproyectos: lee el formato de `.suit/registry/projects.yaml` y de `PROJECT_OPTIMAL` en `scripts/mcp-manager.js` de la raíz — si esos archivos cambian de formato, el parseo en `scan.js` puede degradar silenciosamente (fallback a objetos vacíos) sin lanzar error

## Invariantes (no romper nunca)
1. `scan.js` es de solo lectura sobre el resto del repo — nunca escribe fuera de `SuitDashboard/data.js`
2. `data.js` es 100% generado — no se edita a mano, se sobreescribe en cada corrida de `scan.js`
3. Sin dependencias npm — vanilla Node + vanilla JS/CSS, consistente con el invariante F1 (sin frameworks frontend) del contrato raíz

## Definición de terminado
- Validación manual: correr `abrir.bat`, confirmar que carga sin errores de consola y que los KPIs mostrados coinciden con el conteo real de carpetas del repo
- Commit por fase
- Cambios a `scan.js` que agreguen nuevas fuentes de datos requieren actualizar este `CONTRATO.md` (sección Datos)

## Anexo heredado
Proyecto creado en otro IDE, fuera del flujo SuitOS (`/suit-plan → /suit-workflow`). No tenía `CONTRATO.md`, `AGENTS.md` ni `CLAUDE.md` propios antes de este documento.

## POR CONFIRMAR
- Si `SuitDashboard/data.js` debe ir en `.gitignore` (es artefacto 100% generado) o se versiona intencionalmente
- Cadencia esperada de re-ejecución de `scan.js` (¿solo manual, o algún hook/tarea programada?)
- Si `sondear.bat` (invoca `opencode mcp list` / `claude mcp list` como procesos externos) se considera seguro de correr sin supervisión

## Cambios
- 2026-09-25: Contrato inicial creado (fase 0), verificado contra `scan.js`, `index.html`, `abrir.bat` y `sondear.bat`
- 2026-09-25: Ciclo mantenimiento — descripciones de scripts en español (`SCRIPT_DESC_ES`) + columna "Activadores" (fuentes de triggers en `scan.js`)
