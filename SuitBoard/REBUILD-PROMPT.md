# SuitBoard — Prompt de reconstrucción

Este archivo no es documentación de proceso (para eso está `CLAUDE.md`). Es la **especificación completa**, en formato prompt, para reconstruir este dashboard desde cero si se pierde el archivo — pegá el bloque "PROMPT MAESTRO" en cualquier asistente de código y debería producir un resultado equivalente. Después del prompt van los valores exactos (IDs, fórmulas, thresholds) que el prompt solo no garantiza reproducir igual.

---

## PROMPT MAESTRO

```
Creá un dashboard financiero de un solo archivo HTML (sin build, sin servidor,
sin frameworks — vanilla JS + CSS embebido), con tema oscuro (fondo #0f172a,
acentos cian #06b6d4 y violeta #8b5cf6). Tres pestañas por navegación superior:
"Crypto Markets", "US Markets", "Combined View".

═══════════════════════════════════════
PESTAÑA CRYPTO MARKETS
═══════════════════════════════════════

1. Precios en vivo de 10 criptomonedas vía API pública de CoinGecko
   (api.coingecko.com/api/v3, sin API key): precio, cambio 24h, volumen 24h,
   histórico de 30 días diario. Refresco automático cada 5 minutos.

2. Cuatro de esas 10 monedas quedan FIJAS (nunca se reemplazan) porque las usa
   la calculadora de pools más abajo. Las otras 6 son la "watchlist rotable".

3. Score de confiabilidad por moneda (0-100), combinando:
   - Volatilidad anualizada de 30d (peso 30%, MENOR es mejor) — escala 30%→100pts,
     150%+→0pts.
   - Volumen 24h en USD (peso 40%, MAYOR es mejor) — escala logarítmica,
     $1M→0pts, $500M+→100pts.
   - Correlación de Pearson vs BTC sobre retornos diarios de los 30d (peso 30%,
     MAYOR es mejor) — escala -1..1 → 0..100pts.
   Mostrar badge de color: 90-100 "Seguro" verde, 60-89 "Bueno" cian,
   30-59 "Reservado" amarillo, 15-29 "Muy reservado" naranja, <15 "Buscar
   otras" rojo.

4. Rotación automática de la watchlist rotable: en cada refresh, si el peor
   score de un token NO fijo cae bajo 15, buscar candidatos en el endpoint
   gratis /search/trending de CoinGecko (top 2, excluyendo los que ya están en
   la watchlist). Calcularles el mismo score. Si el mejor candidato supera al
   peor actual por 10+ puntos, reemplazarlo. Persistir la watchlist resultante
   en localStorage (sobrevive a un refresh de página) y loguear cada swap
   (qué salió, qué entró, con qué score, timestamp) en localStorage también,
   mostrando el más reciente en una línea sobre la grilla de precios.

5. Heatmap de correlación 30d entre todos los tokens de la watchlist actual
   (grid NxN, celdas coloreadas por fuerza de correlación).

6. Calculadora de pools de liquidez (LP): lista de pools reales tipo
   SOL/USDC, JUP/SOL, BONK/SOL, cbBTC/USDC, BTC/USDC (par, DEX, TVL, APR).
   Al elegir un pool y un monto (botones rápidos $100-$5000) y un rango de
   días (slider 1-30), calcular: fees LP ganados (APR/365 × días), impermanent
   loss estimado (según riesgo del pool: bajo/medio/alto, escalado con los
   días), apreciación por rango de precio min/max que el usuario define
   (modelo 50/50: la mitad del monto compra el token no-stable al precio
   mínimo, se valúa al precio máximo), y ganancia total combinada. Mostrar
   también la correlación del par (para explicar el riesgo de IL) y un
   consejo textual según nivel de riesgo y plazo.

7. Al pasar el mouse sobre CADA tarjeta de moneda: tooltip con lectura rápida
   calculada de verdad a partir del historial de 30 días (NO es una IA
   leyendo un gráfico, es estadística simple, aclarado en el propio tooltip):
   - Tendencia de las últimas 24h y de la semana ("Subiendo"/"Bajando"/
     "Lateral" con badge de color, verde/rojo/amarillo), comparando el precio
     actual contra el de ayer y contra el de hace 7 días (umbral ±1% diario,
     ±3% semanal para no marcar ruido como tendencia).
   - Zona "suelo→techo" de las próximas 24h = mínimo y máximo de los últimos
     7 días de la serie. Zona semanal = mínimo y máximo de los 30 días.
     Mostrar como barra horizontal con gradiente rojo→amarillo→verde y un
     marcador blanco en la posición del precio actual.
   - Rango de precio probable 24h y semanal, derivado de la volatilidad
     anualizada ya calculada (± 1 desvío estándar diario / semanal escalado
     por raíz de 7).
   - Una frase diciendo si es más probable que el precio se quede dentro del
     rango reciente o que lo rompa (si está en el 20% superior del rango de
     7d y la tendencia diaria es de subida → más probable que rompa el techo;
     si está en el 20% inferior y tendencia de bajada → más probable que
     rompa el suelo; si no, más probable que se quede dentro).
   - Una frase en lenguaje simple de qué vigilar (acercarse al suelo sin
     rebotar = cuidado, superar el techo con fuerza = podría seguir subiendo).
   - Disclaimer chico aclarando que es una lectura estadística de 30 días, no
     una predicción ni asesoría financiera.
   Si el historial de un token todavía no cargó (fetch en curso o falló),
   mostrar solo "todavía no hay suficiente historial, esperá al próximo
   refresh" — nunca inventar datos.

═══════════════════════════════════════
PESTAÑA US MARKETS
═══════════════════════════════════════

Como NO hay una API real de mercado bursátil conectada (requiere pago —
ver sección de pricing más abajo), esta pestaña usa datos ESTÁTICOS/DEMO
hardcodeados, dejando explícito en el código y en el hover que no son datos
en vivo:

- 10 índices US (valor, cambio %, sube/baja): S&P 500, Dow Jones, Nasdaq,
  Russell 2000, VIX, Nasdaq 100, Philadelphia Semiconductor, NYSE Composite,
  Dow Jones Transportation, Dow Jones Utility.
- Top 5 ETFs (símbolo, nombre, precio, cambio %).
- Top 5 acciones del día (símbolo, nombre, precio, cambio %, volumen).
- 5 commodities (oro, plata, petróleo WTI, gas natural, cobre).
- 6 sectores con su cambio % del día.
- Reloj de mercado en vivo (hora de Nueva York, calculando si está
  OPEN/PRE-MARKET/AFTER-HOURS/CLOSED según el horario 9:30-16:00 ET).

Al pasar el mouse sobre cualquiera de estos: tooltip mostrando SOLO el cambio
del día con badge de color, y un aviso explícito de "dato demo, sin serie
histórica real conectada, no se puede calcular suelo/techo real" — nunca
fabricar un rango o tendencia sin datos reales detrás.

═══════════════════════════════════════
PESTAÑA COMBINED VIEW
═══════════════════════════════════════

Vista resumen cruzando crypto + US + commodities en tarjetas chicas, más una
matriz de correlación cruzada BTC/SOL/SPX/GOLD.

═══════════════════════════════════════
GENERAL
═══════════════════════════════════════

- Ticker de noticias corriendo (crypto y US market por separado), datos
  también estáticos/demo.
- Todo el estado mutable (watchlist rotada, nombres, historial de swaps) en
  localStorage, con claves versionadas (bump de versión si cambia la forma
  de los datos guardados, para no quedar pegado a un formato viejo).
- Manejo de errores defensivo: cualquier fetch que falle (rate limit, CORS,
  red caída) debe degradar con gracia — mostrar el último dato conocido o un
  mensaje claro, nunca romper el resto de la página con una excepción sin
  capturar. Poner especial cuidado en funciones matemáticas (correlación,
  volatilidad) que reciban `null`/`undefined` cuando un fetch parcial falla.
```

