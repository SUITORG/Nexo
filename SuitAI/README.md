# SuitAI — Módulo de AI (Model Discovery + Auto-Routing + Circuit Breaker)

## Descripción

Módulo de servicios de inteligencia artificial dentro del ecosistema **SuitOS**. Proporciona un gateway unificado para descubrir, seleccionar y consumir modelos de IA de forma automática, con tolerancia a fallos mediante patrón Circuit Breaker.

## Arquitectura

```
SuitAI (port 3010)
├── handlers/api.js        ← Endpoints REST
├── services/
│   ├── modelScanner.js    ← Descubrimiento y cache de modelos
│   ├── modelRouter.js     ← Enrutamiento inteligente con fallback
│   └── circuitBreaker.js  ← Tolerancia a fallos
├── db/client.js           ← Conexión Supabase
└── index.js               ← Servidor Express
```

## Funcionalidades principales

| Feature | Descripción |
|---------|-------------|
| **Model Discovery** | Escanea proveedores de modelos gratuitos (OpenRouter, OpenCode Zen) |
| **Model Cache** | Cache de 1 hora con TTL; refresh manual disponible |
| **Auto-Routing** | Selecciona el modelo más rápido disponible automáticamente |
| **Circuit Breaker** | Desactiva modelos con 3+ fallos consecutivos por 5 minutos |
| **Fallback Gemini** | Si todos los modelos fallan, intenta con Google Gemini directo |
| **Health Check** | Endpoint de estado con conteo de modelos cacheados |

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/ai/health` | Estado del servicio |
| `GET` | `/api/ai/models` | Lista modelos disponibles (soporta `?force=true`) |
| `POST` | `/api/ai/models/refresh` | Fuerza refresh del cache |
| `POST` | `/api/ai/chat` | Envia mensaje y recibe respuesta de AI |
| `GET` | `/api/ai/circuit` | Estado del circuit breaker por modelo |

## Proveedores soportados

| Proveedor | Fuente | Autenticación |
|-----------|--------|---------------|
| **OpenRouter** | `localhost:20128` (proxy local) | `OPENROUTER_API_KEY` |
| **OpenCode Zen** | `opencode.ai/zen/v1` | `OPENCODE_API_KEY` |
| **Google Gemini** | `generativelanguage.googleapis.com` | `GEMINI_API_KEY` (fallback) |

> Solo se consumen modelos **gratuitos** o con costo mínimo (≤ $0.00001/token).

## Variables de entorno

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
OPENCODE_API_KEY=your_opencode_zen_key
GEMINI_API_KEY=your_google_gemini_key
PORT=3010
```

## Inicio rápido

```bash
cd SuitAI
npm install
cp .env.example .env   # configurar variables
npm start
```

## Circuit Breaker — Lógica

- **Umbral de fallo**: 3 fallos consecutivos
- **Cooldown**: 5 minutos
- **Historial**: últimos 100 intentos por modelo
- **Recovery**: automático tras cooldown o reset de fallos

## Modelo de fallback

Si ningún modelo está disponible, se usa directamente:
- `google/gemini-flash-latest` vía API de Google

## Dependencias

- `express` — Servidor HTTP
- `@supabase/supabase-js` — Cliente Supabase
- `dotenv` — Variables de entorno

## Notas para desarrolladores

- El scanner corre al inicio del servidor (1s delay) y se cachea por 1 hora
- El router intenta modelos ordenados por latencia; modelos no probados van después
- Los modelos fallback se usan solo si todos los demás fallan
- El endpoint `/api/ai/chat` espera `{ messages: [{ role, content }] }` en el body
