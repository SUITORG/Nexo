# SuitOrg — Fix: Modelos IA OpenRouter
**Fecha:** 17 Abril 2026 | **Estado:** ✅ Resuelto

---

## Problema
El agente IA fallaba al iniciar conversación con errores `404` y `429` en OpenRouter.

**Causa raíz:** Los modelos hardcodeados en `agents.js` y en GSheets (`gemini-1.5-flash`, `gemini-1.5-pro`) fueron deprecados por Google. Ya no existen en OpenRouter.

**Errores en consola:**
```
404 - models/gemini-1.5-flash-latest is not found for API
429 - Provider returned error (rate limit)
❌ Fallo total: Ni Gemini ni OpenRouter responden
```

---

## Causa Secundaria
La función `checkAiHealth` solo rotaba modelos cuando no había `choices` en la respuesta JSON, pero errores HTTP (`404`, `429`) no devuelven `choices` — el sistema no los detectaba como fallo y no rotaba.

---

## Fixes Aplicados

### 1. GSheets — `usa_soporte_ia` para cada tenant
**Cambiar a:**
```
openrouter/free
```
`openrouter/free` es un router automático que selecciona el mejor modelo gratuito disponible en ese momento. Elimina la dependencia de nombres de modelos específicos que se deprecan.

---

### 2. agents.js — `checkAiHealth` (línea 1043)
Agregar validación `res.ok` para detectar errores HTTP como fallo:
```javascript
// ANTES
if (data.choices && data.choices[0]) {

// DESPUÉS
const isOk = res.ok && data.choices && data.choices[0];
if (isOk) {
```

---

### 3. agents.js — Loop de rotación (línea 1067)
```javascript
// ANTES
if (testData.choices && testData.choices[0]) {

// DESPUÉS
if (testRes.ok && testData.choices && testData.choices[0]) {
```

---

### 4. agents.js — `diagnoseAi` lista hardcodeada (líneas 274-275)
```javascript
// ANTES
{ id: "gemini-1.5-flash", type: 'GEMINI' },
{ id: "gemini-1.5-pro", type: 'GEMINI' }

// DESPUÉS
{ id: "google/gemma-3-27b-it:free", type: 'OPENROUTER' },
{ id: "mistralai/mistral-7b-instruct:free", type: 'OPENROUTER' }
```

---

## Regla para el futuro
- **Nunca hardcodear modelos de Gemini** — Google los depreca sin aviso
- **Usar `openrouter/free`** en `usa_soporte_ia` como valor por defecto
- Si se necesita un modelo específico, verificar que existe en https://openrouter.ai/models antes de agregarlo
- Formato correcto en OpenRouter: `proveedor/modelo:free` (ej. `mistralai/mistral-7b-instruct:free`)

---

## Archivos Modificados
| Archivo | Líneas | Cambio |
|---|---|---|
| GSheets `Config_Empresas` | col `usa_soporte_ia` | `openrouter/free` |
| `agents.js` | 1043 | Validación `res.ok` |
| `agents.js` | 1067 | Validación `res.ok` en loop |
| `agents.js` | 274-275 | Modelos Gemini → modelos OpenRouter free |
