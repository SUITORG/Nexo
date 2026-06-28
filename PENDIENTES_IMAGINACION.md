# PENDIENTES - IMG de Imaginación + Agente de Tendencias

## Setup Inicial (1 vez)

- [x] Crear tabla `recetas` en Supabase (SQL desde seed-supabase.js)
- [x] Crear tabla `tendencias` en Supabase (SQL desde seed-supabase.js)
- [x] Ejecutar `node scripts/seed-supabase.js` para poblar recetas
- [x] Configurar `MEDIA_FOLDER` en `.env`
- [x] Crear carpeta `media/` en SUITORGSTORE01
- [ ] Poner imágenes (jpg/png) en `C:\Users\rojo-\Downloads\SUITORGSTORE01\media\`

## Para Probar

- [ ] Iniciar servidor: `node local-server-node.js`
- [ ] Abrir `index.html` en navegador
- [ ] Seleccionar modo **IMG** (4to botón)
- [ ] Elegir formato (Post/Reel/Story/Banner) y red social
- [ ] Escribir texto opcional en "Texto / Comentario"
- [ ] Subir logo (opcional)
- [ ] Elegir una receta del dropdown
- [ ] Click **"Crear Video de Imaginación"**
- [ ] Verificar que el video se descarga

## Probar Agente de Tendencias

- [ ] Estando en modo IMG, click **"Buscar Tendencias"**
- [ ] Verificar que el agente crea tendencias + recetas nuevas (si aplica)
- [ ] Verificar que las recetas nuevas aparecen en el dropdown

## Browser-act (Navegador para Tendencias Reales)

- [ ] Probar `browser-act stealth-extract "https://trends.google.com/trending" --content-type markdown` (cuando haya buena conexión, descarga ~20MB la primera vez)
- [ ] Si falla la descarga del paquete, reintentar con internet más estable
- [ ] Si usas modo `chrome-direct`, cerrar Chrome y ejecutar con `--allow-restart-chrome` una vez

## Posibles Mejoras Futuras

- [ ] Soportar videos (mp4/mpg) además de imágenes
- [ ] Soportar audio MP3 como música de fondo
- [ ] Publicación automática a redes sociales
- [ ] Programación automática (cron) del agente
- [ ] Más fuentes de tendencias (Google Trends, APIs reales)
