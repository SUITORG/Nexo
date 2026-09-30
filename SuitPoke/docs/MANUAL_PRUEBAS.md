# MANUAL DE PRUEBAS — SuitPoke

> **Para qué sirve este manual:** explica cómo validar SuitPoke antes de subir cambios: el autocheck del motor, el smoke manual E2E y los casos ya ejecutados con evidencia.
> **Audiencia:** desarrollador del proyecto que valida cambios antes de subirlos.
> **Versión:** 1.0 · **Última actualización:** 2026-09-29 · **Plataforma:** SuitPoke (juego de cartas PvP, navegador/PWA)

---

## Para qué sirve este manual (detalle)

Cubre solo el entorno de pruebas: cómo correr el test del motor, qué se verifica a mano en navegador (local, online con 2 clientes, PWA, sonido) y qué quedó documentado en `VALIDACION.md`. No cubre uso real (manuales cliente/proveedor) ni operación en producción (`MANUAL_TECNICO.md`).

> **No hay framework de tests, ni mocks, ni CI.** SuitPoke tiene **cero dependencias**, así que el test es `assert` puro de Node y el resto es smoke manual. Eso es intencional (invariante del contrato).

## 1. Qué es el modo de pruebas

**No existe un «modo test» con flag**: el servidor de pruebas es el mismo `server.js` real corriendo en local. Lo que se aísla es el **motor**, que se prueba sin servidor, sin navegador y sin red:

- `test/motor.test.js` importa `js/motor.js` directamente y valida reglas puras con `assert` (sin framework, sin fixtures externas, sin datos de producción).
- El smoke manual recorre la UI real contra `localhost:3014`.

Por qué existe: el motor es el 100 % de la lógica de negocio (daño, ventajas, guardias, IA, terminación) y vive en un solo archivo compartido — probarlo es probar el corazón del juego.

## 2. Activación rápida

```bash
# 1) Autocheck del motor (no necesita servidor)
node SuitPoke/test/motor.test.js

# 2) Sintaxis de todos los JS tocados (obligatorio tras cada edición)
node --check SuitPoke/server.js
node --check SuitPoke/js/motor.js
node --check SuitPoke/js/juego.js
node --check SuitPoke/js/red.js
node --check SuitPoke/js/sonido.js
node --check SuitPoke/sw.js
node --check SuitPoke/test/motor.test.js

# 3) Servidor para el smoke manual
node SuitPoke/server.js        # → http://localhost:3014
```

Salida esperada del test:

```
OK motor: 4 suites, 50 partidas IA vs IA terminaron con ganador
```

También desde la carpeta: `npm test`.

## 3. Qué se mockea y qué no

| Servicio | En modo pruebas | En producción |
|---|---|---|
| Reglas del juego | idénticas (mismo `motor.js`) | idénticas |
| Servidor de salas | real, local (`localhost:3014`) | real (hosting con HTTPS) |
| Base de datos | **no existe** (estado en memoria) | **no existe** |
| IA (bots) | real, corre en proceso | real, corre en proceso |
| Sonido | WebAudio real (sin archivos) | WebAudio real |
| Cliente 2 para online | 2ª ventana/pestaña del navegador o 2º navegador | jugador remoto real |
| PWA | en `localhost` (Chrome permite SW e instalación) | requiere HTTPS |

## 4. Datos de prueba

- **No hay cuentas, ni empresas, ni seeds.** No existe registro ni persistencia.
- Dato de prueba «único»: el **código de sala** generado por el servidor (4 letras de `ABCDEFGHJKLMNPQRSTUVWXYZ`, sin I ni O) — se obtiene al crear la sala, no se fija en ninguna parte.
- Nombre de jugador: se escribe en pantalla y queda en `localStorage` (`sp_nombre`); para repetir el test con estado limpio → DevTools → *Clear site data*.
- Sonido: `localStorage.sp_sonido` = `on`/`off`.

## 5. Recorrido E2E completo (smoke manual)

