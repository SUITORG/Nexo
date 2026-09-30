# MANUAL CLIENTE — SuitPoke

> **Para qué sirve este manual:** enseña al cliente final (el jugador/huésped) a usar el frontend del proyecto, paso a paso, de principio a fin.
> **Audiencia:** frontend — usuario cliente sin conocimientos técnicos.
> **Versión:** 1.0 · **Última actualización:** 2026-09-29 · **Plataforma:** SuitPoke (juego de cartas PvP, navegador/PWA)

---

## Para qué sirve este manual (detalle)

Este manual cubre lo que el jugador ve y hace en la interfaz: cómo entrar, los dos modos de juego, cómo instalarse la app en el celular, cómo crearse o unirse a una sala, las reglas y qué hacer si algo falla. No cubre operar la sala como anfitrión (eso está en `MANUAL_PROVEEDOR.md`) ni configuración técnica (`MANUAL_TECNICO.md`).

## 1. Bienvenida

- **SuitPoke** es un duelo de cartas para **2-4 jugadores** en el navegador, partidas de **2-5 minutos**.
- Juegas **contra la IA sin internet** o **online con amigos** por código de invitación.
- **Sin registro, sin cuenta, sin instalar** — abres y juegas.
- Sonido original sintetizado, PWA instalable en el celular.
- 30 cartas originales con 6 elementos, ventajas y habilidades (🛡 💥 🤲).

## 2. Pantalla de inicio

Al abrir `http://localhost:3014` (o el hosting donde esté publicado) ves el menú:

| Botón | Qué hace |
|---|---|
| 🤖 **Jugar vs IA** | Partida local contra 1-3 bots (sin internet) |
| 🌐 **Crear sala online** | Crea una sala y te da código de 4 letras |
| 🔑 **Unirse con código** | Entras a una sala con tu nombre y el código |
| 📖 **Reglas del juego** | Las reglas resumidas dentro del juego |
| 🔊 | Activa/silencia el sonido (se recuerda) |
| 📥 | Instalar la app como PWA (solo aparece si el navegador lo permite) |

La primera vez que entras a un modo te pide **tu nombre de jugador** (se guarda en el dispositivo).

## 3. Registro e inicio de sesión

**No existe registro ni login.** Solo te piden un nombre (máx. 16 caracteres) que queda guardado en tu navegador (`localStorage`). No hay contraseñas, no hay correo, no hay datos personales en un servidor.

## 4. Flujo principal

### Opción A — Jugar vs IA (offline)

1. Menú → **🤖 Jugar vs IA**.
2. Elige **1 bot**, **2 bots** o **3 bots**.
3. **⚔️ ¡Combatir!** → empieza la partida.
4. En tu turno: toca una carta → si hay varios rivales, toca al rival objetivo.
5. **⏭ Pasar** si no quieres atacar.
6. Repite hasta que quede **un jugador en pie** → pantalla de victoria/derrota.
7. **🔄 Revancha** para jugar otra con los mismos bots.

### Opción B — Crear sala online (tú eres el anfitrión)

1. Menú → **🌐 Crear sala online**.
2. Aparece el **código de 4 letras** y tu lista de jugadores (solo tú al principio).
3. **📋 Copiar enlace de invitación** y compártelo, o dile el código a tus amigos.
4. Espera a que entren (máx. 4 jugadores) y pulsa **▶ Iniciar partida**.

> Si quieres operar la sala completa (bots, permisos, revancha), ve `MANUAL_PROVEEDOR.md`.

### Opción C — Unirse a una sala

1. **Abre el enlace de invitación** que te pasaron → caes directo en la pantalla de unirse con el **código ya rellenado**.
   - Sin enlace: menú → **🔑 Unirse con código** y escribe las 4 letras.
2. Escribe **tu nombre**.
3. **🔗 Entrar** → estás en la sala de espera.
4. Cuando el anfitrión pulse **Iniciar**, empieza la partida para todos a la vez.

### Durante la partida

1. Arriba ves a los rivales: vida (❤), **guardia** actual (una carta mini o 🚩 «sin guardia»).
2. Abajo: tu vida, tu guardia, `Mano: N · Mazo: N`, tu mano de cartas y el **log** de lo que pasa.
3. El chip **▶ TU TURNO** marca cuándo te toca. Si no es tu turno, las cartas se ven atenuadas.
4. Toca carta → (elige rival) → se lanza. Verás el resumen del daño y sonido de impacto.
5. Si no rompes la guardia rival, sufres **1 de retroceso**.
6. Tu carta jugada **se convierte en tu guardia** de inmediato.
7. Gana quien quede **en pie con vida**.