---

## Valores exactos (para que la reconstrucción sea fiel, no solo "parecida")

### Tokens crypto (CoinGecko IDs verificados)

| Símbolo | CoinGecko ID | Nombre | ¿Fijo? |
|---|---|---|---|
| BTC | `bitcoin` | Bitcoin | Sí |
| SOL | `solana` | Solana | Sí |
| JUP | `jupiter-exchange-solana` | Jupiter | Sí |
| BONK | `bonk` | Bonk | Sí |
| RAY | `raydium` | Raydium | No (rota) |
| JTO | `jito-governance-token` | Jito | No (rota) |
| ORCA | `orca` | Orca | No (rota) |
| PYTH | `pyth-network` | Pyth Network | No (rota) |
| WIF | `dogwifcoin` | dogwifhat | No (rota) |
| RENDER | `render-token` | Render | No (rota) |

### Constantes de rotación
- `ROTATION_THRESHOLD = 15` (score por debajo de esto = candidato a salir)
- `ROTATION_MARGIN = 10` (el candidato debe superar al peor por al menos esto)
- Candidatos por ciclo: top 2 de `/search/trending` (no más — CoinGecko free se rate-limitea rápido con más llamadas)

### Fórmulas de score (reliabilityScore)
```js
scoreVol(v)      = clamp(0,100, (1 - (v - 0.30) / (1.50 - 0.30)) * 100)       // v = volatilidad anualizada
scoreVolume(usd) = clamp(0,100, (ln(usd) - ln(1e6)) / (ln(5e8) - ln(1e6)) * 100)
scoreCorrBTC(c)  = clamp(0,100, (c + 1) / 2 * 100)                             // c = correlación Pearson vs BTC

reliabilityScore = scoreVol*0.30 + scoreVolume*0.40 + scoreCorrBTC*0.30
                    (ponderado solo sobre las partes que tengan dato disponible)
```

### Volatilidad anualizada
```js
retornos_log_diarios = ln(precio[i] / precio[i-1])
vol30d = stdev(retornos_log_diarios) * sqrt(365)
```

