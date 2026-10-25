# CHECKLIST DE LANZAMIENTO — SuitCampanas (Campañas AI)

> **Para qué sirve:** verifica antes de lanzar que funcione, esté medido, respaldado y sea operable.
> **Audiencia:** quien aprueba el lanzamiento (dev + responsable del proyecto).
> **Versión:** 1.0 · **Fecha:** 2026-10-24

---

## Funcionalidad

- [ ] Flujo completo probado: BRIEF → Plan → Aprobar → Piezas → Video
- [ ] Mínimo 1 empresa real genera plan completo sin errores
- [ ] Solo Imagen genera PNG con logo + copy + contacto
- [ ] VIDE genera video con voz TTS y silencios correctos
- [ ] Estilos visuales se aplican y persisten en DB
- [ ] Datos inválidos (BRIEF vacío, campos faltantes) no rompen el parser

## Seguridad

- [ ] Secretos solo en `.env` (nada en código/frontend)
- [ ] `id_empresa` en toda query Supabase
- [ ] `API_AUTH_TOKEN` requerido en POST a GAS
- [ ] No hay API keys hardcodeadas nuevas (revisar `local-server-node.js`, `script.js`)
- [ ] `service_role` key de Supabase no expuesta al frontend

## Dependencias externas

- [ ] OpenRouter/Ollama responde (fallback Ollama probado)
- [ ] GAS deployment activo y URL correcta en `GAS_URL`
- [ ] Supabase tablas existen y con datos de prueba
- [ ] FFmpeg instalado y en PATH
- [ ] Edge TTS genera audio (conexión a internet)

## Respaldo

- [ ] Google Sheets respaldado (automático por Drive)
- [ ] Supabase backups activos (dashboard → Backups)
- [ ] Código en git con push a `main`

## Documentación

- [ ] `CONTRATO.md` al día con lo que se lanzó
- [ ] `MANUAL_TECNICO.md` actualizado
- [ ] `MANUAL_CLIENTE.md` actualizado
- [ ] `MANUAL_PROVEEDOR.md` actualizado
- [ ] `MANUAL_PRUEBAS.md` actualizado
