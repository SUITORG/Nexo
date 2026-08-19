# Campañas AI - Proyecto CMS

## Contexto del proyecto
CMS de generación de campañas publicitarias con IA: pipeline Brief → MediaPlanner → BriefMarker → VIDE que produce videos publicitarios (guion, voz, imágenes, overlays) a partir de datos de empresas en Google Sheets + Supabase. Stack: Node.js (server propio, puerto 8000), FFmpeg, OpenRouter/Gemini (+ Ollama local como fallback), Edge TTS, Supabase.

## Alcance
Proyecto local — no se despliega vía GitHub Pages. El SEO/deploy de `grupoevasol.com` es un proyecto aparte en la raíz de `SuitOrg` (ver `SuitOrg/CLAUDE.md`), no vive aquí.

## Comandos clave
- `npm start` — arranca el servidor (`local-server-node.js`, puerto 8000)
- `npm run mock` — servidor mock (`mock-server.js`)
- `node scripts/seed-supabase.js` — siembra tablas `recetas`/`tendencias` en Supabase
- `npm test` — placeholder; la prueba real es manual abriendo `test.html` en navegador

## Reglas y convenciones
- Voz: Edge TTS neuronal — no gTTS, no versión npm no-comercial.
- IA: OpenRouter/Gemini como primario, Ollama local como 3er fallback.
- El estilo visual de un video se fija en la 1ra aprobación del plan y no cambia en reintentos.
- Overlays de logo/avatar/contacto van como miniaturas sobrepuestas sobre las imágenes generadas por IA, nunca como slides separados.
- Campos autollenados desde Google Sheets: normalizar/tolerar variaciones de formato (mayúsculas, protocolo de URL, etc.), nunca blanquear silenciosamente por un chequeo estricto.
- `SuitCampanas/` no pasa por el pipeline de deploy de GitHub Pages del repo raíz.
- Búsqueda de tendencias: hay dos flujos distintos, no confundirlos. BDSMT/VIDE (`buscarTendencias()` en `script.js`) es manual — el usuario elige una de la lista antes de que se aplique a `#aiTheme`. El Agente de Tendencias de modo IMG (`scripts/agent-tendencias.js`) es automático — procesa las 5 sin selección.

## Decisiones tomadas
- Selector de alcance de producción: Completo (12) / Semanal (7) / Demo (4), idempotente.
- `index.html` VIDE reorganizado en 3 bloques: suelto / campaña / retomar.
- Pausado explícitamente por el usuario (no retomar sin que lo pida): conversión de guion de meditación de 20 min a video; flag `--rate` para voz más lenta en TTS.

## Pendientes críticos
- Rotar credenciales de Google Cloud (acción manual, seguridad).
- Overlay de teléfono/sitio web en video + fix de normalización de URL en autofill de empresa (plan activo sin ejecutar aún).
- Prueba manual del usuario en navegador real para cerrar validación end-to-end del pipeline.
- Definir si se autoselecciona Formato/Plataforma desde el Brief (sin decidir aún).
- Agregar paso de selección manual de tendencia al Agente de IMG (`agent-tendencias.js`) — hoy genera las 5 automáticamente sin que el usuario elija (a diferencia del flujo de BDSMT/VIDE).

---

*Proyecto mantenido por SuitOrg Team - 2026*
