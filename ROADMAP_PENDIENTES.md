# Roadmap - Pendientes

## SuitTTS - Mejoras
- [ ] Agregar Edge-TTS con voz masculina mexicana
- [ ] Soporte para múltiples voces
- [ ] Selección de acento (MX, ES, AR, etc.)

## SuitMusic
- [ ] Integrar generación de música con Sunno AI
- [ ] BPM configurable
- [ ] Estilos: relajante, energético, cinematográfico

## SuitSubtitles
- [ ] Generar subtítulos SRT desde audio
- [ ] Sincronización automática

## SuitVideoAssembly
- [ ] Unir imágenes + voz + música + subtítulos
- [ ] Exportar MP4 final

## Integración SuitCampanas
- [ ] Endpoint `/api/video-completo`
- [ ] Botón en UI para crear video desde guion

## grupoevasol.com — Hosting y producción (encontrado 2026-08-18)
- [ ] Decidir de forma permanente dónde vive grupoevasol.com: hoy son **dos copias separadas** — GitHub Pages (`suitorg.github.io/Nexo`, se actualiza solo con cada push a `main`) y un hosting LiteSpeed/cPanel manual (el dominio real, se actualiza subiendo un ZIP a mano). Hasta que se unifiquen, cada fix hay que subirlo dos veces.
- [ ] Si se queda en LiteSpeed: automatizar la subida (FTP/rsync en CI) en vez de armar el ZIP y subirlo a mano cada vez
- [ ] Si se mueve a GitHub Pages: configurar DNS del dominio + archivo `CNAME` en el repo
- [ ] Detección de tenant por dominio: hoy `grupoevasol.com` sin `?co=EVASOL` en la URL cae a la demo genérica de SuitOrg (no existe detección por hostname ni se lee el `data-co-id` que ya trae el HTML pre-renderizado por el SSG) — agregar un fallback para que el dominio real muestre EvaSol por default

## Seguridad Supabase (encontrado 2026-08-18)
- [ ] Revisar políticas RLS: casi todas las tablas (`Catalogo`, `Proyectos`, `Leads`, `Config_Empresas`, etc.) tienen UPDATE/DELETE abiertos a `public` con `qual: true` — cualquiera con la llave anon (ya pública en el navegador) podría borrar o modificar datos de cualquier inquilino directo contra Supabase, sin pasar por el sitio
- [ ] Rotar el token de Hugging Face que quedó expuesto en `SuitCampanas/.env.test` (ya se excluyó de git, pero el token en sí sigue activo hasta que se rote)

## Limpieza menor
- [ ] `open-design/` quedó registrado como submódulo de git roto (gitlink sin entrada en `.gitmodules`) — arreglarlo o quitarlo del índice
- [ ] `.claude/skills/browser-act` es un symlink roto apuntando a una ruta que ya no existe (`SUITORGSTORE01`) — causa el warning `could not open directory` en cada `git status`
