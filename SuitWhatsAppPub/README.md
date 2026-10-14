# SuitWhatsAppPub — Publicador de WhatsApp personal

Publica fotos/videos en un grupo de WhatsApp y en tus Historias/Estados, desde tu PC, con calendario automático y panel web local.

## Requisitos
- Windows 10+ / macOS / Linux
- Node.js 20+
- WhatsApp personal (NO Business)
- Navegador moderno

## Instalación
```bash
cd SuitWhatsAppPub
npm install
```

## Uso rápido
```bash
npm start                          # levanta panel + WhatsApp
node index.js publicar-ya          # publica ya (ignora calendario)
```

## Primer uso (vincular WhatsApp)
1. Ejecuta `npm start`
2. Abre `http://localhost:3019` en tu navegador
3. Escanea el QR con: WhatsApp → Dispositivos vinculados → Vincular dispositivo
4. La sesión se guarda en `./auth/` — no tendrás que escanear de nuevo

## Panel web (http://localhost:3019)
- **Conexión:** estado + QR cuando haga falta
- **Configuración:** grupo, carpeta de media, caption, Historias on/off, automático on/off
- **Calendario:** días (ej: `lunes 18:00, jueves 09:00`) y fechas exactas (ej: `2026-12-24 09:00`)
- **Publicar ahora:** envía el archivo más antiguo pendiente al grupo + Historias
- **Historial:** fecha, archivo, grupo, resultado

## CLI
```bash
node index.js publicar-ya                           # publica ahora
node index.js publicar-ya --sin-estado              # solo grupo
node index.js publicar-ya --solo-estado             # solo Historias
node index.js publicar-ya --grupo "Mi Grupo"        # elegir grupo
node index.js publicar-ya --caption "Texto"          # con caption
node index.js publicar-ya --reciente                # archivo más nuevo primero
node index.js publicar-ya --aleatorio               # archivo aleatorio
```

## Archivos
- Coloca tus fotos/videos en `./media/` (jpg, jpeg, png, webp, mp4)
- Los archivos publicados se mueven a `./media/enviados/`
- Límites: ≤16 MB imágenes, ≤64 MB video

## Cerrar sesión
Borra la carpeta `./auth/` y reinicia — te pedirá escanear el QR de nuevo.

## ⚠️ Advertencia
Baileys es una librería **no oficial** de WhatsApp. Su uso puede resultar en suspensión de cuenta. Úsala con cuidado y bajo tu responsabilidad.

## Archivos del sistema
- `auth/` — credenciales de sesión (NO commitear)
- `logs/` — app.log y errors.log
- `media/` — archivos pendientes
- `media/enviados/` — archivos ya publicados
- `config.json` — configuración (grupo, calendario, etc.)