```text
[Arranque] → [test motor] → [vs IA local] → [crear sala] → [2º cliente con ?sala=] → [iniciar]
   → [jugada cruzada por SSE] → [fin] → [PWA SW + manifest] → [consola limpia]
```

### 5.1 Local vs IA (1 cliente)

1. `node SuitPoke/server.js` → abre `http://localhost:3014`.
2. 🤖 **Jugar vs IA** → elige 1 bot → **⚔️ ¡Combatir!**.
3. Toca una carta → con un solo rival se lanza solo.
4. **Qué esperar ver:** log con «X arroja Y 🔥 contra Z → N de daño»; atacando a un rival **sin guardia** baja la vida (tope 7); si no rompes guardia → «sufre 1 de retroceso» y tu vida −1; tras atacar tu carta aparece como **tu guardia**; el contador `Mazo:` baja y al llegar a 0 se recicla; los bots juegan solos (~850 ms) y suena `turno` cuando te toca.
5. Juega hasta el fin → pantalla 🏆/😵 con sonido y **🔄 Revancha**.

### 5.2 Online con 2 clientes (2 ventanas)

1. Ventana A: **🌐 Crear sala online** → anota el código de 4 letras.
2. Ventana B (incógnito o 2º navegador): abre `http://localhost:3014/?sala=CODI` → debe caer en «Unirse» con el código **precargado** → nombre → **🔗 Entrar**.
3. Ventana A: verifica que B aparece en la lista del lobby (**esta es la prueba del SSE `lobby`**).
4. Ventana A: **▶ Iniciar partida** (solo el anfitrión ve el botón).
5. Ambas ventanas deben pasar solas a la pantalla de partida.
6. Juega en A: la vida/guardia de A debe reflejarse **en B sin recargar** (SSE `estado`).
7. **Qué NO debe verse:** la mano de B nunca aparece en A (solo `Mano: N` de rivales).
8. Errores esperados si fuerzas: entrar con código inexistente → «Sala no encontrada»; entrar después de iniciar → «La partida ya comenzó»; 5º jugador → «Sala llena (máx. 4)».
9. Cerrar B y reabrirla: el servidor debe seguir vivo (`GET /health`).

### 5.3 PWA

1. Chrome → DevTools → *Application → Service Workers*: debe aparecer `sw.js` **activated**.
2. *Application → Manifest*: sin errores, `SuitPoke — Duelo de Cartas`, iconos 192/512.
3. Botón **📥** visible en el menú (tras `beforeinstallprompt`) → instalar.
4. Modo offline: carga la partida local una vez, corta la red (DevTools → Offline) y recarga → **el modo vs IA debe seguir funcionando** (shell cacheado). `/api/` nunca se cachea (va siempre a red).

### 5.4 Sonido

1. Menú → **🔊**: al alternar debe sonar un `click` y el icono cambiar a 🔇/🔊 (persiste tras recargar).
2. En partida: `arrojar` al lanzar, `hit`/`critico`/`bloqueo` según el resultado, `turno` al empezar tu turno, `ganar`/`perder` al final.
3. El navegador exige un gesto previo: el primer clic habilita el AudioContext (no debe haber errores en consola).

### 5.5 Consola

1. DevTools → Console durante todo el recorrido: **0 errores**.
2. Network: `/api/stream` con `Content-Type: text/event-stream` y `retry: 2000`.

## 6. Criterios de pasada

- [ ] `node SuitPoke/test/motor.test.js` → `OK motor: 4 suites, 50 partidas IA vs IA terminaron con ganador`
- [ ] `node --check` de todos los `.js` modificados → sin errores
- [ ] Partida local vs IA completa termina con ganador y revancha funciona
- [ ] 2 clientes ven el lobby y las jugadas cruzadas en tiempo real (sin F5)
- [ ] Un cliente **no** puede ver la mano del otro
- [ ] Enlace `?sala=` precarga el código
- [ ] Service worker activo + manifest sin errores + iconos presentes
- [ ] Consola sin errores
- [ ] `GET /health` responde `{ok:true, salas:N}`

