# SuitBoard - Dashboard Crypto + US Market

## Contexto del proyecto
Dashboard de mercado en un solo archivo HTML estático (sin build, sin servidor propio): pestañas Crypto y US Market. Rescatado desde `Downloads\dashboard_extendido (1).html` (31/08/2026) — el usuario no recordaba dónde lo había guardado.

## Alcance
Proyecto local, un solo archivo (`index.html`). No tiene servidor Node propio ni pipeline de build. Igual que `SuitCampanas/`, no pasa por el pipeline de deploy de GitHub Pages del repo raíz — no está pensado para publicarse en `grupoevasol.com`.

## Cómo correrlo
- Desde el menú: `suitorg-menu.bat` → `[4] Sistemas` → `[4] SuitBoard`.
- Directo: `SuitBoard\abrir.bat`, o abrir `index.html` a mano en el navegador (`file://`). No requiere `npm install` ni servidor.

## Stack y fuentes de datos
- Vanilla JS + CSS embebido, sin frameworks ni dependencias.
- **Crypto (pestaña Crypto): datos en vivo** vía API pública de CoinGecko (`api.coingecko.com/api/v3`, sin API key) — precio, cambio 24h, volumen, histórico 30d. 10 activos (ampliado de 6 el 2026-08-31): BTC, SOL, JUP, RAY, JTO, BONK, ORCA, PYTH, WIF, RENDER (foco en ecosistema Solana).
- **US Market (pestaña US Market): datos estáticos/demo** — Dow Jones, Nasdaq, ETFs, commodities están hardcodeados en el JS (`const usIndices/topETFs/topStocks/commodities = [...]`), no se hace fetch en vivo. No hay integración real con NYSE/NASDAQ todavía (ver Pendientes).

## Rotación automática de watchlist (2026-08-31)
El score de confiabilidad (volatilidad 30d + volumen 24h + correlación vs BTC, ya existía) ahora sí tiene efecto:
- Cada refresh (5 min) evalúa el peor token **no fijado**. Si su score cae por debajo de 15 ("Buscar otras"), se buscan candidatos en `/search/trending` de CoinGecko (gratis, sin key, top 2) y si el mejor supera al peor por 10+ puntos, se hace el swap.
- **Fijados (nunca rotan): BTC, SOL, JUP, BONK** — los usa el Pool Calculator (`poolCalcData`) vía `getTokenPrice()`; rotarlos rompería esa pestaña. Los otros 6 (RAY, JTO, ORCA, PYTH, WIF, RENDER) son candidatos a reemplazo.
- El watchlist resultante (`CG_IDS`/`CG_NAMES`) se persiste en `localStorage` (`suitboard_watchlist_v1`/`suitboard_names_v1`) — sobrevive a un refresh de página. El historial de swaps queda en `suitboard_swaps_v1` (últimos 50) y el más reciente se muestra en una línea sobre la grilla de precios.
- Fix de paso: `pearsonCorr()` no validaba `null` en sus inputs — un historial fallido (429 de CoinGecko, común en el free tier) tumbaba todo `fetchCryptoLive()` con un `TypeError`. Ahora retorna `null` limpio y el resto de la UI sigue funcionando con el último dato conocido.

## Decisiones tomadas
- Nombre del proyecto: `SuitBoard`, siguiendo la convención `Suit*` del resto de módulos del registry.
- Se conservó como archivo único (`index.html`) sin fragmentarlo en componentes — es exactamente lo que había en Downloads, solo reubicado.
- No se hizo `git add` al moverlo — dato de mercado sin secretos ni PII, pero se deja la decisión de trackearlo en git al usuario dado que cualquier archivo del repo raíz es potencialmente público vía GitHub Pages (ver `SuitOrg/CLAUDE.md`).

## Análisis al pasar el mouse (2026-08-31)
Al hacer hover sobre cualquier moneda, índice, ETF, acción o commodity aparece un tooltip con lectura rápida (tendencia diaria/semanal, zona suelo/techo, rango probable 24h/semana, qué vigilar), con badges de color y una barra de rango visual.
- **Crypto**: cálculo real a partir de `priceHistorySeries` (30d de CoinGecko) — no es una IA leyendo un gráfico de TradingView, es estadística simple (min/max reciente como suelo/techo, volatilidad anualizada ya calculada para el rango probable). Queda explícito en el propio tooltip.
- **US Market**: como no hay serie histórica real conectada, el tooltip lo dice explícitamente en vez de inventar un suelo/techo — solo muestra el cambio del día. Se resuelve solo el día que se conecte una API real (ver arriba).

### Análisis fundamental (2026-09-02)
El tooltip de Crypto ahora suma una sección "Fundamental" con **market cap** y **volumen 24h**, vía `include_market_cap=true` en el mismo `simple/price` de CoinGecko que ya se llamaba (sin llamada extra). Formateado compacto (`$1.55T`, `$28.74B`) con `formatCompactUsd()` (`Intl`/`toLocaleString` nativo, sin librería). US Market sigue sin esto — no hay fuente de market cap conectada para esa pestaña.

