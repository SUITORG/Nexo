# GUIA DE JUEGO — SuitPoke

> Guía completa para jugadores. Todo lo de aquí está implementado en `js/motor.js` (motor) y `index.html` (pantalla de reglas).
> **Última actualización:** 2026-09-29

---

## 1. Concepto

SuitPoke es un **duelo de cartas por turnos para 2 a 4 jugadores**. Emula mecánicas de juegos de cartas coleccionables (TCG/battler): elementos con ventajas, poder de ataque vs defensa de guardia, habilidades especiales. **No copia Pokémon** ni ninguna marca — las 30 cartas, sus nombres y el arte son originales.

- Partidas de **2 a 5 minutos**.
- Juegas en el navegador (PC o celular), sin descargar nada.
- Dos modos: **contra la IA** (offline) o **salas online** con tus amigos por código.

## 2. Participantes

| | |
|---|---|
| **Jugadores** | 2 a 4 (mínimo 2: si el anfitrión inicia solo, el servidor añade bots hasta 2) |
| **Bots** | Hasta 3 rivales IA — en modo local los eliges tú; online los añade el anfitrión |
| **Anfitrión** | Quien crea la sala (id 0, corona 👑). Solo él añade bots e inicia |

Cada jugador empieza con **15 de vida** y **5 cartas** en mano.

## 3. Paso a paso de una partida

1. **Reparto** — todos reciben 5 cartas; vida inicial 15.
2. **Tu turno** — robas **1 carta** (máximo 7 en mano) y **arrojas 1 carta** contra un rival (o pasas).
3. **Resolución** — se compara tu poder (+ ventaja elemental) contra la guardia del rival. O le haces daño, o te da 1 de retroceso.
4. **Guardia** — la carta que arrojaste **pasa a ser tu nueva guardia** (la anterior va al descarte).
5. **Siguiente jugador** — el turno avanza al siguiente vivo.
6. **Fin** — queda fuera quien llega a 0 de vida. **Gana el último en pie.**
7. **Sin cartas en el mazo** — se recicla el descarte (se baraja de nuevo).

## 4. Reglas exactas del motor

| Regla | Valor exacto |
|---|---|
| Vida inicial | **15** |
| Mano inicial | **5** cartas |
| Mano máxima | **7** cartas (si llegas a 7, no robas más) |
| Robo por turno | **1** carta al iniciar tu turno |
| Daño directo (rival sin guardia) | diferencia de ataque, **máximo 7** |
| Daño vs guardia | diferencia (poder+bonus − defensa), **máximo 6** |
| Crítico al romper guardia | daño × 2, **máximo 9** |
| Retroceso (no rompes la guardia) | **1** de daño a ti mismo |
| Tras atacar | tu carta jugada **pasa a ser tu guardia** (la anterior → descarte) |
| Mazo vacío | se **recicla el descarte** barajándolo |
| Ataque mínimo | nunca baja de **1** (aunque la ventaja/restas lo bajen) |
| Log | se conservan las últimas **60** líneas |

### 4.1 El anillo de 6 elementos

```
🔥 fuego → 🌱 planta → 💧 agua → ⚡ rayo → 🪨 tierra → 👻 fantasma → 🔥 fuego
```

Cada elemento **vence al siguiente** del anillo:

| Tu elemento | Contra | Efecto sobre tu ataque |
|---|---|---|
| 🔥 fuego | 🌱 planta | **+3** |
| 🌱 planta | 💧 agua | **+3** |
| 💧 agua | ⚡ rayo | **+3** |
| ⚡ rayo | 🪨 tierra | **+3** |
| 🪨 tierra | 👻 fantasma | **+3** |
| 👻 fantasma | 🔥 fuego | **+3** |
| Cualquiera | el que le vence a él | **−2** (desventaja) |
| Mismo elemento / sin relación | — | sin cambio |

El bonus se aplica **solo si hay guardia rival**: se compara contra la defensa. Si no hay guardia, el ataque va directo a la vida (también con el bonus, tope 7).

### 4.2 Fórmula de daño

```
sin guardia:   daño = min(poder ± ventaja, 7)

con guardia:   ataque  = poder + (+3 ventaja | −2 desventaja | 0)   [mínimo 1]
               defensa = defensa de la guardia (+ 4 si tiene 🛡 escudo)
               si ataque > defensa:
                   daño = min(ataque − defensa, 6)
                   si tu carta es 💥 crítico: daño = min(daño × 2, 9)
                   → el rival pierde su guardia (va al descarte)
               si ataque ≤ defensa:
                   daño = 1 para TI (retroceso), la guardia rival resiste
```

