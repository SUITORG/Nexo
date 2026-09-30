# MANUAL PROVEEDOR — SuitPoke

> **Para qué sirve este manual:** enseña al proveedor (aquí: el **anfitrión/operador de sala**) a operar su panel: crear la sala, invitar, añadir bots, iniciar, supervisar la partida y ofrecer revancha.
> **Audiencia:** frontend — usuario anfitrión/operador, conocimientos básicos de celular o navegador.
> **Versión:** 1.0 · **Última actualización:** 2026-09-29 · **Plataforma:** SuitPoke (juego de cartas PvP, navegador/PWA)

---

## Para qué sirve este manual (detalle)

Este manual cubre el lado del anfitrión en la interfaz: cómo abre una sala, qué botones solo él ve, cómo invita a otros, cuántos bots puede añadir, cómo arranca y reinicia la partida. No cubre la vista del jugador (`MANUAL_CLIENTE.md`) ni la configuración del servidor (`MANUAL_TECNICO.md`).

> **Identidad del anfitrión:** quien llama a `crear sala` recibe el **id 0** y el token dueño (`creador`). En el lobby aparece con corona **👑**. El servidor valida el token en cada acción: *«Solo el anfitrión inicia»* / *«Solo el anfitrión añade bots»* (403). En pantalla, los botones de iniciar/bot **solo se ven si `miId === 0`** y la partida no ha empezado.

## 1. Bienvenida

- Creas una sala y **mandas en ella**: solo tú añades bots e inicias.
- Código de **4 letras** + **enlace de invitación** de un toque.
- Hasta **4 jugadores** (humanos + bots mezclados).
- **Revancha** al final para repetir con los mismos.
- Todo corre en el servidor: si cierras la pestaña, la sala sigue ahí (mientras el servidor viva).

## 2. Acceso al portal

No hay registro. Para ser anfitrión:

1. Menú → **🌐 Crear sala online**.
2. Si es tu primera vez, escribe tu **nombre** (se guarda en el dispositivo).
3. Entras directo a la **Sala de espera** con un código generado — ya eres anfitrión (👑).

Si te unes a la sala de otro con **🔑 Unirse con código**, eres **invitado**: no ves los botones de iniciar/bot.

## 3. Panel principal (Sala de espera)

```text
┌──────────────────────────────┐
│         SACD (4 letras)      │  ← código de la sala
│  📋 Copiar enlace invitación │
│  lista de jugadores          │  ← 👑 anfitrión, 🤖 bots, ❤ vida (si ya inició)
│  [🤖 Añadir bot] [▶ Iniciar] │  ← solo anfitrión, solo antes de iniciar
│  Comparte el código (máx. 4) │
│  ← Salir de la sala          │
└──────────────────────────────┘
```

| Elemento | Quién lo ve | Qué hace |
|---|---|---|
| Código de 4 letras | todos | Los invitados lo escriben en «Unirse con código» |
| 📋 **Copiar enlace de invitación** | todos | Copia `<host>/?sala=XXXX` al portapapeles (o abre un prompt para copiarlo a mano) |
| Lista de jugadores | todos | En lobby: «esperando». En partida: ❤ vida de cada uno |
| 🤖 **Añadir bot** | **solo anfitrión** | Añade «Bot N» a la sala (máx. 4 en total) |
| ▶ **Iniciar partida** | **solo anfitrión** | Arranca la partida para todos |
| ← Salir de la sala | todos | Te desconecta del lobby/partida |

**Errores que puede devolver el servidor:**

| Respuesta | Cuándo |
|---|---|
| 403 «Solo el anfitrión inicia» / «Solo el anfitrión añade bots» | Un invitado intentó pulsar esos botones |
| 400 «Sala llena» / 409 «Sala llena (máx. 4)» | Ya hay 4 jugadores |
| 400 «Partida iniciada» | Intentaste añadir bot después de iniciar |
| 400 «Sin jugadores» | Caso imposible en la práctica (siempre hay al menos tú) |

## 4. Gestionar la sala (flujo operativo)

### 4.1 Crear y esperar

1. **🌐 Crear sala online** → llega el código.
2. **📋 Copiar enlace de invitación** y compártelo (WhatsApp, Discord…).
3. Cada invitado que abre el enlace cae en la pantalla de unirse con el código precargado, escribe su nombre y **🔗 Entrar**.
4. La lista se actualiza sola en tiempo real (SSE `lobby`).