**Top Pools Raydium/Orca** (tabla de la pestaña Crypto) no tenía hover — se agregó `showPoolAnalysis()`/`buildPoolAnalysisHTML()`. Es 100% dato fundamental (TVL = liquidez depositada, APR = rendimiento; ninguno es técnico de precio), y el tooltip lo dice explícito. Reutiliza `getRiskLabel`/`getRiskColor`/`getRiskAdvice` que ya existían para la Calculadora de Pools — `poolData` y `poolCalcData` son arrays paralelos en las primeras 5 posiciones (mismo pool real), así que se indexan por posición sin duplicar la lógica de riesgo.

### TVL/APR en vivo — Raydium + Orca (2026-09-02)
`fetchPoolsLive()` reemplazó los 5 pools reales (índices 0-4 de `poolData`/`poolCalcData`; el índice 5, `BTC/USDC Generic`, es sintético solo para la calculadora y no se toca) con datos en vivo, sin API key:
- **Raydium**: `api-v3.raydium.io/pools/info/mint?mint1=..&mint2=..` (búsqueda por par de mint addresses, ordenado por liquidez) → `tvl` y `day.apr` directos.
- **Orca**: `api.orca.so/v2/solana/pools?tokensBothOf=..,..` (mismo filtro server-side; la alternativa `v1/whirlpool/list` sin filtro pesa ~18MB, se descartó) → `tvlUsdc` y `stats['24h'].yieldOverTvl` anualizado (`×365×100`) como proxy de APR.
- Mint addresses verificados por API antes de hardcodear (CoinGecko `/coins/{id}` → `platforms.solana`), mismo criterio que se usó para los IDs de CoinGecko de ORCA/PYTH/WIF/RENDER.
- Fallo por pool individual no tumba el resto (try/catch por ítem, igual que el histórico de precios crypto) — si Raydium/Orca caen, se queda con el último dato conocido y el tooltip lo aclara ("Sin conexión — mostrando último dato conocido").
- La categoría de riesgo (Bajo/Medio/Alto) sigue siendo estática por par — no se recalcula desde el TVL en vivo (alcance separado, no pedido).
- Corre en el mismo ciclo de refresh de 5 min que crypto (`refreshCryptoAndRender()`), con indicador `en vivo · Raydium/Orca` junto al título de la tabla, igual patrón que `cryptoLiveStatus`.

### Matriz de fases por temporalidad — Mensual/Semanal/Diario/6H (2026-09-02)
A pedido del usuario (mostró una captura con un formato similar: MONEDA × temporalidad, punto de color + etiqueta "E1 Acum./E2 Avance/E3 Distrib./E4 Declive"), se agregó una tabla nueva en la pestaña Crypto ("Fase del Movimiento por Temporalidad", debajo de Top Pools) que cruza cada activo del watchlist contra 4 temporalidades:
- **Mensual/Semanal**: derivadas del histórico diario de 30d que ya se pedía (`priceHistorySeries`) — sin llamadas nuevas.
- **Diario/6H**: nuevas, requieren histórico horario. `fetchCryptoLive()` ahora hace una tercera tanda de llamadas por activo (`market_chart?days=2`, auto-granularidad horaria de CoinGecko, ~48-49 puntos) → `priceHistoryHourly[sym]`. **Esto duplica las llamadas de histórico por refresh** (antes 1/activo, ahora 2/activo) — el usuario aceptó el tradeoff explícitamente ("adelante con todo") sabiendo que sube el riesgo de rate-limit.
- Motor genérico `phaseFromSeries(series, cfg)` + `TIMEFRAME_CONFIGS` (una config por columna: lookback de tendencia, lookback de confirmación corta, umbrales, ventana de posición-en-rango) — reemplaza/generaliza la lógica de `classifyCyclePhase()` (que se dejó intacta, sigue siendo el badge de la tarjeta individual = equivalente a la columna "Semanal" pero no exactamente idéntica en ventana).
- Etiquetas renombradas a terminología Wyckoff/Etapa (alineadas a la captura del usuario): Etapa 1 Acumulación / Etapa 2 Avance / Etapa 3 Distribución / Etapa 4 Declive / Rango (sin fase clara) — aplicado también al badge de tarjeta y al tooltip, para consistencia en todo el dashboard.
- Verificado con tests sintéticos aislados (sin red) cubriendo las 4 fases + el caso `null`: alcista, bajista, distribución (topping), inicio (bottoming), y lateral puro sin forzar etiqueta. La verificación en navegador real solo confirmó que no rompe y degrada con gracia (celdas grises "Rango") — no se pudieron ver colores reales en esta sesión porque CoinGecko ya estaba bloqueando por CORS de tanto probar antes (ver [[feedback-cors-testing-discretion]] en memoria).

