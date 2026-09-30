# Analista_Proy — SuitPoke (juego de cartas battler/PVP en navegador PWA)

> Investigado: 2026-09-29 | Fuentes consultadas: 100

## Resumen ejecutivo

**Veredicto: viabilidad MEDIA.** Hay mercado real y medible: los juegos de cartas digitales mueven ~$2.8–3.7 mil M USD en 2025 (CAGR 7–11%) y el mercado de juegos de navegador otros ~$11.8 mil M; la demanda de partidas cortas, sociales y sin instalar está confirmada por datos (sesiones top 8–9 min, mediana 5–6 min; los juegos jugables en navegador convierten ~3× más que los que requieren descarga). Los competidores prueban que el género monetiza (Pokémon TCG Pocket: $1.3 mil M y 150 M descargas en su primer año), pero también que decae rápido (−50% ingresos y −60% jugadores iOS en 10 meses). **Riesgo #1: retención + ausencia de precedente rentable en el subnicho** — los card battlers de navegador existentes son todos indies diminutos (6 ratings en itch.io) y la monetización web es durísima (80% de juegos pagados en itch.io ganan <$50/mes); sin un motor de retorno (progresión/colección) y masa crítica de jugadores, el multijugador por salas muere por frío.

## Clasificación sugerida

- **Industria:** Gaming / Juegos digitales — sector con $80 mil M+ en apps móviles (2024) y $11.8 mil M solo en juegos de navegador ([Dataintelo](https://dataintelo.com/report/browser-game-market), [Unity](https://unity.com/es/blog/2025-mobile-gaming-trends-industry-perspectives)).
- **Nicho:** Juegos de cartas coleccionables digitales (TCG) & battler PvP casual — segmento de ~$2.8–3.7 mil M en 2025 con F2P dominante (62–74% de los ingresos) y móvil como plataforma líder (51%) ([Market Intelo](https://marketintelo.com/report/digital-collectible-card-games-market), [Global Growth Insights](https://www.globalgrowthinsights.com/es/market-reports/digital-collectible-card-games-market-122539), [QY Research](https://www.qyresearch.com/reports/6097719/digital-card-games)).
- **Especialización:** PWA social multijugador ligera, sin instalar, partidas relámpago con invitación por código — ángulo validado: el patrón "crea sala → comparte código/link → juega en 10 segundos" ya está probado por GameBuddies, PlayParty, cardgames.io (mesas privadas con código de 4 letras) y DUDELZ ([GameBuddies](https://gamebuddies.io/), [PlayParty](https://playparty.fun/), [cardgames.io](https://cardgames.io/es/crazyeights/), [DUDELZ](https://dudelz.com/)).
- **Hipótesis inicial vs hallazgo:** **Se mantuvo con ajuste menor.** Industria y Especialización confirmadas tal cual. El Nicho se ancla mejor en la intersección *TCG digital × juegos de navegador* (dos mercados de $3 mil M y $11.8 mil M respectivamente) y se le añade un requisito implícito que la hipótesis no contemplaba: **progresión/colección + IA competente como motor de retorno**, porque el PvP puro por invitación no sostiene retención sin masa crítica.

## Pilar 1 — Fundamentos expertos del sector

**Tamaño de mercado (triangulado, 3+ fuentes independientes):**
- Juegos de cartas coleccionables digitales 2025: **$2.8 B** ([Market Intelo](https://marketintelo.com/report/digital-collectible-card-games-market)) / **$3.38 B** ([Global Growth Insights ES](https://www.globalgrowthinsights.com/es/market-reports/digital-collectible-card-games-market-122539)) / **$3.71 B** ([QY Research](https://www.qyresearch.com/reports/6097719/digital-card-games)). Consenso: **~$3–3.7 mil M, CAGR 7.4–11%**.
- TCG en móvil: **$1.14–2.15 mil M en 2025**, CAGR 8–10.6% ([QY Research](https://www.qyresearch.com/reports/4771833/trading-card-games--tcg--on-mobile), [Grand Research Store](https://www.grandresearchstore.com/services/global-mobile-trading-card-game-market), [PW Consulting](https://pmarketresearch.com/it/trading-card-games-tcg-on-mobile-market/)).
- Juegos de navegador: **$11.8 B en 2025 → $16.3 B en 2034** (CAGR 3.5%), con móvil/tablet ya en 44.6% de las sesiones ([Dataintelo](https://dataintelo.com/report/browser-game-market)).
- F2P = **62.4% de los ingresos** ($1.747 B) y es el segmento que más crece (8.2% CAGR), con monetización vía cosméticos, battle passes y seasonales ([Market Intelo](https://marketintelo.com/report/digital-collectible-card-games-market)); ~74% de jugadores activos eligen juegos gratuitos ([Global Growth Insights](https://www.globalgrowthinsights.com/es/market-reports/digital-collectible-card-games-market-122539)).

**Principios innegociables (evidencia):**

1. **Las sesiones cortas y repetidas predicen retención.** Session count correlaciona con D1 a **r=0.84, p<0.001** en 35 prototipos móviles ([Session Architecture Predicts Mobile Game Retention](https://exa.ai/library/publication/dpzsp7nglfs)). La media de sesión cayó: top-tier 8–9 min, mediana 5–6 min; el diseño debe priorizar "loops rápidos y repetidos" ([GameAnalytics Mobile Gaming Benchmarks 2025](https://gameindustrylibrary.com/documents/gameanalytics-mobile-gaming-benchmarks-2025)). → Las partidas de 2–5 min de SuitPoke están alineadas con la corriente.
2. **El matchmaking es retención, no cosmética.** En 6 millones de partidas de 262k jugadores: emparejar con rivales más fuertes **aumenta** el churn (+0.13% por punto de gap), la varianza de habilidad aumenta churn (+0.23%), y cada punto de win-rate extra lo baja (−0.31%) ([Heliyon: Match experiences affect interest](https://www.cell.com/heliyon/fulltext/S2405-8440(24)00922-8)). → En salas de 2–4 jugadores con código, el equilibrio debe venir de la mecánica (elementos/ventajas simétricas), no de MMR poblacional.
3. **Los bots malos matan el rematch.** En un battler PVP real (Battle Cards): *"los jugadores que jugaron contra bots tuvieron 80% menos probabilidad de repetir partida que los que jugaron contra humanos"*, y la recomendación final del estudio fue **cancelar el desarrollo** ([Creating a Monetization Model for a Free-to-play Mobile Game — Rockbite](https://www.theseus.fi/bitstream/handle/10024/779991/Makinen_Joona.pdf?isAllowed=y&sequence=2)). → La IA oponente de SuitPoke no es feature secundaria: es el colchón de retención cuando no hay amigos online.
4. **Diseño de cartas: goal claro, inercia, catch-up.** Hearthstone triunfó con objetivo simple ("bajar la vida a 0"), un recurso que crece cada turno y turnos sin interrupción; los buenos deckbuilders terminan antes de aburrir y el draw aleatorio ya es un catch-up natural ([Designing and creating a deckbuilding game](https://exa.ai/library/publication/xcnklrgcv2p)). Ritmo de recompensas: primer hook ~10 min de juego ([Balancing a skill-based progression system — Theseus](https://www.theseus.fi/bitstream/handle/10024/814458/Joni_Suojanen.pdf?isAllowed=y&sequence=2)).
5. **PWA + cartas/turnos = el mejor caso de uso web.** "Para 2D, puzzle, **cartas**, estrategia por turnos, visuales e idle, un PWA bien optimizado es indistinguible de una app nativa en respuesta y fps" ([PWA Games — Abratabia](https://www.abratabia.com/pwa-games/)). Y en networking: **"no vale la pena migrar a WebTransport para juegos por turnos, cartas, chat o lobby — WebSocket ya hace exactamente lo que necesitan"** ([Simplified Media: WebTransport for Browser Games](https://simplified.media/guides/webtransport-browser-games)). → Stack técnico barato y correcto: Canvas 2D + WebSocket + salas.
6. **Límites reales del navegador móvil:** 150–300 MB por pestaña en Android, 100–200 MB en iOS, throttling térmico a los 3–5 min, y **iOS limita PWA** (sin `beforeinstallprompt`, ~50 MB de storage sin instalar, push poco fiable) ([Mobile Browser Performance for Web Games](https://www.abratabia.com/mobile-browser-performance/), [PWA Games](https://www.abratabia.com/pwa-games/), [web.dev Progressive Web Apps](https://web.dev/learn/pwa/progressive-web-apps)). → Un juego de cartas ligero cabe holgadamente; el riesgo iOS es de descubrimiento/push, no de performance.

## Pilar 2 — Productos de éxito del sector

### Pokémon TCG Pocket — 150 M descargas, $1.3 mil M en el primer año
- Qué hace bien: apertura de sobres por impulso optimizada para móvil, expansiones mensuales, colección con IP fuerte; fue el **mobile card battler #1 de todos los tiempos por ingresos** ([Sensor Tower](https://sensortower.com/blog/pokemon-tcg-pocket-100-million-downloads), [PocketGamer.biz](https://www.pocketgamer.biz/pokemon-tcg-pocket-dethrones-pokemon-go-as-it-celebrates-first-anniversary-and-13bn/)).
- Patrón replicable: **vuelta corta diaria** (1 sobre gratis/día) + novedad mensual que reactiva picos (+217% de gasto al lanzar expansión).
- Advertencia: cayó de ~$80–90 M/mes (ene–may 2025) a **$27 M en septiembre 2025 (−50% vs agosto)** y jugadores iOS −60% ([GameRant](https://gamerant.com/pokemon-tcg-pocket-player-count-revenue-way-down/)).

### Marvel Snap — $275 M en 2 años, 30 M instalaciones en 3 meses
- Qué hace bien: partidas de ~3–5 min, 3 puntos, 6 turnos — la referencia de "battler relámpago"; valoración iOS 4.69★ con 303K ratings ([PocketGamer.biz](https://www.pocketgamer.biz/marvel-snap-surpasses-275-million-as-it-celebrates-second-anniversary/), [AppGoblin](https://appgoblin.info/apps/1592081003)).
- Patrón replicable: sesión ultracorta + battle pass cosmético.
- Advertencia: ingresos de app stores −75% en 2025 (~$26.8 M) y rating de Play Store en 3.4, con reseñas recientes de Steam "Overwhelmingly Negative" en episodios ([r/MarvelSnap](https://www.reddit.com/r/MarvelSnap/comments/1q3uh56/snap_revenue_has_looked_to_have_drop/), [r/MarvelSnap](https://www.reddit.com/r/MarvelSnap/comments/1vubn7o/negative_reviews/)).

### Otros benchmarks cuantificados (2025, App Store + Google Play)
Pokémon TCG Pocket $669 M · Shadowverse: Worlds Beyond $68.1 M · Hearthstone $58.7 M · Yu-Gi-Oh! Master Duel $41.3 M · MTG Arena $38.6 M · **Marvel Snap $26.8 M** ([r/MarvelSnap/AppMagic](https://www.reddit.com/r/MarvelSnap/comments/1q3uh56/snap_revenue_has_looked_to_have_drop/)). Pokémon TCG Live: ~3.8 M MAU en sus primeros 12 meses ([Market Intelo](https://marketintelo.com/report/trading-card-games-market)).

### Precedentes directos del subnicho (juego de cartas en navegador, multijugador por código)
| Producto | Señal | Nota |
|---|---|---|
| [cardgames.io](https://cardgames.io/es/) | Sitio consolidado, lobby multijugador, **mesa privada con código** y link de unión | Clásicos (Truco, Ocho Loco), sin coleccionismo ni battler PvP |
| [Board Game Arena](https://es.boardgamearena.com/) | Miles de juegos de mesa, sin descarga | Plataforma, no juego original |
| [GameBuddies](https://gamebuddies.io/) / [PlayParty](https://playparty.fun/) | Party games por código, sin registro | Prueban el patrón de sala+link, no cartas battler |
| [BattleBuds](https://condasoft.itch.io/battlebuddies), [Elementals Origins](https://elementalsorigins.itch.io/elementals-origins), [Verty3](https://verty3gamemaster.itch.io/zapo-a-fair-tactical-browser-card-game), [Void Scourge](https://www.void-scourge.com/), [DUDELZ](https://dudelz.com/) | Exactamente el concepto de SuitPoke: cartas + navegador + salas + IA | **Ninguno tracción masiva** (Elementals: 6 ratings; itch.io mediana 1.582 vistas de por vida) |
| [Poky/CrazyGames](https://pixelgameshub.com/research/state-of-browser-games-2026) | Poki 284.7 M visitas/mes US, CrazyGames 113.6 M | Canales de distribución si se publica ahí |

**Tabla comparativa de competidores**

| | Pokémon TCG Pocket | Marvel Snap | Clash Royale | cardgames.io / .io | SuitPoke (hipótesis) |
|---|---|---|---|---|---|
| Plataforma | App nativa | App nativa | App nativa | Navegador | **PWA navegador** |
| Instalar | Sí (~150 M) | Sí | Sí | No | **No** |
| Duración partida | 3–5 min | 3–5 min | 3–5 min | Variable | 2–5 min |
| Social | Ranking/amigos | Alianzas | Clanes | Mesas/código | **Código de invitación 2–4** |
| Monetización | Sobres IAP (hit) | Battle pass + packs (en declive) | P2W de niveles (rechazo) | Ads/portal | Cosméticos (futuro) |
| Punto débil demostrado | Caída −50% en meses | Ratings 3.4 / "P2W" | Reseteo de trofeos → rage quit | Baja retención, sin colección | Sin precedente de éxito en el subnicho |

## Pilar 3 — Necesidades reales de los usuarios

### Frustraciones frecuentes (con fuente)

**A. Bugs, lag y partidas que no cargan** — la queja #1 en el producto más grande del género:
- Pokémon TCG Live: pantallas congeladas que cuestan la partida, error 10099, login denegado, desconexión al cambiar de app ([Pokémon Forums — List of issues](https://community.pokemon.com/en-us/discussion/20447/list-of-issues-i-have-encountered-on-the-mobile-version-of-ptcg-live)), lag extremo que consume el turno por inactividad ([Forums — Extreme lag](https://community.pokemon.com/en-us/discussion/15618/game-has-extreme-lag-since-the-last-update)), servidores caídos sin encontrar rivales ([Forums — Servers down](https://community.pokemon.com/en-us/discussion/16643/servers-and-shop-are-down)).
- KARDS: "potato servers", desconexiones a mitad de partida → pérdidas por disconnect ([VaporLens KARDS](https://vaporlens.app/app/544810/kards_the_ww_2_card_game)).
- **Frecuencia:** ≥6 hilos/foros distintos de PTCG Live solo en 2025 con el mismo clúster (frozen/error de conexión). Peso alto.

**B. Matchmaking percibido como injusto/rígido**:
- Clash Royale: reset de temporada + emparejar contra mazos de nivel superior → *"uninstalled after 2 years"* ([The Game Developer — Why I uninstalled Clash Royale](https://www.gamedeveloper.com/design/why-i-uninstalled-clash-royale)).
- Hearthstone: "matchmaking roto… el juego me empuja a perder para dar ego a quien paga" ([Blizzard Forums](https://us.forums.blizzard.com/en/hearthstone/t/what-i-think-about-your-broken-pay-to-win-game/50330)).
- KARDS: "matchmaking injusto, novatos vs veteranos con cartas poderosas" ([VaporLens](https://vaporlens.app/app/544810/kards_the_ww_2_card_game)).
- Pokémon TCG Live: sensación de "rachas forzadas" y rivales repetidos ([Forums — Too much frustration](https://community.pokemon.com/en-us/discussion/19168/too-much-frustration-with-the-game)).
- **Frecuencia:** 4 productos distintos, patrón idéntico. Peso muy alto.

**C. Progresión/colección demasiado lenta o P2W encubierto** — la queja dominante en Marvel Snap:
- "100+ cartas que no tengo… prácticas depredadoras, paquetes aleatorios sin agencia" ([Returning player uninstalled again](https://www.reddit.com/r/MarvelSnap/comments/1nt50q7/returning_player_uninstalled_again/)); "el juego es P2W sin el pase de $10 no puedes ganar" ([2026 thread](https://www.reddit.com/r/MarvelSnap/comments/1r2zhnk/this_game_has_never_felt_worse_and_its_totally/)); "series drops decepcionantes, promesas sin cumplir" ([Don't whine. Review.](https://www.reddit.com/r/MarvelSnap/comments/1gzpbw1/dont_whine_review/)).
- KARDS: grind excesivo, power creep, "no recomiendo a novatos" ([VaporLens](https://vaporlens.app/app/544810/kards_the_ww_2_card_game)).
- **Frecuencia:** decenas de hilos en r/MarvelSnap durante 2023–2026 + foros Blizzard + KARDS. Peso muy alto.

**D. Cosméticos/avatares forzados y emotes tóxicos** (menor pero recurrente): PTCG Live — avatares "presumidos", emotes que hay que silenciar cada partida ([Forums — Coming back after 15 years](https://community.pokemon.com/en-us/discussion/18991/coming-back-after-15-years-only-to-be-disapointed-by-live)).

### Lo que piden y no existe (Jobs to be Done)
1. **"Quiero jugar ya, con mis amigos, sin que nadie instale nada"** — el job central. Resuelto hoy solo por juegos de mesa/party en navegador (cardgames.io, GameBuddies), **nunca por un battler de cartas coleccionable**. Evidencia: 44.8% de quienes ven un juego en itch.io lo juegan si es en navegador vs 10% si requiere descarga (3× más) ([HowToMarketAGame — itch.io traffic benchmark](https://howtomarketagame.com/2025/05/12/benchmark-itch-io-traffic/)).
2. **"Que mis cartas sirvan de algo aunque mis amigos no estén"** → PvE vs IA con progresión; motivaciones confirmadas en OCCG: **competencia e inmersión primero, social después** ([ACM CHI PLAY survey, 856 jugadores](https://dl.acm.org/doi/10.1145/3292147.3292216)); en TCG: competitividad, escapismo, social, manipulación, diseño ([The Demographics and Motivations of TCG Players, 300+ respuestas](https://exa.ai/library/publication/d09fb3p86j0)).
3. **"Que ganar/poder jugar sin gastar sea posible"** — rechazo unánime al P2W; el F2P con cosméticos es lo que el mercado valida (62–74% de ingresos F2P).

### Quéjas de productos que fracasaron
- **Battle Cards (Rockbite)**: retención D1 8–14%, D3 9% → *"pierde el 91% de usuarios en 3 días"*; contra bots, **80% menos rematch**; recomendación: cancelar el proyecto ([Theseus](https://www.theseus.fi/bitstream/handle/10024/779991/Makinen_Joona.pdf?isAllowed=y&sequence=2)).
- **Gods Unchained**: "player base demasiado pequeña y sin crecimiento; los devs solo vendían sobres caros" ([r/GodsUnchained — why did you quit](https://www.reddit.com/r/GodsUnchained/comments/1eeqi4b/to_former_players_of_the_game_what_made_you_quit/)).
- **Marvel Mystic Mayhem**: cerrado a los ~10 meses con <$4 M en su primer semestre ([YouTube/Hooglandia data](https://www.youtube.com/watch?v=ZDbzsupRC1M)).

## Pilar 4 — Tendencias, oportunidades y posicionamiento

### Tendencias actuales
1. **Sesiones bocado y play masivo**: la longitud de sesión media bajó (top 8–9 min, mediana 5–6 min) y el diseño debe soportar "loops rápidos repetidos" ([GameAnalytics 2025](https://gameindustrylibrary.com/documents/gameanalytics-mobile-gaming-benchmarks-2025)); los juegos simples dominan 2025 por inmediatez y bajo consumo de batería ([TodoIndie](https://es.todoindie.com/el-fenomeno-de-los-juegos-simples-que-conquistan-a-los-jugadores-en-2025/)).
2. **El navegador sigue siendo un canal enorme y en crecimiento**: mercado $11.8 B con CAGR 3.5%; Poki 284.7 M y CrazyGames 113.6 M visitas mensuales US; el grupo 13–24 es el mayor por volumen de sesiones y 25–34 el de mayor ingreso ([Dataintelo](https://dataintelo.com/report/browser-game-market), [PixelGamesHub State of Browser Games 2026](https://pixelgameshub.com/research/state-of-browser-games-2026)); top-100 hypercasual = 2.4 mil M descargas en H1 2025 ([MTG Rocks](https://mtgrocks.com/io-games-2025-how-free-online-multiplayer-games-took-over-the-web/)).
3. **Patrón "sala + código/link" consolidado** en party games y cada vez más en juegos con IA de agentes que despliegan multijugador en minutos ([antics.gg](https://antics.gg/add-multiplayer), [pastel (GitHub)](https://github.com/pixperk/pastel), [Meta Instant Games invites: +30% rewarded referrals](https://developers.facebook.com/docs/games/acquire/invites/)).
4. **Monetización híbrida-casual y rewarded video** como estándar: eCPM rewarded en web $8–25 vs banner $0.50–1.50; objetivo realista ~$3.700 DAU para ~$3.000/mes ([Applixir](https://www.applixir.com/blog/am-i-wasting-my-time-why-most-indie-web-games-struggle-to-make-money/), [Liftoff 2025 Casual Report](https://liftoff.ai/es/blog/highlights-2025-casual-gaming-apps-report/)).

### Huecos sin cubrir
- **Battler de cartas coleccionable en navegador con salas por código**: los 5–6 existentes (BattleBuds, Elementals, Verty3, Void Scourge, DUDELZ) son indies sin tracción y sin retención probada → hueco real, pero también señal de que nadie lo ha hecho rentable todavía.
- **"Jackbox de las cartas"**: party code + deckbuilding ligero (2–4 jugadores) sin equivalente claro.
- Monetización futura por cosméticos alineada con lo que el mercado F2P valida (62–74% de ingresos) — pero **solo con volumen**.

### Perfiles de usuario más interesantes
1. **Joven 13–24 casual-social** (mayor volumen de sesiones en navegador; edu/office breaks; LATAM/SEA donde .io crece) — el target declarado coincide con la data.
2. **Gamer casual 25–34 con dinero pero sin tiempo** (mayor segmento de ingreso en navegador; quiere partidas de 3 min sin grind P2W).
3. **Ex-cansados de P2W** migrando desde Marvel Snap/Hearthstone/KARDS (drivers de churn identificados arriba).

### Ángulo diferencial recomendado
**"Sin instalar, sin cuenta, código en 5 segundos, partida de 3 minutos — y tus cartas siguen contigo aunque no haya nadie online."** Combinar: (a) la inmediatez `.io`/party, (b) una colección ligera con progresión PvE-vs-IA que dispare el retorno (porque el PvP por invitación solo no basta), y (c) reglas simétricas de elementos/ventajas que neutralicen el "matchmaking injusto" — el dolor #2 del sector. Web-first y sin P2W como promesa de marca explícita.

## Evidencia desconfirmatoria

1. **La monetización web es casi inviable a escala indie.** ~80% de los juegos pagados en itch.io ganan <$50/mes; la mayoría <$100 en toda su vida; un juego bien situado en portal grande hace $200–2.000/mes ([Cinevva — Web Game Monetization 2026](https://app.cinevva.com/guides/web-game-monetization)). Los usuarios del navegador "esperan que todo sea gratis" y el ARPDAU web es 30–50% menor que el móvil ([Applixir](https://www.applixir.com/blog/am-i-wasting-my-time-why-most-indie-web-games-struggle-to-make-money/)). La "monetización futura con cosméticos" de SuitPoke necesita tráfico que hoy no está garantizado.
2. **Nadie en el subnicho ha logrado tracción.** 5+ card battlers de navegador idénticos al concepto siguen en ~6 ratings/visitantes mínimos ([Elementals Origins](https://elementalsorigins.itch.io/elementals-origins), [itch.io median: 1.582 vistas de por vida, 0 tráfico tras el primer mes para la mayoría](https://howtomarketagame.com/2025/05/12/benchmark-itch-io-traffic/)). O es un hueco abierto, o es una demanda que no existe en navegador — no se puede distinguir sin prueba con jugadores reales.
3. **El multijugador por invitación exige simultaneidad.** Sin masa crítica, los jugadores caen contra bots → **80% menos de rematch** y fracaso documentado de un battler PVP completo ([Theseus/Rockbite](https://www.theseus.fi/bitstream/handle/10024/779991/Makinen_Joona.pdf?isAllowed=y&sequence=2)). Además, cada punto de gap de habilidad sube el churn ([Heliyon](https://www.cell.com/heliyon/fulltext/S2405-8440(24)00922-8)).
4. **El género decae rápido incluso con éxito de taquilla.** Pokémon Pocket: −50% ingresos y −60% jugadores en meses ([GameRant](https://gamerant.com/pokemon-tcg-pocket-player-count-revenue-way-down/)); Marvel Snap: −75% en app stores en 2025 ([r/MarvelSnap](https://www.reddit.com/r/MarvelSnap/comments/1q3uh56/snap_revenue_has_looked_to_have_drop/)). Sin IP (Pokémon/Marvel) la adquisición es aún más difícil — emular sin copiar evita riesgo legal pero **elimina el mayor motor de descargas del sector**.
5. **Fricción PWA en iOS**: sin `beforeinstallprompt`, storage limitado, push poco fiable → parte del "sin instalar" se diluye justamente en la plataforma de mayor gasto en TCG ([web.dev](https://web.dev/learn/pwa/progressive-web-apps), [Abratabia PWA Games](https://www.abratabia.com/pwa-games/)).
6. **Retención D1 difícil en casual**: "bueno" es 25–35% en web/móvil; muchos títulos ni llegan ([Applixir](https://www.applixir.com/blog/the-monetization-mistakes-that-keep-games-stuck-under-5k-month/)). Sesiones de 2–5 min cortas no garantizan retorno: hace falta un motivo de vuelta (colección, rachas, diarios).

## Veredicto

- **Viabilidad:** media
- **Riesgo #1:** retención/sin masa crítica — el loop social por código necesita amigos simultáneos y la alternativa (IA) mal ejecutada cancela rematches (80% menos), mientras el subnicho navegador no tiene ni un solo caso de éxito demostrado.
- **Siguiente paso recomendado:** construir un **MVP jugable en 2–4 semanas** (1 mazo de ~20 cartas, 3 elementos con ventajas, salas por código, 1 IA aceptable, sonido básico) y publicarlo gratis en itch.io/Poki + un link directo; medir con 100–300 jugadores reales: % que juega ≥2 partidas, **% de rematch**, D1 retention (meta ≥25%) y si completan el onboarding en <60 s. Si los 3 primeros números superan los umbrales → `/ciclo SuitPoke/` para fase 0 (CONTRATO.md); si no, pivotar el diseño (progresión vs social) antes de escribir más código.
