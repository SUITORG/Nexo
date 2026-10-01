# MODELOS — inventario real del switch

> Generado desde `GET /api/ia/modelos`. El sufijo **(local)** marca lo que corre en tu máquina (Ollama).
> Estado de la cadena al generar: ollama: OK · openrouter: OK · gemini: sin GEMINI_API_KEY · autoclaw: OK

| Modelo | Proveedor | Origen | Visión | Detalle |
|---|---|---|---|---|
| qwen36-uncensored-32k:latest | ollama | **(local)** | sí | 35.1B |
| qwen3-coder:latest | ollama | **(local)** | no | 30.5B |
| hf.co/ornith-ai/Ornith-1.0-9B-GGUF:Q4_K_M | ollama | **(local)** | no | 8.95B |
| richardyoung/qwen3-14b-abliterated:Q4_K_M | ollama | **(local)** | no | 14.8B |
| glm-5.2:cloud | ollama | **(local)** | no | 756b |
| gemma4:12b | ollama | **(local)** | sí | 11.9B |
| qwen2.5-coder:14b | ollama | **(local)** | no | 14.8B |
| qwen3.6:latest | ollama | **(local)** | sí | 36.0B |
| fredrezones55/Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive:latest | ollama | **(local)** | sí | 35.1B |
| joe-speedboat/Qwen3.6-35B-A3B-Uncensored-HauhauCS-Aggressive:Q4_K_M | ollama | **(local)** | sí | 35.1B |
| qwen3.6:35b | ollama | **(local)** | sí | 36.0B |
| Jarcgon/Qwen3.6-35B-A3B-Claude-4.7-Opus-abliterated-uncenfull:latest | ollama | **(local)** | no | 34.7B |
| gemma4:e4b | ollama | **(local)** | sí | 8.0B |
| qwen2.5-coder:latest | ollama | **(local)** | no | 7.6B |
| qwen:latest | ollama | **(local)** | no | 4B |
| qwen3.5:latest | ollama | **(local)** | sí | 9.7B |
| llama3.2:latest | ollama | **(local)** | no | 3.2B |
| stealth/space-bunny-alpha | openrouter | nube | sí | gratis |
| qwen/qwen3.8-27b:free | openrouter | nube | sí | gratis |
| dots-studio/dots-3-note-preview:free | openrouter | nube | sí | gratis |
| thinkingmachines/inkling-small:free | openrouter | nube | sí | gratis |
| thinkingmachines/inkling:free | openrouter | nube | sí | gratis |
| nvidia/nemotron-3.5-content-safety:free | openrouter | nube | sí | gratis |
| nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | openrouter | nube | sí | gratis |
| google/gemma-4-26b-a4b-it:free | openrouter | nube | sí | gratis |
| google/gemma-4-31b-it:free | openrouter | nube | sí | gratis |
| google/lyria-3-pro-preview | openrouter | nube | sí | gratis |
| google/lyria-3-clip-preview | openrouter | nube | sí | gratis |
| openrouter/free | openrouter | nube | sí | gratis |
| autoglm | autoclaw | nube | sí | ok |

Totales: **30 modelos** (17 locales en Ollama, 13 en nube).

## Notas

- La columna **Origen** es lo que distingue un modelo **(local)** de uno en nube.
- Solo los modelos con **Visión: sí** sirven para leer fotos; el resto aparecen porque están
  instalados (se muestran tachados como `[sin visión]` en la UI).
- La lista de OpenRouter se **auto-descubre** (precio 0 + `image` en `input_modalities`),
  no está hardcodeada: si un modelo deja de ser gratis o desaparece, sale de la lista solo.
- Los 17 de Ollama se leen de `GET /api/tags`; la capacidad `vision` viene de `capabilities`.

## Cadena de fallback

`ollama -> openrouter -> gemini -> autoclaw` — 3 fallos seguidos = 5 min de cooldown por eslabón.

Si un eslabón falla, el error de la corrida lista el motivo de cada uno:
`Sin proveedor IA disponible -> ollama: ... | openrouter: ... | gemini: ... | autoclaw: ...`