### Rangos de Precio — Soporte/Midpoint/Resistencia por temporalidad (2026-09-02)
A pedido del usuario (mostró `tabla2.png`: por moneda, 3 barras Diario/Semanal/Mensual con Soporte/Midpoint/Resistencia + fecha de cierre UTC). Análisis previo al build: **es por criptomoneda individual, no por pool/par** — un pool no tiene precio propio, y esto es análisis técnico de precio (los pools ya tienen su vista separada de TVL/APR). Confirmado con el usuario antes de implementar (`AskUserQuestion`, eligió sección nueva con selector de moneda en vez de meterlo en el tooltip o apilar las 10 monedas).

Nueva card "Rangos de Precio" (Crypto tab, después de la matriz de fases) con un `<select>` de moneda y 3 bloques (Diario/Semanal/Mensual), cada uno con la misma barra `rangeBarHTML()` que ya existía + 3 cajitas Soporte (rojo, mínimo real del período) / Midpoint (promedio) / Resistencia (verde, máximo real).
- **Diferencia clave con el tooltip de hover existente**: esto es rango YA OCURRIDO del período en curso (histórico real, min/max), no una proyección estadística de volatilidad — son conceptos distintos aunque visualmente parecidos. Por eso NO se reusaron `floor24h`/`ceil24h`/`floorWeek`/`ceilWeek` de `computeCryptoAnalysis()` (esas sí son para proyección hacia adelante) — se escribió `priceRangeFromSeries()` aparte, con su propia semántica.
- Diario usa el histórico horario (`priceHistoryHourly`, últimas 24 lecturas); Semanal/Mensual usan el histórico diario de 30d (últimos 7/30 puntos) — mismos datos ya pedidos, sin fetch nuevo.
- "Cierre" calculado con matemática de fechas pura (`nextUtcClose()`): próxima medianoche UTC (diario), próximo lunes 00:00 UTC (semanal, convención tipo Binance), día 1 del próximo mes 00:00 UTC (mensual).
- Verificado offline (fechas, slicing min/max/mid, casos sin datos) y con una sola ronda en navegador (selector pobla las 10 monedas, cambia de moneda, degrada con gracia sin crashear).

### Ticker de noticias — velocidad + color + commodities (2026-09-02)
Animación 10% más rápida (`ticker`: 80s→72s, `ticker-us`: 70s→63s). Cada headline tiene `sentiment: 'up'|'down'`, pintado en `renderTickers()` vía `newsColor()` (verde `#22c55e` / rojo `#ef4444`), aplicado tanto al ticker crypto como al US Market. Se sumaron 2 noticias de commodities (`Gold rallies...`, `Copper slides...`) al ticker US, que ya traía una de petróleo — commodities no tiene ticker propio, comparte el de US Market.

### Fase del movimiento — ciclo de 4 etapas (2026-09-02)
Cada tarjeta de Crypto (pestaña Crypto, `renderCryptoPrices()`) ahora tiene un borde de color a la izquierda + badge con la fase del ciclo (Wyckoff simplificado): **Inicio de movimiento** (azul `#3b82f6`, ↗), **Etapa alcista** (verde `#22c55e`, ▲), **Distribución** (amarillo `#eab308`, ⚠), **Etapa bajista** (rojo `#ef4444`, ▼). Gris = sin fase clara (no se fuerza una etiqueta cuando el dato no es concluyente). Leyenda visible arriba de la grilla de precios, mismo patrón que la leyenda de Confiabilidad.
- `classifyCyclePhase(a)` (donde `a` = salida de `computeCryptoAnalysis()`, ya calculada para el hover — no hay fetch nuevo) clasifica con una heurística simple: posición del precio dentro del rango de 30d (`floorWeek`/`ceilWeek`, ya calculados) + `dailyTrend`/`weeklyTrend` (ya calculados). Bajada semanal → bajista; cerca del techo de 30d sin impulso diario → distribución; cerca del suelo de 30d con impulso diario positivo → inicio; subida semanal sostenida → alcista; lateral puro → `null` (sin fase clara, no se inventa).
- La misma fase se muestra también en el tooltip de hover (`buildCryptoAnalysisHTML`), con disclaimer explícito de que es heurística, no señal certera.
- Solo Crypto — US Market no tiene historial real, mismo criterio de honestidad que el resto del análisis.
- Probado con casos sintéticos (unit test aislado de `classifyCyclePhase`, sin depender de CoinGecko): los 4 casos claros clasifican bien, lateral puro e insuficiente devuelven `null` sin crashear.

## Pendientes críticos
- Decidir si se trackea en git (y si se agrega a `.gitignore` en su lugar).
- La pestaña US Market sigue con datos estáticos — conectar a una API real (Yahoo Finance, Alpha Vantage, etc.) si se quiere que sea igual de "viva" que la de Crypto.
- En `Downloads/` quedaron 4 archivos hermanos sin consolidar: `dashboard.html`, `dashboard (1).html`, `dashboard_extendido.html` (versión anterior, más chica) y `dashboard_liquidez_solana.html` — parecen iteraciones previas del mismo proyecto, no revisados aún.

---

*Proyecto mantenido por SuitOrg Team - 2026*
