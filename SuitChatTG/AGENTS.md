# AGENTS.md — SuitChatTG v1.0

Chatbot para Telegram con IA, captura de Leads y memoria persistente.

## Arquitectura

- **Runtime**: Node.js + Express (puerto 3011)
- **Bot API**: `node-telegram-bot-api` (polling mode, no requiere webhook SSL)
- **Backend de datos**: Google Apps Script (`backend/core.js` + `backend/utils.js`)
- **IA**: OpenRouter (prioridad) → Gemini API (fallback)
- **DB**: Google Sheets (Leads, Memoria_IA_Snapshots, Logs_Chat_IA, Prompts_IA, Config_Empresas)

## Flujo de conversación

```
/start → loadAgentForEmpresa() → carga prompt de Prompts_IA vía GAS
       → loadMemory() → recupera Memoria_IA_Snapshots (si existe)
       → sendMainMenu() → teclado personalizado

mensaje → askAI(prompt, history, agentPrompt) → IA responde
       → extractLeadData() → regex + [LEAD] tags
       → ensureLead() → guarda/actualiza en Leads sheet
       → logInteraction() → registra en Logs_Chat_IA
       → cada 3 msg → saveMemorySnapshot() → guarda en Memoria_IA_Snapshots
```

## Reglas inmutables

1. **Visitor ID**: formato `TG-{chatId}` — todos los usuarios de Telegram se identifican con este prefijo.
2. **Multi-tenant**: el `id_empresa` se recibe del parámetro `?start=EMPRESA` en el deep link. Default: `ROOMMATENL`.
3. **Prompt desde Prompts_IA**: el system prompt del agente se carga desde la tabla `Prompts_IA` en GAS. Si no se encuentra, usa un prompt genérico por defecto.
4. **Leads**: se guardan en la hoja `Leads` vía acción `createLead` / `updateLead` del GAS backend. No borrado físico (columna `activo`).
5. **Memoria**: snapshots cada 3 mensajes en `Memoria_IA_Snapshots`. Al iniciar se recupera el histórico completo.
6. **Logs**: cada interacción se registra en `Logs_Chat_IA`.
7. **Sesiones en memoria**: se almacenan en un `Map` interno. Se pierden al reiniciar el servidor, pero el histórico persiste en GAS.
8. **No hay secretos hardcodeados**: todas las API keys vienen de `.env`.
9. **Polling mode**: no requiere webhook ni certificado SSL. Funciona en localhost.
10. **Vinculación con Config_Empresas**: el campo `agent_enabled` almacena `TRUE,https://t.me/bot?start=EMPRESA`. Si solo dice `TRUE` o está vacío, no se muestra el botón de Telegram. El frontend parsea el link desde el SPA.

## Archivos clave

| Archivo | Propósito |
|---|---|
| `index.js` | Servidor Express, inicialización del bot, endpoints de health/sessions/link |
| `handlers/telegram.js` | Comandos `/start`, `/ayuda`, `/datos`, `/contacto`, manejo de mensajes y contacto telefónico |
| `handlers/ai.js` | Inferencia Gemini + OpenRouter con system prompt dinámico |
| `handlers/leads.js` | Extracción de datos personales (regex + `[LEAD]` tags), guardado a Leads |
| `handlers/memory.js` | Carga/guarda de Memoria_IA_Snapshots y Logs_Chat_IA |
| `handlers/menu.js` | Teclados personalizados Telegram (menú principal, contacto) |
| `db/gas-client.js` | Cliente HTTP para GAS backend (getAgentByEmpresa, createLead, getMemory, etc.) |

## Dependencias

- `express` — servidor HTTP
- `node-telegram-bot-api` — cliente Telegram Bot API
- `dotenv` — variables de entorno

## Comandos

```bash
node SuitChatTG/index.js              # Iniciar servidor (puerto 3011)
```

## Puerto registry

| Puerto | Servicio |
|--------|----------|
| 3011   | SuitChatTG (Express + Telegram Bot) |
