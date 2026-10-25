# MANUAL PROVEEDOR — SuitCampanas (Campañas AI)

> **Para qué sirve este manual:** enseña al operador (equipo SuitOrg que atiende clientes) a operar el CMS: configurar empresas, generar campañas, entregar resultados.
> **Audiencia:** frontend — operador/proveedor del servicio.
> **Versión:** 1.0 · **Última actualización:** 2026-10-24 · **Plataforma:** SuitCampanas

---

## 1. Operación diaria

1. Verificar que el servidor está corriendo (`npm start`, puerto 8000)
2. Verificar OmniRoute activo (si no, la IA cae a Ollama — lento)
3. Revisar BRIEFs pendientes en `Config_Empresas` (campo `logo_url`)
4. Generar planes → aprobar → producir → entregar

## 2. Configurar una empresa nueva

1. Verificar que la empresa existe en `Config_Empresas` (Google Sheets)
2. Completar el BRIEF en `logo_url` (formato pipe-delimited, ver `BRIEF.MD`)
3. Verificar `LAPVTFU` con activos (logo, avatar, fotos, videos)
4. Si `db_engine = SUPABASE`, verificar que las tablas existen

## 3. Producción de campañas

1. **Generar Plan** → revisar suposiciones de la IA (`assumptions` en el JSON)
2. **Aprobar Plan** → elijo estilo visual (se fija para todas las piezas)
3. **Revisar piezas** → verificar copy, CTA, tono contra el BRIEF
4. **Producir** → VIDE (rápido) o ViRe (calidad)
5. **Entregar** → compartir links o descargar MP4s

## 4. Mantenimiento de prompts

Los prompts de IA viven en Supabase `Prompts_IA`:
- `CAMP-MEDIAPLANNER` — genera planes
- `CAMP-BRIEFMARKER` — genera piezas creativas
- `CAMP-STYLEDIRECTOR` — genera estilos visuales

Para actualizar: editar en Supabase o Google Sheets (GAS es fuente de verdad).

## 5. Problemas frecuentes

| Problema | Qué hacer |
|---|---|
| Pieza con copy genérico | El BRIEF está incompleto — completar audiencia/dolor/objetivo |
| 429 rate limit en OpenRouter | Esperar 3s entre generaciones (ya automático) |
| Estilo visual inconsistente | Solo puede haber 1 estilo por plan — verificar `estilo_visual` en DB |