### 4.3 Habilidades especiales (3)

| Icono | Habilidad | Efecto |
|---|---|---|
| 🛡 | **Escudo** | Cuando esa carta está de guardia, su defensa efectiva es **+4** |
| 💥 | **Crítico** | Al romper una guardia, el daño se **duplica** (máx. 9) |
| 🤲 | **Robo** | Al romper la guardia rival, **robas 1 carta** al azar de su mano |

## 5. Catálogo — las 30 cartas del mazo

5 cartas por elemento (mazo base de 30, barajado al inicio de cada partida).
`⚔` = poder · `🛡` = defensa · `h` = habilidad.

### 🔥 Fuego
| # | Nombre | ⚔ | 🛡 | Habilidad |
|---|---|---|---|---|
| 1 | Vulcanix | 7 | 3 | — |
| 2 | Brascus | 4 | 2 | — |
| 3 | Ignaro | 5 | 3 | — |
| 4 | Pirovex | 6 | 1 | 💥 Crítico |
| 5 | Cinabrio | 3 | 4 | — |

### 💧 Agua
| # | Nombre | ⚔ | 🛡 | Habilidad |
|---|---|---|---|---|
| 6 | Tideon | 7 | 3 | — |
| 7 | Marea | 4 | 4 | — |
| 8 | Nixina | 5 | 2 | — |
| 9 | Coralfin | 3 | 5 | 🛡 Escudo |
| 10 | Ondara | 6 | 2 | 🤲 Robo |

### 🌱 Planta
| # | Nombre | ⚔ | 🛡 | Habilidad |
|---|---|---|---|---|
| 11 | Verdania | 7 | 3 | — |
| 12 | Musgoth | 4 | 4 | — |
| 13 | Espinar | 5 | 3 | — |
| 14 | Florigon | 6 | 1 | 💥 Crítico |
| 15 | Tallox | 3 | 4 | — |

### ⚡ Rayo
| # | Nombre | ⚔ | 🛡 | Habilidad |
|---|---|---|---|---|
| 16 | Volturi | 8 | 2 | — |
| 17 | Chispa | 4 | 2 | — |
| 18 | Ampere | 5 | 3 | — |
| 19 | Teslum | 6 | 2 | 🤲 Robo |
| 20 | Fulgor | 3 | 5 | 🛡 Escudo |

### 🪨 Tierra
| # | Nombre | ⚔ | 🛡 | Habilidad |
|---|---|---|---|---|
| 21 | Terragon | 7 | 4 | — |
| 22 | Gravillo | 4 | 5 | — |
| 23 | Petrux | 5 | 4 | — |
| 24 | Dunal | 6 | 2 | — |
| 25 | Ocreon | 3 | 5 | 🛡 Escudo |

### 👻 Fantasma
| # | Nombre | ⚔ | 🛡 | Habilidad |
|---|---|---|---|---|
| 26 | Umbrax | 8 | 2 | — |
| 27 | Noctis | 5 | 3 | — |
| 28 | Spectrin | 6 | 1 | 💥 Crítico |
| 29 | Velisto | 3 | 4 | 🤲 Robo |
| 30 | Polterg | 4 | 4 | — |

**Curiosidades del diseño:** Volturi y Umbrax son las de mayor poder (8). Las tres 💥 críticas (Pirovex, Florigon, Spectrin) tienen 1 de defensa — vidrio roto. Las 🛡 escudo (Coralfin, Fulgor, Ocreon) tienen 3 de poder y 5 de defensa → 9 efectivos de guardia.

## 6. Modos de juego

### 6.1 vs IA local (offline)

1. Menú → **🤖 Jugar vs IA**.
2. Elige **1, 2 o 3 bots** y pulsa **⚔️ ¡Combatir!**.
3. Eres el jugador 1. Funciona **sin internet** (la PWA cachea el juego).
4. Los bots juegan solos con ~850 ms de pausa entre jugadas.

### 6.2 Sala online por enlace o código

**Anfitrión:**
1. Menú → **🌐 Crear sala online**.
2. Verás un **código de 4 letras** y la lista de jugadores.
3. Pulsa **📋 Copiar enlace de invitación** → compartes el enlace `.../?sala=ABCD` (o solo el código).
4. Opcional: **🤖 Añadir bot** (hasta 4 en total).
5. **▶ Iniciar partida** cuando estén todos.

