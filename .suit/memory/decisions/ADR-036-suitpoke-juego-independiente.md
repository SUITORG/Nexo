# ADR-036: SuitPoke — juego independiente sin multi-tenant, servidor stdlib y tiempo real por SSE

## Status
Accepted (2026-09-29)

## Context
SuitPoke es un juego de cartas PvP online (estilo battler, emula mecánicas TCG sin copiar Pokémon) nacido de una idea del usuario con requisitos explícitos: carpeta `SuitPoke/`, 2-4 jugadores con invitación de amigos, más entretenido que Tetris, PWA para celular, sonido, y guía completa hasta documentación. El panel juzgador emitió **APROBADO CONDICIONAL 6.4/10** con condiciones que exigen: MVP acotado, estado de partida autoritativo en servidor, arte/nombres 100% originales, y registrar puerto + ADR de exención multi-tenant **antes de codificar** (esta segunda parte se hizo en la misma fecha de la primera corrida del ciclo).

Se evaluó su integración con el patrón multi-tenant del monorepo (Config_Empresas / GAS / Supabase). El usuario respondió explícitamente: **no convive con Google Sheets / Config_Empresas**.

## Decisión
1. **Exención multi-tenant y de DB**: SuitPoke no consume `Config_Empresas`, no tiene `id_empresa`, no usa GSHEETS/SUPABASE/NEON. Es un juego opaco al tenant: no hay datos de usuario persistentes (estado de partida en memoria del servidor, salas con TTL por barrido simple).
2. **Servidor propio stdlib en el puerto 3014**: `SuitPoke/server.js` con `node:http` + SSE + JSON — cero dependencias npm (a diferencia del resto del monorepo que usa Express en `server.js:3001`). Justificación: SSE nativo cubre tiempo real unidireccional para un juego por turnos sin añadir `ws`/`socket.io`; el servidor además sirve el estático de la PWA, evitando problemas de CORS.
3. **Motor único compartido servidor/cliente** (`js/motor.js`, UMD simple): el servidor calcula los resultados oficiales (condición del panel: estado autoritativo) y el mismo mazo/reglas alimentan el modo local vs IA sin duplicar lógica.
4. **Salas por código de 4 letras + enlace `?sala=XXXX`**, SSE con keep-alive cada 15 s y `retry: 2000`; token por jugador para autorizar acciones.
5. **PWA offline-first**: cachea el shell (modo vs IA funciona offline); `/api/*` siempre va a red.

## Rationale
- El juego no comparte datos ni UI con el SPA raíz: acoplarlo a multi-tenant solo añadiría tablas y flags sin consumidor.
- Cero dependencias = sin `package.json` con `node_modules`, sin cadena de updates, arranca con `node server.js` en cualquier lado.
- SSE > WebSocket aquí: el cliente solo necesita pushes de estado; las acciones van por POST. Sin reconexión custom (EventSource reintenta solo).
- Motor compartido elimina la divergencia reglas-servidor vs reglas-cliente (bug clásico en juegos online).

## Consecuencias
- Sin persistencia: al reiniciar el servidor se pierden las salas en curso (aceptable para MVP).
- Barrido simple de salas vacías en memoria: no escala a miles de salas simultáneas sin revisión (techo marcado).
- El modo online solo funciona con el servidor corriendo; la PWA offline cubre solo vs IA.
- Exención registrada aquí: si algún día SuitPoke guarda progreso/usuarios, deberá replantearse (login, tabla por tenant o cuenta global).

## Alternativas Considered
- Express + `ws` en el `server.js` raíz (3001): dependencias y acoplamiento al monorepo; rechazado por el contrato del alcance (servidor propio, tocar raíz requiere permiso).
- Pass-and-play local sin servidor: descartado — el usuario eligió explícitamente "Online en tiempo real".
- Supabase Realtime para salas: excesivo para 4 jugadores por sala y violaría la decisión "sin Sheets/Supabase".

## Related
- `SuitPoke/docs/CONTRATO.md` (invariantes 1-6)
- `.suit/logs/panel-juzgador/veredicto.md` (condiciones 1-6)
- `GuiaTotal/registro/suitpoke.yaml` (`convive_sheets: false`)
- `.suit/registry/projects.yaml` → `suitpoke` (puerto 3014)
