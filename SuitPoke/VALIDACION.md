# VALIDACION — ciclo: SuitPoke (juego de cartas PvP PWA online)
Fecha: 2026-09-29 · Contrato: SuitPoke/docs/CONTRATO.md · Ronda: 1

| ID | Verifica | Empresa / db_engine | Comando o acción | Resultado observado | Veredicto |
|----|----------|---------------------|------------------|---------------------|-----------|
| V1 | Sintaxis de todo JS nuevo | n/a (sin DB) | `node --check` motor, server, juego, sonido, red, sw, gen-iconos, test | 8/8 sin errores | PASA |
| V2 | Reglas del motor + terminación | n/a | `node SuitPoke/test/motor.test.js` | 4 suites OK; 50 partidas IA vs IA terminan con 1 ganador | PASA |
| V3 | API de salas | n/a | curl/IRM: health, crear, unirse, iniciar, jugar, token falso | todos OK; token inválido → 403 | PASA |
| V4 | SSE en tiempo real | n/a | `curl -N /api/stream?...` | `retry: 2000` + evento `estado` con vista completa | PASA |
| V5 | UI partida local vs IA | n/a | navegador: atacar sin guardia, retroceso, guardia, robo de mazo | log correcto (5 daño, bot resistió, −1 retroceso, mazo 20→18) | PASA |
| V6 | UI online en vivo | n/a | enlace `?sala=` → lobby → iniciar por API → jugada cruzada | HP 15→10 reflejado por SSE en el otro cliente, turnos y guardias OK | PASA |
| V7 | PWA | n/a | `navigator.serviceWorker.getRegistration()`, manifest, iconos | SW activo, manifest link OK, iconos 192/512 generados | PASA |
| V8 | Consola limpia | n/a | Playwright console | 0 errores (warnings menores corregidas: meta obsoleta, audio pre-gesto) | PASA |

## Evidencia
- V2: salida `OK motor: 4 suites, 50 partidas IA vs IA terminaron con ganador`
- V3: `jugar: {"ok":true,...,"efectos":["hit","turno"]}` · `token-invalido status: 403`
- V6: snapshot navegador mostró `Host 10/15`, log `Amigo arroja Volturi ⚡ → 5 de daño`, `▶ TU TURNO` sincronizado

## GAPs (no verificable ahora)
- Instalación real en dispositivo móvil físico: requiere HTTPS en red (en localhost Chrome lo permite; para celulares pendiente publicar/hostear)
- Sonido: sintetizado por WebAudio (verificado sin errores en consola, no auditado por oído)
- Carga simultánea: no se hizo load-test con múltiples salas (barrido simple de salas en memoria)

## Veredicto global
PASA — motor, API, SSE, UI local/online y PWA verificados con evidencia ejecutada.
