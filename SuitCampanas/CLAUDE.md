# Campañas AI - Proyecto CMS

## Estado Actual del Proyecto
✅ **PROBLEMA RESUELTO**: El sistema ahora usa CORS en lugar de no-cors, permitiendo ver errores reales del servidor.

## Funcionalidades Actuales

### Modos de Trabajo
- **Ai**: Generación con IA vía OpenRouter/Gemini
- **BD**: Carga empresas desde Google Sheets + IA
- **BDPR**: Previsualización manual sin IA
- **IMG**: Video de Imaginación desde carpeta local + receta

### IMG de Imaginación (Nuevo)
- 4to botón de modo exclusivo
- Usa el campo Empresa/Marca como texto/comentario personal
- Oculta Sitio Web, Teléfono, Asistente IA, Formatos, Plataformas
- Mantiene carga opcional de logo
- **Receta**: configurable desde Supabase (tabla `recetas`)
  - Orden: aleatorio / secuencial
  - Duración: 30s / 60s
  - Ritmo: música / 0.5s / 2s por foto
  - Filtro: ninguno / B&N / colores vivos / vintage
  - Transición: corte brusco / fundido / barrido derecha / zoom
  - Animación: on/off
- Botón "Crear Video de Imaginación" llama a `POST /api/video-imaginacion`
- El backend lee archivos de **MEDIA_FOLDER** (config en .env)
- Genera video con FFmpeg aplicando receta y lo descarga

### Endpoints Nuevos
- `GET /api/recetas` — lista recetas desde Supabase
- `POST /api/video-imaginacion` — genera video con receta + texto + logo

### Recetas Precargadas (Seed)
1. Mix Rápido (aleatorio, 30s, 0.5s, sin filtro, corte brusco)
2. Cine Vintage (secuencial, 60s, 2s, vintage, fundido, animación)
3. Show Vibrante (aleatorio, 30s, música, colores vivos, barrido)
4. Slow Elegance (secuencial, 60s, 2s, B&N, zoom, animación)
5. Sorpresa Total (aleatorio, 30s, música, sin filtro, fundido, animación)

## Archivos Modificados

- `index.html` — 4to botón IMG, sección de receta, botón "Crear Video"
- `script.js` — `setWorkMode('IMG')`, `loadRecetas()`, `generateImaginationVideo()`
- `style.css` — Estilos para recipe-section, active IMG button
- `local-server-node.js` — Endpoints `/api/recetas` y `/api/video-imaginacion` con FFmpeg
- `scripts/seed-supabase.js` — Seed de tabla `recetas` con 5 recetas
- `.env` / `.env.example` — Variable `MEDIA_FOLDER` agregada

## Para Probar IMG de Imaginación

1. Configura `MEDIA_FOLDER` en `.env` apuntando a carpeta con imágenes (jpg/png)
2. Corre `node scripts/seed-supabase.js` para crear las recetas en Supabase
3. Inicia servidor: `node local-server-node.js`
4. Abre `index.html`, selecciona modo **IMG**
5. Escribe texto opcional, sube logo (opcional), elige receta
6. Click **"Crear Video de Imaginación"**

### Agente de Tendencias (Nuevo)
- Botón "Buscar Tendencias" en la sección de receta (modo IMG)
- Llama a `POST /api/agent/tendencias`
- El agente (`scripts/agent-tendencias.js`):
  1. Pide a la IA (OpenRouter) generar 5 tendencias actuales
  2. Por cada tendencia, busca receta existente que coincida con su categoría
  3. Si no encuentra, la IA crea una **nueva receta** y la guarda en Supabase
  4. Genera el video llamando al mismo `/api/video-imaginacion`
  5. Guarda todo en la tabla `tendencias` de Supabase
- Las recetas nuevas se persisten y reusan

### Tablas Supabase Nuevas
- `tendencias` — id, titulo, categoria, descripcion, fuente, receta_id, video_url, metadata (JSONB), publicado, created_at
  - SQL de creación en `scripts/seed-supabase.js` (comentado)

## Archivos Nuevos
- `scripts/agent-tendencias.js` — agente autónomo con IA

## Archivos Modificados
- `local-server-node.js` — endpoint `POST /api/agent/tendencias`
- `index.html` — botón "Buscar Tendencias" en sección de receta
- `script.js` — `ejecutarAgente()` función frontend
- `scripts/seed-supabase.js` — SQL comentado para tabla `tendencias`

## Requisitos
- FFmpeg instalado y accesible desde línea de comandos
- Carpeta con al menos 1 imagen (jpg/png)
- Supabase con tablas `recetas` y `tendencias` pobladas
- OPENROUTER_API_KEY en .env (ya configurada)

---

*Proyecto mantenido por SuitOrg Team - 2026*