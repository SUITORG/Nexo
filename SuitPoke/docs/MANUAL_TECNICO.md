# MANUAL TÉCNICO — SuitPoke

> **Para qué sirve este manual:** documenta el sistema para quien mantiene y configura SuitPoke: arquitectura, endpoints, ejecución, estructura, registro SuitOS y pendientes.
> **Audiencia:** backend — desarrollador o administrador técnico del proyecto.
> **Versión:** 1.0 · **Última actualización:** 2026-09-29 · **Stack:** Node.js stdlib + vanilla JS (cero dependencias) · **Puerto(s):** 3014

---

## Para qué sirve este manual (detalle)

Este manual es el de mantenimiento y configuración. Cubre cómo está construido SuitPoke por dentro, cómo se ejecuta, qué expone la API, cómo se persiste (no se persiste) y qué falta registrar. No cubre el uso de la interfaz (`MANUAL_CLIENTE.md` / `MANUAL_PROVEEDOR.md`) ni las pruebas (`MANUAL_PRUEBAS.md`).

## 1. Arquitectura general

```text
[Navegador: index.html + js/*] ──POST JSON──> [/api/crear | /api/unirse | /api/accion] ─┐
        │                                                                               │
        └──EventSource (SSE)──> [/api/stream] <─────────────────────────────────────────┤
                                                                                  [server.js]
                                                              salas en memoria (Map) ────┤
                                                                                  [js/motor.js]
                                                         MOTOR compartido: mismas reglas
                                                        servidor (autoridad) y cliente (local/IA)
```

Componentes y comunicación (5 puntos):

1. **`js/motor.js` es el corazón compartido** — se carga igual en el navegador (`window.Motor`) y en Node (`module.exports`). Define mazo, reglas de daño, ventajas, IA y la serialización `ver()`.
2. **`server.js` (Node stdlib, sin dependencias)** — sirve estáticos, expone la API JSON y el stream SSE. **El estado de partida es autoritativo aquí**: `Motor.jugarCarta` se ejecuta en el servidor; el cliente solo envía `{idx, objId}` o `pasar`.
3. **Tiempo real por SSE (Server-Sent Events)**, no WebSocket: `GET /api/stream?codigo&token` devuelve `text/event-stream` con `retry: 2000` y *keep-alive* (`: beat` cada 15 s). El servidor emite a cada jugador su propia vista — **cada uno solo ve su mano** (`Motor.ver(st, jid)`).
4. **Salas en memoria** (`Map` codigo → sala): sin base de datos, sin persistencia. Reiniciar `server.js` destruye todas las salas.
5. **Cliente (`juego.js`)** tiene dos caminos: `modo 'local'` (ejecuta el motor en el navegador contra bots) y `modo 'online'` (delegate en `red.js` → API + SSE).

### Motor compartido — por qué importa

Las mismas funciones (`crearPartida`, `jugarCarta`, `pasar`, `iaJugada`, `calcDano`, `ver`) corren en ambos lados. En local, el navegador es la autoridad; en online, el servidor. Esto permite que el modo offline funcione sin red y que el online sea antitrampa con un solo archivo de reglas.

## 2. Stack y ejecución

- **Runtime / lenguaje:** Node.js ≥ 18 (solo `http`, `fs`, `path`, `url`) + vanilla JS/HTML/CSS en cliente.
- **Comandos:**
  - instalar → `no aplica (cero dependencias npm)`
  - desarrollo / producción → `node SuitPoke/server.js` (o `npm start` dentro de `SuitPoke/`)
  - pruebas → `node SuitPoke/test/motor.test.js` (o `npm test`)
  - sintaxis → `node --check <archivo>` por cada `.js` tocado
  - iconos → `npm run iconos` (`scripts/gen-iconos.js`)
  - build → `no aplica (estático, sin bundler)`
- **Puertos:** `3014` (default), configurable con la variable `PORT`.

```bash
node SuitPoke/server.js        # → SuitPoke listo en http://localhost:3014
```

## 3. Variables de entorno

| Variable | Para qué sirve | Obligatoria |
|---|---|---|
| `PORT` | Puerto HTTP del servidor (default `3014`) | no |

**Nunca** committing secretos al repo — y de hecho **SuitPoke no tiene ningún secreto**: no hay claves de API, ni tokens de servicio, ni credenciales. Es una condición del contrato (invariante 6).

## 4. Base de datos y esquema

- **Motor: ninguno.** Decisión explícita del usuario (2026-09-29): SuitPoke queda **fuera del ramal Sheets/Supabase/Brief** — no consume `Config_Empresas` ni ningún motor `db_engine`.
- **Persistencia:** solo `localStorage` del cliente (`sp_nombre`, `sp_sonido`).
- **Estado de sala/partida:** objeto en memoria (`const salas = new Map()` en `server.js`), se pierde al reiniciar el proceso.
- **Multi-tenant: no aplica.** El aislamiento es por **código de sala único** (4 letras, sin I ni O, regenerado si existe).
- **Migraciones:** no aplica.

## 5. API de salas

