# MANUAL PRUEBAS — SuitCampanas (Campañas AI)

> **Para qué sirve este manual:** ejecuta pruebas E2E sin dependencias reales (mock mode) para validar cambios antes de producción.
> **Audiencia:** modo test/dev — desarrollador verificando cambios.
> **Versión:** 1.0 · **Última actualización:** 2026-10-24 · **Plataforma:** SuitCampanas

---

## 1. Modo mock (sin IA real)

```bash
npm run mock          # servidor mock en puerto 8000
```
- No llama a OpenRouter/Ollama/Supabase
- Devuelve respuestas predefinidas
- Para verificar lógica de UI y parsing

## 2. Pruebas de parsing del BRIEF

```bash
node scripts/tmp_test_parser.js
```
- Verifica `parseBrief()` con NOET y formato legado
- Salida esperada: objetos JSON con campos parseados correctamente

## 3. Prueba de conexión GAS

Abrir `test.html` en el navegador:
- Verifica CORS real (no `no-cors`)
- Muestra errores reales del servidor
- Estado: ✅ conexión OK o ❌ error detallado

## 4. Smoke test manual (producción)

1. `npm start` → abrir `http://localhost:8000`
2. Seleccionar empresa con BRIEF completo (ej. NOET o TOÑOTOQUES)
3. Generar Plan de Medios → verificar JSON con campaigns y slots
4. Aprobar plan → verificar que las piezas se crean en Supabase
5. Generar Solo Imagen → verificar PNG renderizado

## 5. Verificación de prompts

```bash
node scripts/seed-media-plan-prompts.js   # seed/actualiza prompts en Supabase
```
Verificar en Supabase que `Prompts_IA` tiene los 3 IDs con `habilitado = 'TRUE'`.

## 6. Prueba de TTS

EDGE TTS se prueba con cualquier generación de video VIDE — verificar:
- Audio MP3 generado por escena
- Silencio real entre segmentos (no frame negro)
- Voz `es-MX-DaliaNeural`

## Checklist de regresión

- [ ] `node --check local-server-node.js` pasa
- [ ] `node scripts/tmp_test_parser.js` pasa
- [ ] Servidor arranca en puerto 8000 sin errores
- [ ] `test.html` muestra conexión GAS OK
- [ ] Generar Plan funciona con al menos 1 empresa real
- [ ] Solo Imagen genera PNG sin errores
