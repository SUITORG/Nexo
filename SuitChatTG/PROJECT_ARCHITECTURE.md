# SuitChatTG — Architecture Reference

> **Propósito:** Chatbot multi-inquilino para Telegram con IA conversacional, captura de Leads y memoria persistente.
> **Versión:** 1.0.0
> **Puerto:** 3011
> **Dependencia externa:** GAS backend (`backend/core.js`)

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Runtime** | Node.js v24+ |
| **Framework HTTP** | Express 4.x |
| **Bot API** | `node-telegram-bot-api` (polling mode) |
| **Backend de datos** | Google Apps Script (GAS) — `backend/core.js` + `backend/utils.js` |
| **IA Primaria** | OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`) |
| **IA Fallback** | Google Gemini 2.0 Flash |
| **DB** | Google Sheets (hojas: Leads, Memoria_IA_Snapshots, Logs_Chat_IA, Prompts_IA, Config_Empresas) |
| **Autenticación GAS** | API Token (`API_AUTH_TOKEN` en `.env`) |

---

## 2. Mapa de Archivos

```
SuitChatTG/
├── index.js                    → Servidor Express + inicialización del bot
├── package.json                → Dependencias (express, node-telegram-bot-api, dotenv)
├── .env.example                → Plantilla de variables de entorno
├── AGENTS.md                   → Reglas del subproyecto para agentes SuitOS
├── PROJECT_ARCHITECTURE.md     → Este documento
├── CODE_INDEX.md               → Índice de funciones
├── db/
│   └── gas-client.js           → Cliente HTTP para GAS backend
├── handlers/
│   ├── telegram.js             → Comandos, mensajes, contacto, sesiones
│   ├── ai.js                   → Inferencia Gemini + OpenRouter
│   ├── leads.js                → Extracción y guardado de Leads
│   ├── memory.js               → Carga/guarda de memoria persistente
│   └── menu.js                 → Teclados personalizados Telegram
└── public/                     → Archivos estáticos (futuro)
```

---

## 3. Flujo de Datos

### 3.1 Inicio de conversación (`/start`)

```
1. Usuario envía /start (con o sin parámetro ?start=EMPRESA)
2. telegram.js → getSession() → crea/recupera sesión en Map
3. loadAgentForEmpresa() → gas.getAgentByEmpresa(idEmpresa)
   ├── gas.getAgentByEmpresa() → callGAS('getAll') → filtra Prompts_IA
   └── gas.getEmpresaConfig() → callGAS('getAll') → filtra Config_Empresas
4. memory.loadMemory() → gas.getMemory(vid, idEmpresa)
   └── GAS: getSheetData('Memoria_IA_Snapshots') + getSheetData('Logs_Chat_IA')
5. menu.sendMainMenu() → bot.sendMessage() con teclado personalizado
```

### 3.2 Mensaje del usuario

```
1. telegram.js handleMessage() recibe texto
2. session.history.push({role:'user', content})
3. ai.askAI(text, history, agentPrompt)
   ├── systemPrompt = session.agentPrompt (desde Prompts_IA) o default
   ├── callOpenRouter() o callGemini()
   └── retorna {answer} o {error}
4. session.history.push({role:'assistant', content: answer})
5. bot.sendMessage(chatId, answer)
6. leads.extractLeadData(text) → busca [LEAD] tags, regex nombre/tel/email
7. Si hay datos → leads.ensureLead(chatId, idEmpresa, leadData)
   └── gas.getLeadByVisitor() → existing? update : create
8. memory.logInteraction() → gas.saveConversationLog()
9. Cada 3 mensajes → memory.saveMemorySnapshot()
   └── gas.saveMemory() → updateRowMapped / appendRowMapped
```

---

## 4. API Endpoints

| Método | Ruta | Línea | Parámetros | Descripción |
|--------|------|-------|------------|-------------|
| GET | `/api/health` | 31 | — | Health check del bot |
| GET | `/api/sessions` | 36 | — | Sesiones activas del bot |
| GET | `/api/link` | 50 | `?id_empresa=` | Genera deep link t.me/bot?start=EMPRESA |

---

## 5. Comandos de Telegram

| Comando | Handler | Descripción |
|---------|---------|-------------|
| `/start` | `handleStart()` | Inicia conversación. Acepta parámetro `EMPRESA` para multi-tenant |
| `/start EMPRESA` | `handleStart()` | Inicia conversación con una empresa específica |
| `/ayuda` | inline | Muestra lista de comandos disponibles |
| `/datos` | inline | Muestra los datos personales registrados del usuario |
| `/contacto` | `sendContactPrompt()` | Solicita compartir número telefónico vía botón |

---

## 6. Sesiones (en memoria)

Estructura del `Map` de sesiones (`telegram.js:9`):

```js
{
  history: [{role, content}],  // Historial de la conversación (máx 20)
  convId: 'CHAT-TG-{chatId}-{timestamp}',
  agentId: 'AGT-ROOMMATENL',            // Desde Prompts_IA
  agentName: 'Asistente ROOMMATENL',     // Desde Prompts_IA
  agentPrompt: '...',                    // System prompt desde Prompts_IA
  empresaNombre: 'ROOMMATENL',           // Desde Config_Empresas
  idEmpresa: 'ROOMMATENL',               // Compañía activa
  leadData: {nombre, telefono, email},  // Datos capturados
  msgCount: 0                           // Contador para snapshots de memoria
}
```

---

## 7. Tablas de Google Sheets utilizadas

| Hoja | Operación | Propósito |
|------|-----------|-----------|
| `Leads` | Crear / Actualizar | Almacena datos personales de los visitantes |
| `Memoria_IA_Snapshots` | Leer / Escribir | Snapshots de memoria cada 3 mensajes |
| `Logs_Chat_IA` | Crear | Registro de cada interacción del chat |
| `Prompts_IA` | Leer | Obtiene el system prompt del agente IA |
| `Config_Empresas` | Leer | Obtiene configuración de la empresa (nombre, teléfono) |

---

## 8. Seguridad

- `API_AUTH_TOKEN` requerido en cada POST al GAS backend (validado en `backend/core.js`)
- No se exponen API keys en código — todas vienen de `.env`
- No hay secretos hardcodeados
- El token de Telegram solo permite enviar/recibir mensajes del bot (no acceso a otros bots)
- Visitor ID usa prefijo `TG-` para aislar usuarios de Telegram del sitio web

---

## 9. Integración con SuitOrg

### Desde el sitio web (frontend)
- El campo `agent_enabled` en `Config_Empresas` almacena el link: `TRUE,https://t.me/bot?start=EMPRESA`
- Formato: `TRUE` + `,` + URL de Telegram. Si solo dice `TRUE` o está vacío, no se muestra el botón.
- El frontend (`public.js`) parsea este campo y renderiza un botón azul de Telegram si detecta un link `https://t.me/...`
- Endpoint `/api/link` del bot genera deep link dinámico: `https://t.me/{username}?start={id_empresa}`
- Compatible con Supabase: el mismo campo TEXT funciona en ambas bases de datos

### Desde Telegram
- El bot funciona independientemente del sitio web
- Usa el mismo GAS backend y las mismas tablas
- Compatible multi-tenant: cada empresa tiene su propio agente/prompt
- Puede convivir con el chat interno del sitio web (ambos escriben en las mismas tablas)
