# ADR-055: SuitWhatsAppPub — publicador WhatsApp personal con calendario

## Status
Accepted (2026-10-12)

## Context
El usuario pidió un programa local para publicar fotos/videos en un grupo de WhatsApp personal (NO Business) y en Historias/Estados, con calendario automático, cola de archivos y panel web — sin servicios de pago ni Cloud API.

## Decision
Crear `SuitWhatsAppPub/` (puerto 3019) con:
- **Baileys 7.0.0-rc14** (librería no oficial, sin cuenta Business) — QR de vinculación, sesión persistente en `auth/`
- **Panel web local** (Express, vanilla dark navy/green) en `:3019`: estado de conexión + QR, grupo, carpeta, caption, Historias on/off, calendario (días + fechas exactas), "Publicar ahora", historial
- **Cola de media**: toma el archivo más antiguo de `./media/` (jpg/png/webp/mp4), valida tamaño (≤16MB img / ≤64MB video), publica en grupo + `status@broadcast`, mueve a `./media/enviados/` solo si todo OK
- **Calendario**: `config.json` con días (`"lunes 18:00"`) y fechas exactas (`"2026-12-24 09:00"`) en `America/Monterrey`; modo automático chequea cada 60s
- **Errores visibles**: todos los errores en español con acción sugerida, logs en `logs/app.log` + `logs/errors.log`, cero fallos silenciosos
- **CLI**: `node index.js publicar-ya` con flags `--grupo`, `--sin-estado`, `--solo-estado`, `--caption`, `--reciente`, `--aleatorio`

## Rationale
- Baileys es la única librería que permite WhatsApp personal sin Business API ni servicios de pago
- Panel local (no nube) = el usuario controla su PC y su cuenta
- Cola con mover-a-enviados = previene reenvíos sin estado de BD

## Consequences
- **Riesgo**: Baileys es no-oficial — puede suspender la cuenta de WhatsApp; advertencia en README
- API de Baileys cambia entre versiones — código adaptado a 7.0.0-rc14
- El panel solo funciona en la PC local (no expuesto a red)
- `auth/` contiene credenciales — gitignored

## Related
- `SuitWhatsapp/` (sandbox viejo con whatsapp-web.js — no se toca)
- Puerto 3019 registrado en AGENTS.md + projects.yaml
