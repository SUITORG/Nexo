# CONTRATO — SuitPoke
Alcance: `SuitPoke/` · Contrato padre: `CONTRATO.md` (raíz) + `AGENTS.md` · Fecha: 2026-09-29

## Propósito
Juego de cartas PvP online (estilo battler — emula mecánicas de TCG, NO copia Pokémon) jugable como PWA en móvil y desktop: salas por código de invitación, 2-4 jugadores en tiempo real, oponentes IA, sonido, partidas de 2-5 min.

## Stack y ejecución
- Lenguaje / runtime: Node.js puro (cero dependencias npm) + vanilla JS/HTML/CSS
- Comandos: instalar `no aplica (cero deps)` · desarrollo `node SuitPoke/server.js` (puerto 3014) · pruebas `node --check <archivo>` + smoke manual · build `no aplica (estático)`
- Variables de entorno requeridas: `PORT` (opcional, default 3014)

## Datos y multi-inquilino
- Consume `Config_Empresas`: no (decisión explícita del usuario, 2026-09-29 — fuera del ramal Sheets/Supabase/Brief)
- Motores soportados: ninguno — estado de partida en memoria del servidor (sin persistencia)
- Ubicación de esquema o migraciones: no aplica
- Reglas de aislamiento entre empresas: no aplica; las salas se aislAN por código único (4 letras), sin datos de usuario persistentes

## Límites
- Puede modificar: `SuitPoke/**`; para el alta del proyecto: `.suit/registry/projects.yaml`, `.suit/memory/decisions/` (ADR), `AGENTS.md` (tabla de puertos), `GuiaTotal/registro/suitpoke.yaml`
- No debe tocar: `server.js` raíz, `backend/`, otros subproyectos, `.github/workflows/`
- Dependencias con otros subproyectos: ninguna — servidor y frontend propios

## Invariantes (no romper nunca)
1. Vanilla JS en frontend, sin frameworks (AGENTS.md regla inmutable #7)
2. Cero dependencias npm dentro de `SuitPoke/`
3. Nombres, arte y textos 100% originales — emular mecánicas de TCG, no marcas/personajes de Nintendo/Pokémon (condición panel-juzgador)
4. Estado de partida autoritativo en servidor: el cliente nunca calcula resultados oficiales (condición panel-juzgador)
5. PWA instalable (manifest + service worker); offline funciona el modo local/IA, online requiere servidor
6. Sin claves ni secretos en el cliente; sin `service_role` ni tokens

## Definición de terminado
- Validación en PASA con evidencia en `VALIDACION.md`
- Commit por fase
- Sync de datos: no aplica (sin DB)

## POR CONFIRMAR
- Ninguno — todo derivado de decisiones explícitas del usuario (multijugador online, sin Sheets) o del panel juzgador.

## Cambios
- 2026-09-29: creación (fase 0) a partir de Analista_Proy.md + veredicto panel-juzgador APROBADO CONDICIONAL