**Invitado:**
1. Abre el enlace (te lleva directo al formulario con el código rellenado) o entra al menú → **🔑 Unirse con código**.
2. Escribe el código de 4 letras y tu nombre → **🔗 Entrar**.
3. Espera a que el anfitrión inicie.

| Regla de sala | Valor |
|---|---|
| Máximo de jugadores | **4** |
| Código | 4 letras mayúsculas (sin I ni O) |
| Únete después de iniciar | No permitido (409 «La partida ya comenzó») |
| Sala llena | No permitido (409 «Sala llena (máx. 4)») |

### 6.3 Cómo se juega en pantalla

- **Toca tu carta** → si hay más de un rival vivo, te pide **elegir al rival objetivo** (toca su ficha). Toca de nuevo la carta para cancelar.
- Con **un solo rival vivo**, la carta se lanza directo a él.
- **⏭ Pasar** — termina tu turno sin atacar.
- En tu turno las cartas están brillantes; fuera de él aparecen atenuadas.
- Arriba: fichas de rivales con **barra de vida**, **guardia** actual (o 🚩 sin guardia) y tu chip **▶ TU TURNO**.
- Abajo: tu vida, tu guardia, `Mano: N · Mazo: N` y el log de partidas.

## 7. Consejos estratégicos

1. **Guardia con escudo primero** — Coralfin/Fulgor/Ocreon de guardia = 9 de defensa; casi nada te rompe en un turno.
2. **Guardia barata, ataque caro** — deja Cinabrio/Tallox (3⚔/4🛡) de guardia y reserva Volturi/Umbrax (8⚔) para cuando el rival esté sin guardia: ahí vale 7 de daño directo.
3. **Mira el elemento de su guardia, no solo la defensa** — ejemplo: Umbrax 👻 (8⚔) contra Vulcanix 🔥 de guardia (3🛡) → ventaja +3 → ataque 11 vs defensa 3 → diferencia 8, pero el daño se topa en **6**. El tope de 6 hace que casi cualquier ventaja rompa guardias bajas de una; sin ventaja serían solo 5 (8−3)… y sigue rompiendo. Donde de verdad decide el elemento es cuando la defensa está cerca de tu poder.
4. **Guarda el crítico para guardias gordas** — 💥 solo multiplica al **romper**. Contra 9 de guardia escudada necesitas ≥10 de ataque para que rinda.
5. **🤲 Robo es robo de tempo** — quitas una carta al rival y te la quedas: en manos de 6-7 cartas vale más que 1 de daño extra.
6. **No pases por miedo al retroceso** — fallar cuesta **1** de vida, pero te deja la carta como guardia. A veces es la jugada correcta: conviertes un ataque flojo en defensa.
7. **Cuenta el mazo** — cuando `Mazo: 0`, el descarte se recicla: no hay peligro de quedarte sin cartas, pero el orden se rebaraja.
8. **Ráfagas contra sin guardia** — sin guardia el tope es 7, pero el daño va **directo a la vida**: con 15 de vida, 3 golpes directos serios terminan la partida.

## 8. Invitar a amigos

1. Crea la sala online.
2. Pulsa **📋 Copiar enlace de invitación** → se copia `https://<tu-host>/index.html?sala=ABCD`.
3. Compártelo por WhatsApp/cualquier chat. Al abrirlo, el amigo cae directo en la pantalla de unirse con el código **ya rellenado**.
4. Alternativa: dile solo el **código de 4 letras** y que lo escriba en **🔑 Unirse con código**.
5. El nombre que escriba ahí se guarda en su dispositivo para futuras partidas.

## 9. Al final de la partida

- **🏆 Victoria** / **😵 Derrota** + sonido de ganar/perder.
- **🔄 Revancha** — en modo local reinicia contra los mismos bots; online **solo lo ve el anfitrión** y relanza la partida con los mismos jugadores.
- **← Menú principal** — sale de la sala/partida.

## 10. Sonido y app

- **🔊 / 🔇** en el menú principal activa o silencia (se recuerda entre sesiones).
- **📥 Instalar app** aparece en el menú cuando el navegador lo permite (Chrome/Android); instala SuitPoke como aplicación con pantalla completa vertical.
- El modo local/IA funciona **sin conexión** una vez cargado; el modo online necesita el servidor.
