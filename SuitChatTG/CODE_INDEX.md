# Índice de Código — SuitChatTG

**Fecha:** 2026-07-21
**Archivos analizados:** 7
**Funciones encontradas:** 24

---

## Resumen

| Categoría | Cantidad |
|-----------|----------|
| API Endpoints (Express) | 3 |
| Funciones servidor (index.js) | — |
| Funciones Telegram | 5 |
| Funciones IA | 3 |
| Funciones Leads | 2 |
| Funciones Memoria | 4 |
| Funciones Menú | 3 |
| Cliente GAS | 9 |

---

## API Endpoints — Servidor (`index.js`)

| Método | Ruta | Línea | Parámetros | Descripción |
|--------|------|-------|-------------|-------------|
| GET | `/api/health` | 31 | — | Health check: status, empresa, chats activos |
| GET | `/api/sessions` | 36 | — | Lista sesiones activas con metadatos (empresa, msgs, lead) |
| GET | `/api/link` | 50 | `?id_empresa=` | Genera deep link `t.me/bot?start=EMPRESA` |

---

## Funciones del Servidor (`index.js`)

| Línea | Código | Descripción |
|-------|--------|-------------|
| 7-10 | Constantes | `PORT`, `TELEGRAM_TOKEN`, `ID_EMPRESA`, `BOT_USERNAME` desde `process.env` |
| 12-15 | Validación | Exit si `TELEGRAM_TOKEN` no está configurado |
| 17-21 | Init | `express()`, `TelegramBot(polling)`, `telegram.setup()` |
| 61-66 | `app.listen()` | Inicia servidor en `PORT` |

---

## Cliente GAS (`db/gas-client.js`)

| Función | Línea | Parámetros | Retorno | Descripción |
|---------|-------|-------------|---------|-------------|
| `callGAS` | 4 | `(action, payload)` | `Object` | Llamada genérica POST al GAS backend |
| `getPrompt` | 14 | `(agtId, idEmpresa)` | `Object` | Obtiene prompt de agente IA |
| `getAgentByEmpresa` | 23 | `(idEmpresa)` | `Object\|null` | Busca agente en `Prompts_IA` por empresa |
| `getLeadByVisitor` | 32 | `(idVisitante, idEmpresa)` | `Object` | Busca lead por visitor ID |
| `createLead` | 36 | `(leadData)` | `Object` | Crea nuevo lead en hoja `Leads` |
| `updateLead` | 40 | `(leadData)` | `Object` | Actualiza lead existente |
| `saveMemory` | 44 | `(data)` | `Object` | Guarda snapshot en `Memoria_IA_Snapshots` |
| `getMemory` | 48 | `(idVisitante, idEmpresa)` | `Object` | Recupera memoria por visitor ID |
| `saveConversationLog` | 52 | `(data)` | `Object` | Registra interacción en `Logs_Chat_IA` |
| `getEmpresaConfig` | 56 | `(idEmpresa)` | `Object\|null` | Obtiene config de empresa desde `Config_Empresas` |

---

## Handlers Telegram (`handlers/telegram.js`)

| Función | Línea | Parámetros | Retorno | Descripción |
|---------|-------|-------------|---------|-------------|
| `getSession` | 9 | `(chatId)` | `Object` | Crea/recupera sesión del chat del Map |
| `loadAgentForEmpresa` | 26 | `(session, idEmpresa)` | `void` | Carga agente + config empresa desde GAS |
| `handleStart` | 47 | `(bot, msg, idEmpresa)` | `void` | Maneja comando `/start` |
| `handleMessage` | 69 | `(bot, msg, idEmpresa)` | `void` | Procesa mensaje de texto del usuario |
| `handleContact` | 148 | `(bot, msg, idEmpresa)` | `void` | Procesa contacto telefónico compartido |
| `setup` | 171 | `(bot, defaultEmpresa)` | `void` | Registra listeners de eventos del bot |

### Event listeners registrados por `setup()`

| Evento/Comando | Línea | Handler |
|----------------|-------|---------|
| `/start(?:\s+(.+))?` | 172 | `handleStart` |
| `/ayuda` | 178 | inline — mensaje de ayuda |
| `/datos` | 189 | inline — muestra datos registrados |
| `/contacto` | 205 | `sendContactPrompt` |
| `contact` | 209 | `handleContact` |
| `message` (no command) | 215 | `handleMessage` |
| `callback_query` | 223 | `answerCallbackQuery` |

---

## Handlers IA (`handlers/ai.js`)

| Función | Línea | Parámetros | Retorno | Descripción |
|---------|-------|-------------|---------|-------------|
| `callGemini` | 13 | `(prompt, history[], systemPrompt)` | `{answer}\|{error}` | Llama Gemini 2.0 Flash API |
| `callOpenRouter` | 46 | `(prompt, history[], systemPrompt)` | `{answer}\|{error}` | Llama OpenRouter (Llama 3.3 70B free) |
| `askAI` | 79 | `(prompt, history[], systemPrompt)` | `{answer}\|{error}` | Orquestador: prueba OpenRouter → Gemini |

---

## Handlers Leads (`handlers/leads.js`)

| Función | Línea | Parámetros | Retorno | Descripción |
|---------|-------|-------------|---------|-------------|
| `extractLeadData` | 3 | `(text)` | `Object` | Extrae nombre, teléfono, email de texto via regex + `[LEAD]` tags |
| `ensureLead` | 34 | `(chatId, idEmpresa, datosExtra)` | `{lead, isNew, result}` | Crea o actualiza lead en GAS |

---

## Handlers Memoria (`handlers/memory.js`)

| Función | Línea | Parámetros | Retorno | Descripción |
|---------|-------|-------------|---------|-------------|
| `getVisitorId` | 3 | `(chatId)` | `string` | Genera ID `TG-{chatId}` |
| `loadMemory` | 7 | `(chatId, idEmpresa, agentId)` | `Object\|null` | Recupera memoria desde `Memoria_IA_Snapshots` |
| `saveMemorySnapshot` | 25 | `(chatId, idEmpresa, agentId, convId, history, summary, contextData)` | `void` | Guarda snapshot de memoria en GAS |
| `logInteraction` | 41 | `(chatId, idEmpresa, convId, agentId, role, content)` | `void` | Registra interacción en `Logs_Chat_IA` |

---

## Handlers Menú (`handlers/menu.js`)

| Nombre | Línea | Tipo | Descripción |
|--------|-------|------|-------------|
| `MAIN_MENU` | 3 | Constante | Teclado principal con opciones: Habitaciones, Precios, Ubicación, Contacto, Ayuda |
| `CONTACT_KEYBOARD` | 16 | Constante | Teclado de contacto con botón "Compartir teléfono" |
| `sendMainMenu` | 27 | Función | Envía mensaje con teclado principal |
| `sendContactPrompt` | 31 | Función | Envía mensaje con teclado de contacto |
| `sendBackMenu` | 38 | Función | Retorna objeto reply_markup con botón "Volver" |