## 7. Problemas frecuentes del modo pruebas

| Problema | Causa | Solución |
|---|---|---|
| Test lanza `Cannot find module '../js/motor.js'` | Ejecutado con otra cwd/ruta | Correr tal cual: `node SuitPoke/test/motor.test.js` desde la raíz del repo |
| `node --check` pasa pero truena en navegador | El check no detecta identificadores no declarados | Correr SIEMPRE el test del motor (aprendizaje #1 de `CORRECCIONES.md`) |
| 500 en `/api/stream` | Uso de `query.get()` sobre objeto plano de `url.parse` | Usar `query.codigo` / `query.token` (aprendizaje #3) |
| El lobby muestra lista vacía | `salaPublica()` leyendo solo `st` (null en lobby) | Fuente dual `st`/`jugadores` (aprendizaje #4) |
| Aparece doble pantalla de fin en local | Dos caminos agendan el fin | Guard de «pantalla de juego activa» (aprendizaje #5) |
| El host se detecta por nombre | Comparación frágil | `App.miId === 0` (aprendizaje #6) |
| El navegador MCP dice «browser already in use» | Locks huérfanos de Chrome/Playwright | Matar procesos MCP filtrando por profile path (aprendizaje #7) |
| No suena nada | AudioContext suspendido hasta primer gesto | Clic previo obligatorio; revisar botón 🔊 |

## 8. Casos de prueba ya ejecutados (`VALIDACION.md`, ronda 1, 2026-09-29)

Veredicto global: **PASA** — 8/8 checks.

| ID | Qué verifica | Comando / acción | Resultado observado | Veredicto |
|----|--------------|------------------|---------------------|-----------|
| V1 | Sintaxis de todo JS nuevo | `node --check` (motor, server, juego, sonido, red, sw, gen-iconos, test) | 8/8 sin errores | PASA |
| V2 | Reglas del motor + terminación | `node SuitPoke/test/motor.test.js` | 4 suites OK; 50 partidas IA vs IA terminan con 1 ganador | PASA |
| V3 | API de salas | curl/IRM: health, crear, unirse, iniciar, jugar, token falso | todos OK; token inválido → 403 | PASA |
| V4 | SSE en tiempo real | `curl -N /api/stream?...` | `retry: 2000` + evento `estado` con vista completa | PASA |
| V5 | UI partida local vs IA | navegador: atacar sin guardia, retroceso, guardia, robo de mazo | log correcto (5 daño, bot resistió, −1 retroceso, mazo 20→18) | PASA |
| V6 | UI online en vivo | enlace `?sala=` → lobby → iniciar por API → jugada cruzada | HP 15→10 reflejado por SSE en el otro cliente, turnos y guardias OK | PASA |
| V7 | PWA | `navigator.serviceWorker.getRegistration()`, manifest, iconos | SW activo, manifest link OK, iconos 192/512 generados | PASA |
| V8 | Consola limpia | Playwright console | 0 errores (warnings menores corregidos) | PASA |

**Evidencia citada:**
- V2: salida `OK motor: 4 suites, 50 partidas IA vs IA terminaron con ganador`
- V3: `jugar: {"ok":true,...,"efectos":["hit","turno"]}` · `token-invalido status: 403`
- V6: snapshot del navegador con `Host 10/15`, log `Amigo arroja Volturi ⚡ → 5 de daño`, chip `▶ TU TURNO` sincronizado

**GAPs documentados (no verificables entonces):**
- Instalación real en dispositivo móvil físico → requiere HTTPS (pendiente de hosting).
- Sonido auditado por oído (verificado solo sin errores en consola).
- Load-test con múltiples salas (el barrido de salas es simple, en memoria).

## Datos pendientes de validar

- [ ] Probar instalación PWA en un celular real (HTTPS).
- [ ] Escuchar los 12 efectos de sonido (calidad no auditada).
- [ ] Carga con varias salas simultáneas (memory/CPU del servidor).
- [ ] Safari iOS (sin `beforeinstallprompt`).