### Rango probable (hover analysis)
```js
dailyStd  = vol30d / sqrt(365)
weeklyStd = dailyStd * sqrt(7)
rango24h  = precio_actual * [1 - dailyStd, 1 + dailyStd]
rangoSemana = precio_actual * [1 - weeklyStd, 1 + weeklyStd]
```

### Pool Calculator — datos base
```
SOL/USDC  · Orca     · TVL $26.6M · APR 42.3% · riesgo bajo  · corr [SOL,BTC]
SOL/USDC  · Raydium  · TVL $10.1M · APR 18.5% · riesgo bajo  · corr [SOL,BTC]
JUP/SOL   · Orca     · TVL $325K  · APR 58.7% · riesgo medio · corr [JUP,SOL]
BONK/SOL  · Orca     · TVL $118K  · APR 127.4%· riesgo alto  · corr [BONK,SOL]
cbBTC/USDC· Orca     · TVL $5.7M  · APR 31.2% · riesgo bajo  · corr [BTC,USDC]
BTC/USDC  · Generic  · TVL $5.0M  · APR 25.0% · riesgo bajo  · corr [BTC,USDC]
```
IL estimado: bajo = 0.1%×(días/30), medio = 0.8%×(días/30), alto = 2.5%×(días/30).

### US Market — valores demo actuales
Índices: SPX 5,892.45 (-0.82%) · DJI 43,218.72 (-0.65%) · IXIC 18,456.31 (-1.12%) · RUT 2,134.56 (+0.34%) · VIX 18.42 (+5.23%) · NDX 20,845.12 (-1.05%) · SOX 5,102.34 (-2.14%) · NYA 19,872.60 (-0.48%) · DJT 15,203.88 (+0.21%) · DJU 1,012.45 (+0.67%).

ETFs: SPY $589.24 (-0.82%) · QQQ $512.36 (-1.12%) · IWM $213.45 (+0.34%) · XLF $48.92 (+1.23%) · XLV $142.67 (+0.89%).

Acciones: NVCR $19.99 (+28.39%) · CLF $10.96 (+15.98%) · MEDP $605.82 (+14.71%) · EQPT $19.40 (+11.88%) · IMAX $43.96 (+11.86%).

Commodities: Gold $3,245.80 (+0.42%) · Silver $38.92 (-0.15%) · Crude Oil WTI $100.23 (+2.18%) · Natural Gas $3.45 (+1.32%) · Copper $4.52 (-0.87%).

Sectores: Technology -1.45% · Healthcare +0.89% · Financials +1.23% · Energy +2.18% · Industrials +0.56% · Consumer Disc. -0.92%.

### LocalStorage (persistencia)
| Clave | Contenido |
|---|---|
| `suitboard_watchlist_v2` | `{SYM: coingecko_id, ...}` — watchlist actual (sobrevive rotaciones) |
| `suitboard_names_v2` | `{SYM: nombre_legible, ...}` |
| `suitboard_swaps_v1` | Array (máx 50) de `{ts, removed:{symbol,id,score}, added:{symbol,id,score}}` |

*Nota: bumpear el sufijo `_v2`/`_v3`... cada vez que cambie la forma de estos datos, para que un usuario con localStorage viejo reciba el default nuevo en vez de quedar pegado al formato anterior.*

### Sobre conectar una API real para US Market
Evaluado en esta sesión (precios de 2026-08-31, verificar vigencia antes de decidir):

| API | Free tier | Plan pago de entrada |
|---|---|---|
| Alpha Vantage | 25 req/día (5/min) | $49.99/mes |
| **Finnhub** | 60 req/min, gratis uso personal no monetizado | $79.99/mes (ilimitado) |
| Twelve Data | 800 req/día, delay 4h | hasta $329/mes |
| Polygon.io | — | $29 delayed / $199/mes real-time |

Recomendación registrada: Finnhub free alcanza para uso personal (60 req/min cubre de sobra un refresh cada 5 min).

---

## Historial de esta sesión (para contexto, no para copiar literal)
1. Rescatado desde `Downloads\dashboard_extendido (1).html` (el usuario no recordaba dónde lo había guardado).
2. Reorganizado como `SuitOrg/SuitBoard/`, registrado en `.suit/registry/projects.yaml`, enganchado a `suitorg-menu.bat` (`[4] Sistemas` → `[4] SuitBoard`, vía `SuitBoard/abrir.bat`).
3. Implementada rotación automática de watchlist (antes la lista de 6 tokens era fija, sin lógica de reemplazo pese a que el score de confiabilidad ya existía).
4. Ampliado de 6 a 10 tokens crypto y de 5 a 10 índices US Market.
5. Implementado el tooltip de análisis al hover, distinguiendo honestamente entre lectura real (crypto, con datos) y demo (US Market, sin datos históricos).
6. Bug preexistente encontrado y arreglado de paso: `pearsonCorr()` no validaba `null`, un fetch parcial fallido (429 de CoinGecko) tumbaba toda la actualización con una excepción sin capturar.

Ver `.suit/memory/decisions/ADR-028-suitboard-rescate-dashboard.md` para el detalle completo de decisiones tomadas.
