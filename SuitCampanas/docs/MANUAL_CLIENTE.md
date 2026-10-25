# MANUAL CLIENTE — SuitCampanas (Campañas AI)

> **Para qué sirve este manual:** enseña al usuario final (equipo de marketing que crea campañas) a usar la interfaz, paso a paso.
> **Audiencia:** frontend — usuario sin conocimientos técnicos.
> **Versión:** 1.0 · **Última actualización:** 2026-10-24 · **Plataforma:** SuitCampanas

---

## 1. Bienvenida

- Genera campañas publicitarias completas con IA en minutos
- BRIEF de tu empresa → Plan de Medios → Piezas listas para publicar
- Videos, posts y stories sin saber editar

## 2. Pantalla de inicio

Al abrir `http://localhost:8000` (o `iniciar.bat`) ves:
- **Panel principal** con opciones: Generar Plan, Estilos, VIDE, ViRe, Solo Imagen
- Selector de empresa (si tienes acceso a varias)

## 3. Flujo principal

### Paso 1: Generar Plan de Medios
1. Selecciona tu empresa
2. Click **"Generar Plan de Medios"**
3. La IA analiza tu BRIEF y crea 2-5 campañas con 5-20 piezas
4. **Revisa el plan** — puedes ajustar prioridades y canales
5. Click **"Aprobar"** cuando estés conforme

### Paso 2: Generar Piezas
1. Tras aprobar, cada pieza se genera con copy + dirección visual
2. Las piezas aparecen en la lista con estado `pendiente_revision`
3. **Revisa cada pieza**: hook, texto, CTA
4. Aprueba las que quieras producir

### Paso 3: Elegir Estilo Visual
1. Ve a la pestaña de **Estilos**
2. Elige una categoría (o genera uno nuevo con IA)
3. El estilo se aplica a todas las piezas del plan

### Paso 4: Producir Video/Imagen
1. **VIDE** → video narrado con voz (para Reels/TikTok)
2. **ViRe** → video con Remotion (más calidad, más lento)
3. **Solo Imagen** → pieza estática rápida

## 4. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| "Todos los modelos fallaron" | OmniRoute no corriendo | Esperar o pedir al admin que inicie OmniRoute |
| Plan vacío | BRIEF incompleto | Completar BRIEF en Google Sheets (campo logo_url) |
| Video sin voz | Edge TTS no disponible | Reintentar; verificar conexión a internet |
| Estilo no se aplica | Plan ya aprobado con otro estilo | El estilo se fija en la 1ª aprobación — crear plan nuevo |