## 5. Reglas del duelo (el corazón del producto)

Resumen (versión completa en `GUIA_JUEGO.md`):

1. **2 a 4 jugadores**, 15 de vida y 5 cartas iniciales.
2. En tu turno **robas 1 carta** (máx. 7) y **arrojas 1 carta** contra un rival.
3. **Anillo de elementos:** 🔥→🌱→💧→⚡→🪨→👻→🔥. Vencer = **+3** de ataque; perder = **−2**.
4. Comparas **poder + bonus** contra la **defensa de la guardia** rival. Si la superas: daño = diferencia (**máx. 6**) y su guardia se destruye.
5. Sin guardia rival: daño directo (**máx. 7**). Si no logras romperla: sufres **1 de retroceso**.
6. Tras atacar, **tu carta pasa a ser tu guardia** (la anterior va al descarte).
7. **Habilidades:** 🛡 Escudo (+4 defensa como guardia) · 💥 Crítico (daño ×2 al romper) · 🤲 Robo (al romper, robas 1 carta al rival).
8. Gana quien quede **en pie**. Sin mazo, se **recicla el descarte**.

## 6. Pagos y comprobantes (si aplica)

**No aplica.** SuitPoke es gratuito, sin compras, sin anuncios y sin monetización.

## 7. Instalar la PWA en el celular

1. Abre SuitPoke en **Chrome (Android)** o en **Safari (iOS)**.
2. **Android/Chrome:** cuando el navegador lo permita aparece el botón **📥** en el menú → tócalo → **Instalar**. Si no aparece, menú del navegador → *Instalar aplicación / Añadir a pantalla de inicio*.
3. **iOS/Safari:** botón **Compartir** → **Añadir a pantalla de inicio**.
4. Se instala como **SuitPoke** con icono propio, pantalla completa vertical, color #12102a.
5. Una vez instalada y cargada, **el modo vs IA funciona sin conexión** (el service worker cachea el juego). El modo online sí necesita internet.

> Pendiente: la instalación real en celular requiere **HTTPS** — en `localhost` Chrome la permite, en un celular sobre red local o sin HTTPS no (ver `CHECKLIST-LANZAMIENTO.md`).

## 8. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| «Sala no encontrada» | Código mal escrito o sala ya borrada | Verifica las 4 letras; pide un enlace nuevo al anfitrión |
| «La partida ya comenzó» | La sala ya fue iniciada | Pide al anfitrión que haga **Revancha** al terminar, o crea una sala nueva |
| «Sala llena (máx. 4)» | Ya somos 4 | Juega en otra sala o el modo vs IA |
| «No es tu turno» | Tocaste una carta fuera de tu turno | Espera el chip **▶ TU TURNO** |
| No escuchas sonido | Sonido silenciado o gesto previo | Botón **🔊** en el menú; el navegador requiere un toque antes de emitir audio |
| Botón 📥 no aparece | Navegador sin soporte (p. ej. iOS Safari) | Usa *Compartir → Añadir a pantalla de inicio* |
| No me instala / no abre offline | Sin HTTPS | Ver `CHECKLIST-LANZAMIENTO.md` (pendiente de hosting) |
| Se desconectó de la sala online | Corte de red o el servidor se cayó | El navegador reintenta solo (SSE `retry: 2000`) mientras la pestaña siga abierta. **Si recargaste en plena partida no hay reconexión** (pendiente): espera a que terminen o pide sala nueva |
| No veo a mis amigos entrar | Todavía en lobby con la lista vacía | Solo aparecen al entrar; recarga con F5 si persiste |

## 9. Diagrama de flujo

```text
[Jugador] → [menú] → ┬→ [vs IA] → [elige bots] → [partida] → [fin] → [revancha/menú]
                      ├→ [crear sala] → [código 4 letras] → [compartir enlace] → [iniciar] → [partida]
                      └→ [unirse con código o enlace] → [sala de espera] → [anfitrión inicia] → [partida] → [fin]
```

## Datos pendientes de validar

- [ ] Instalación real de la PWA en un dispositivo físico (requiere HTTPS/hosting).
- [ ] Comportamiento en Safari iOS (sin `beforeinstallprompt`, según análisis de mercado).
- [ ] Publicación en hosting con enlace de invitación definitivo.
