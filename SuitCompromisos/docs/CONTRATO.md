# CONTRATO — SuitCompromisos
Alcance: `SuitCompromisos` · Contrato padre: ninguno (marco general: `AGENTS.md` raíz) · Fecha: 2026-11-16

## Propósito
Puente personal que replica compromisos locales (localStorage) en el Google Calendar del dueño vía cuenta de servicio — un solo usuario, local-first, sin nube ni mensualidad. Insumo de diseño: `Analista_Proy.md` (2026-11-16, viabilidad MEDIA, 12 fuentes) + `docs/SINTESIS_PROYECTO.md`; panel-juzgador: 6.75 APROBADO CONDICIONAL.

## Stack y ejecución
- Lenguaje / runtime: Node.js puro (módulo `http` nativo) + frontend vanilla en `index.html` (single-file, sin framework). Dependencia `googleapis` resuelta desde `node_modules` de la raíz del repo (sin `package.json` propio).
- Comandos: arrancar `node server.js` (escucha `127.0.0.1:8138`, override `SUIT_COMPROMISOS_PORT`) · pruebas: smoke manual `GET /api/status` + flujo CRUD/sync desde la UI servida/abierta en `:8137` · build: no aplica · pruebas automatizadas: no existen (smoke manual, ver `MANUAL_TECNICO.md`).
- Variables de entorno requeridas (solo nombres): `SUIT_COMPROMISOS_PORT` (opcional).
- Archivos locales de config (nunca commitear): `config.json` (gitignorado; contiene `apiToken`, `calendarId` — PII/seguridad) · credenciales de la cuenta de servicio en `../google-credentials.json` (raíz del repo).

## Datos y multi-inquilino
- Consume `Config_Empresas`: no — app personal, `db_engine: n/a`.
- Motores soportados: ninguno. Persistencia en `localStorage` del navegador + respaldos JSON exportados a `backups/` (y `/api/backup` del server).
- Ubicación de esquema o migraciones: no aplica.
- Reglas de aislamiento entre empresas: no aplica (un solo usuario; no lee datos de ningún tenant). Si algún día se multiusuario, es un rehacer (Analista_Proy §8) — fuera de alcance hasta decisión explícita.

## Límites
- Puede modificar: `SuitCompromisos/**` — con exclusión de `config.json`, `*.log` y `backups/` (no commitear).
- No debe tocar: raíz del repo (salvo lectura de `google-credentials.json`), otros subproyectos, `.github/`. Única escritura fuera del alcance permitida por el ciclo: tarjeta `GuiaTotal/registro/<slug>.yaml` + panel `SuitIdeasSaaS/estado.json` en F7.
- Dependencias con otros subproyectos: UI servida desde `:8137` (MASTER / SuitMisCtas) — es el único Origin permitido por CORS; cuenta de servicio compartida en la raíz.

## Invariantes (no romper nunca)
1. Todo `POST` exige header `X-Suit-Token` igual al `apiToken` de `config.json`; Origins aceptados solo `http://127.0.0.1:8137` y `http://localhost:8137` (sin Origin se permite solo para uso local directo en la laptop). Nada de esto se "abre" para facilitar pruebas.
2. Cada item sincronizado conserva su `suitId` (id local) como identificador único en Google Calendar: un solo evento por item, jamás duplicados; `hecha`/`noRealizada` se refleja en el evento existente, no crea otro.
3. `config.json` y credenciales SA jamás en git, en la UI ni en logs.
4. Cualquier cambio de UI conserva los estados de error visibles en español (`setSync(...,'err')`) y el estado vacío con guía de acción — ver "Piso de calidad" de `calidad-minima` (PASA 2026-11-16), que se adjunta a este contrato.

## Definición de terminado
- Validación en PASA con evidencia en `VALIDACION.md`
- Commit por fase (formato `ciclo(f<n>/<fase>)[SuitCompromisos]: ...`)
- "Sync" de datos: no aplica ciclo F5/F6 de BD (sin motor declarado); la resincronización con Google Calendar es acción manual del usuario desde la UI.
- Push a GitHub: solo con decisión explícita del usuario.

## Anexo heredado
Ninguno — contrato nuevo.

## POR CONFIRMAR
- El diff de trabajo pendiente en `index.html`/`server.js` (estado "No realizada" + vistas de calendario semana/mes + CORS `X-Suit-Token`) es trabajo intencional a validar y commitear en F2/F3, no trabajo a descartar. (Si el usuario lo descarta, revertir antes de F2.)
- `server.log` / `server.err.log` se asumen gitignoreados (no aparecen en `git status`) — verificar antes del commit F2.
- Fechas de "no realizada" (offset de horario) confirmadas solo en smoke; sin casos límite de mes cruzado verificados.

## Cambios
- 2026-11-16: contrato inicial (ciclo F0) — insumo `Analista_Proy.md` 2026-11-16, panel 6.75 condicional, smoke 9/9 del 2026-11-03.