Base: mismo host y puerto. Todos los POST aceptan/devuelven JSON (`Cache-Control: no-store`).

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/api/crear` | `{nombre}` | `200 {codigo, token, yo:0}` | — |
| `POST` | `/api/unirse` | `{codigo, nombre}` | `200 {codigo, token, yo:id}` | `404` sala no encontrada · `409` ya iniciada · `409` sala llena (máx. 4) |
| `POST` | `/api/accion` | `{codigo, token, tipo, ...}` | `200 {ok[, resumen, efectos]}` | `403` token inválido · `400` errores de flujo |
| `GET` | `/api/stream?codigo&token` | — | `200 text/event-stream` | `404` sala/token inexistente |
| `GET` | `/health` | — | `200 {ok:true, salas:N}` | — |

### Tipos de `/api/accion`

| `tipo` | Payload extra | Permisos | Efecto |
|---|---|---|---|
| `iniciar` | — | **solo el creador** (403 si no) | `Motor.crearPartida` con nombres en orden de id; rellena con bots hasta 2; `iniciada=true`; emite estado + mueve bots |
| `bot` | — | **solo el creador** | Añade `Bot N` (token `bot-<id>`, `esBot:true`); 400 si ya inició o sala llena |
| `jugar` | `idx`, `objId` | el jugador con ese token, en su turno | `Motor.jugarCarta(st, p.id, idx, objId)` → emite a todos + mueve bots |
| `pasar` | — | el jugador con ese token, en su turno | `Motor.pasar(st, p.id)` → emite + mueve bots |

**Validaciones del motor (devueltas como `400 {err}`):** partida terminada, jugador fuera, no es tu turno, carta inválida, objetivo inválido, acción desconocida, «Partida no iniciada».

### Eventos SSE (`data: {json}\n\n`)

| `tipo` | Cuándo | Payload |
|---|---|---|
| `lobby` | al conectar sin partida, al entrar o añadir bot | `{tipo, sala:{codigo, iniciada, jugadores[]}}` |
| `estado` | al conectar con partida, y tras cada acción | `{tipo, sala, vista, turnoDe, yo}` donde `vista = Motor.ver(st, miId)` (mano propia; rivales solo `cartas` = conteo) |

Keep-alive: `: beat` cada 15 000 ms. Reintento del cliente: `retry: 2000`. Si ya había un stream abierto para ese token, se cierra antes de abrir el nuevo.

### Seguridad observada

- Tokens aleatorios de 16 caracteres por jugador; el creador es el `creador` de la sala.
- Nombres sanitizados: máx. 16 chars, se eliminan `<` y `>`.
- Límite de body: 20 000 bytes.
- Estáticos con guardia anti path-traversal (`path.normalize` + `startsWith(RAIZ)` → 403).
- Sin claves, sin CORS configurado (mismo origen), sin credenciales.

## 6. Estructura del proyecto

```text
SuitPoke/
├── server.js               # servidor (salas, API, SSE, estático, barrido de salas)
├── index.html              # SPA (menú, IA, sala, unirse, partida, fin, reglas)
├── sw.js                   # service worker (cache shell 'suitpoke-v1', /api/ siempre red)
├── manifest.webmanifest    # PWA (standalone, portrait, es, iconos 192/512)
├── package.json            # start/test/iconos — sin dependencias
├── css/estilo.css
├── js/motor.js             # motor compartido (también usado por el test)
├── js/juego.js             # cliente de UI y flujos local/online
├── js/red.js               # fetch + EventSource
├── js/sonido.js            # WebAudio (12 efectos)
├── scripts/gen-iconos.js   # genera los PNG de iconos
├── test/motor.test.js      # assert puro (4 suites + 50 partidas simuladas)
└── docs/                   # contrato, guías, manuales, prompt origen, checklist
```

## 7. Despliegue

- **Local:** `node SuitPoke/server.js` → `http://localhost:3014`.
- **Despliegue en hosting:** *pendiente* — no hay workflow de CI ni hosting configurado para SuitPoke (ver `docs/CHECKLIST-LANZAMIENTO.md`). Cualquier host con **Node ≥18 + HTTPS** sirve; solo se necesita que el proceso corra y `PORT` apunte al puerto del host.
- **Validación previa obligatoria:** `node --check` de los `.js` tocados + `node SuitPoke/test/motor.test.js` + pasadas de `VALIDACION.md`.
- **CI/CD del monorepo:** *no aplica* — `push` a `main` publica GH Pages, pero SuitPoke necesita servidor Node, no es estático; no forma parte de ese pipeline.

## 8. Backups y restauración

1. **Qué se respalda:** código en git (el único estado real). **No hay datos que respaldar**: salas y partidas viven en memoria.
2. **Frecuencia:** con cada commit del monorepo.
3. **Dónde:** repositorio git.
4. **Cómo restaurar:** `git checkout` / `git revert` del archivo — el «restaurar» de salas no existe (se pierden al reiniciar por diseño).

## 9. Logs, monitoreo y alertas