### 4.2 Añadir bots

1. **🤖 Añadir bot** — se añade «Bot 1/2/3…» a la lista.
2. Puedes empezar con bots y que se unan humanos después (o al revés): los bots ocupan plazas de las 4.
3. **No puedes añadir bots después de iniciar** (400 «Partida iniciada»).

### 4.3 Iniciar

1. Cuando esté la gente que quieras, **▶ Iniciar partida**.
2. El servidor crea la partida con los nombres por orden de id, **rellena hasta 2 jugadores con bots** si hace falta (nunca hay partidas de 1) y arranca.
3. **Desde ese momento la sala no admite a nadie más** (409 «La partida ya comenzó»).
4. Todos pasan a la pantalla de partida automáticamente (SSE `estado`).

### 4.4 Durante la partida

- Como anfitrión juegas igual que los demás (no tienes poderes extra dentro del combate).
- Solo tú puedes **botones de lobby**; dentro de la partida todos juegan por su turno.
- Los bots del servidor juegan solos en su turno (el servidor los mueve con `moverBots`).
- Los rivales **no ven tu mano** — cada cliente recibe su propia vista (solo el conteo de cartas rivales).

### 4.5 Terminar y revancha

1. Al quedar **un jugador en pie**, todos ven la pantalla de fin (🏆/😵).
2. **🔄 Revancha** — como anfitrión, el botón está visible: relanza la partida con los mismos jugadores y bots de la sala.
3. **← Menú principal** — sale de la sala (el botón de revancha **no** se muestra a los invitados online; solo el anfitrión decide la siguiente partida).

## 5. Evidencias y confirmaciones (si aplica)

**No aplica** — el producto no gestiona entregas, fotos ni PINs.

## 6. Pagos y liquidación (si aplica)

**No aplica** — sin monetización. Ver `MANUAL_CLIENTE.md` §6.

## 7. Perfil y configuración

- **Nombre:** se pide al entrar y queda en el `localStorage` del dispositivo (`sp_nombre`, máx. 16 caracteres). Para cambiarlo en una sala online, escríbelo en la pantalla «Unirse con código» antes de entrar.
- **Sonido 🔊/🔇** en el menú principal (persiste entre sesiones).
- **No hay más configuración** de sala: no hay contraseñas de sala, no hay privacidad por invitación, no hay roles distintos al anfitrión (todos son jugadores; solo el id 0 tiene los 2 botones extra).

## 8. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| No me aparecen los botones 🤖/▶ | No eres el anfitrión (entraste con código) o la partida ya empezó | Crea tu propia sala o espera revancha del anfitrión |
| «Solo el anfitrión inicia» | Un invitado pulsó Iniciar por su cuenta | Normal: solo tú mandas; inténtalo tú |
| Nadie puede entrar con el enlace | Sala ya iniciada | Comparte un código de sala nueva o termina y haz revancha |
| Invitado entró con el código pero no aparece | SSE no conectado | Que recargue (F5); el servidor reenvía el estado inicial al conectar `/api/stream` |
| Se me fue la pestaña a mitad de partida | El token vive solo en la pestaña; al recargar se pierde y `/api/unirse` devuelve 409 «La partida ya comenzó» | **No hay reconexión a partida en curso** (pendiente). Espera a que termine y hagas revancha, o crea sala nueva |
| Añadir bot da «Sala llena» | Ya hay 4 (humanos + bots) | Nadie más cabe; juega con los 4 |
| Los bots no juegan / se «traba» la partida | Servidor caído o sala borrada por limpieza | Verifica `GET /health`; mira `MANUAL_TECNICO.md` §9 |
| Revancha no le aparece a mis amigos | Es intencional | Solo el anfitrión ve el botón; tú relanzas y ellos reciben la nueva partida |

## 9. Diagrama de flujo

```text
[Anfitrión] → [crear sala] → [código + enlace] → [invitar] → [lobby (ajustar bots)]
     → [iniciar] → [partida] → [fin] → [revancha o menú]
```

## Datos pendientes de validar

- [ ] Comportamiento al cerrar y reabrir la pestaña del anfitrión (recuperación de identidad por token).
- [ ] Sala huérfana: ¿cuánto tiempo vive tras terminar? (limpieza probabilística, ver `MANUAL_TECNICO.md` §8).
- [ ] Crear un flujo de re-conexión del anfitrión si se quiere operación más allá de una pestaña.
