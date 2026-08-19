# ADR-007: SuitChatTG — Chatbot Telegram con IA, Leads y Memoria

**Fecha:** 2026-07-21  
**Estado:** Aprobado  
**Contexto:** Se necesita un chatbot accesible desde Telegram para el negocio ROOMMATENL (renta de cuartos) que recoja leads, mantenga memoria de conversación y use el prompt existente de Prompts_IA.

## Decisión

Crear un módulo independiente `SuitChatTG/` que:

1. **Usa polling de Telegram** (no webhook) para simplicidad inicial — no requiere dominio público ni SSL.
2. **Conecta al GAS backend existente** para todas las operaciones de datos (Leads, Memoria_IA_Snapshots, Logs_Chat_IA, Prompts_IA).
3. **Identificador de visitante**: formato `TG-{chatId}` para diferenciar usuarios de Telegram de los del sitio web.
4. **IA dual**: prioriza OpenRouter (modelo gratuito `meta-llama/llama-3.3-70b-instruct:free`), fallback a Gemini API.
5. **Extracción de leads**: regex + tags `[LEAD]` compatibles con el sistema existente en `agents.js`.
6. **Memoria persistente**: cada 3 mensajes se guarda un snapshot. Al iniciar se recupera el histórico.
7. **Puerto 3011** — primer módulo de Telegram, sin conflicto con puertos existentes.
8. **Polling mode** — no requiere webhook ni certificado SSL, funciona en localhost.

## Consecuencias

- El bot necesita `TELEGRAM_BOT_TOKEN` en `.env` (crear en @BotFather).
- Las sesiones se mantienen en memoria (Map) — se pierden al reiniciar el servidor, pero el histórico persiste en GAS.
- El prompt del agente se carga desde `Prompts_IA` en GAS — mismo sistema que el chat del sitio web.
- La empresa se configura via `DEFAULT_ID_EMPRESA` en `.env` y puede pasarse como parámetro `?start=EMPRESA` en el deep link.

## Arquitectura

```
SuitChatTG/
├── index.js                    ← Express server + Telegram bot init
├── package.json
├── .env.example
├── db/
│   └── gas-client.js           ← Cliente HTTP para GAS backend
├── handlers/
│   ├── telegram.js             ← Comandos, mensajes, contact
│   ├── ai.js                   ← Gemini + OpenRouter inference
│   ├── leads.js                ← Extracción y guardado a Leads sheet
│   ├── memory.js               ← Carga/guarda Memoria_IA_Snapshots
│   └── menu.js                 ← Teclados personalizados Telegram
```

## Flujo

1. Usuario envía `/start` → bot carga prompt de `Prompts_IA` para ROOMMATENL
2. Bot recupera memoria de `Memoria_IA_Snapshots` (si existe)
3. Usuario escribe mensaje → bot envía a IA con historial + system prompt
4. Bot parsea respuesta en busca de `[LEAD]` tags o datos personales
5. Si detecta nombre+teléfono → guarda/actualiza en `Leads` via GAS
6. Cada 3 mensajes → guarda snapshot de memoria
7. Cada interacción → registra en `Logs_Chat_IA`

## Puertos

| Módulo | Puerto |
|---|---|
| SuitChatTG | 3011 |

## Tablas usadas

- Leads (escritura)
- Memoria_IA_Snapshots (lectura/escritura)
- Logs_Chat_IA (escritura)
- Prompts_IA (lectura)
- Config_Empresas (lectura)