- **Logs:** `console.log` de arranque (`SuitPoke listo en http://localhost:3014`); los errores de API se devuelven como JSON `500 {err:'error interno'}` sin loguear stack (ponytail: sin logger).
- **Health:** `GET /health` → `{ok, salas}` — sirve para comprobar que el proceso vive y cuántas salas hay abiertas.
- **Monitoreo de salas:** barrido cada **600 000 ms (10 min)**: borra salas **terminadas**, **sin ningún SSE conectado**, con probabilidad **10 % por pasada** (barrido simple y probabilístico — marcado en el código como `ponytail:`; suficiente con pocas salas). *No hay métricas de retención, jugadores ni errores → pendiente.*
- **Qué monitorear:** proceso caído (health), crecimiento del Map `salas` (memory leak si se llenan de salas «jugando» nunca terminadas), errores 500.
- **A quién alertar:** *pendiente* (no hay canal de alertas definido).

## 10. Registro SuitOS y ADR

| Artefacto | Estado | Detalle |
|---|---|---|
| **ADR-036** — exención multi-tenant/sin DB para SuitPoke | ✅ creado | `.suit/memory/decisions/ADR-036-suitpoke-juego-independiente.md` (2026-09-29): sin `Config_Empresas`, sin `db_engine`, salas en memoria, aislamiento por código, servidor stdlib SSE. |
| **Registro en `.suit/registry/projects.yaml`** | ✅ creado | Entrada `suitpoke`: `path: SuitPoke/`, `environment.PORT: 3014`, `type: game`, sin `db_engine`, `frontend.public: true` sin gate de `Config_Empresas`. |
| **Tabla de puertos en `AGENTS.md`** | ✅ actualizada | Fila `| 3014 | SuitPoke (juego cartas PvP, stdlib, sin DB — ADR-036) |` añadida. |
| **`GuiaTotal/registro/suitpoke.yaml`** | ✅ actualizado | `etapa: construccion`, `documentos.*: true` (analista, taxonomía, contrato, manuales, prompt origen, checklist). |
| `SuitPoke/docs/CONTRATO.md` | ✅ creado | Alcance, invariantes, límites. |
| `SuitPoke/docs/TAXONOMIA.md` | ✅ creado | Industria/Nicho = Otros (no hay nicho Gaming en el catálogo). |

**Invariantes que ningún cambio debe romper** (de `docs/CONTRATO.md`):

1. Vanilla JS en frontend, sin frameworks (regla inmutable #7 del `AGENTS.md` raíz).
2. Cero dependencias npm dentro de `SuitPoke/`.
3. Nombres, arte y textos 100% originales — emular mecánicas TCG, no marcas de Nintendo/Pokémon.
4. Estado de partida autoritativo en servidor: el cliente nunca calcula resultados oficiales.
5. PWA instalable (manifest + SW); offline funciona el modo local/IA.
6. Sin claves ni secretos en el cliente.

## 11. Puertos del monorepo (contexto)

| Puerto | Módulo |
|---|---|
| 3001 | `server.js` principal |
| 3002–3013 | SuitReservaciones, SuitCotizador, ViRe, SuitPedidoExpress, SuitPos, SuitProductos, SuitInventarios, SuitBodega, SuitAI/SuitServiHogar, SuitChatTG, SuitComfy, SuitDiccionario |
| **3014** | **SuitPoke** ← este proyecto (registrar en `AGENTS.md`) |
| 8000 | CampanasAi |

## 12. Problemas frecuentes (operación)

| Síntoma | Causa probable | Acción |
|---|---|---|
| `EADDRINUSE` al arrancar | Puerto 3014 ocupado por otra instancia | Matar el proceso previo o `PORT=3015 node SuitPoke/server.js` |
| Todas las salas desaparecieron | Se reinició el proceso (estado en memoria) | Esperado; crear sala nueva |
| Clientes «congelados» en partida | Servidor abajo o rede caída | Comprobar `GET /health`; el EventSource reintenta solo cada 2 s |
| 500 en la API | Excepción no contemplada | `try/catch` global devuelve `{err:'error interno'}` — añadir log si se necesita depurar |
| Un jugador ve estado ajén | *No debería:* `ver()` filtra la mano por `jid` | Revisar `emitir()` y `Motor.ver` si aparece |
| Salas no se limpian / memoria sube | Salas «jugando» sin terminar y sin barrido efectivo | El barrido solo borra `terminada`; reinicio manual si escala |
| Instalación PWA falla en celular | Sin HTTPS | Ver `CHECKLIST-LANZAMIENTO.md` |

## Datos pendientes de validar

- [ ] Escribir **ADR-036** en `.suit/memory/decisions/`.
- [ ] Registrar **SuitPoke en `.suit/registry/projects.yaml`** (puerto 3014, sin DB).
- [ ] Añadir **3014** a la tabla de puertos de `AGENTS.md` raíz.
- [ ] Actualizar `GuiaTotal/registro/suitpoke.yaml` (etapa y banderas de documentos).
- [ ] Hosting con HTTPS + monitoreo (health, memoria, alertas).
- [ ] Load-test con múltiples salas (GAP de `VALIDACION.md` V3/carga).
