# ADR-060: SuitGmail — OAuth de usuario (no service_account) + reglas por remitente/palabra

## Status
Accepted (2026-11-03)

## Context
SuitGmail debe leer el Gmail personal de Roberto y producir un semáforo (banco, pagos, luz, agua, teléfono). En el repo ya existe `google-credentials.json` como **service_account** (se usa para Google Calendar en SuitCompromisos/Citas), pero una SA no puede leer un buzón personal salvo domain-wide delegation en Google Workspace.

## Decision
1. **OAuth de usuario** (cliente tipo "Aplicación de escritorio" + `refresh_token` guardado en `SuitGmail/config.json`, gitignored) con scope `gmail.readonly`.
2. **Cero dependencias**: node puro con `fetch` global (node ≥18), sin `googleapis`.
3. **Detección por reglas** (`reglas.json`): remitente + palabras clave, ventana 48h, sin ML. Semáforo: rojo (no reconocido/vencido/fraude), verde (pago confirmado), amarillo (resto de la categoría).
4. **UI en SuitMisCtas** (pestaña 📬 Gmail) consumiendo `GET /resumen` (CORS `*`, puerto 3021).

## Riesgos / mitigos
- `refresh_token` en config.json → gitignore explícito (el repo se publica entero en GH Pages).
- API habilitada + consent screen en la consola GCP (pendiente del usuario,1 vez).
- Ventana fija 48h y `maxResults=50` → suficiente para alertas, no para histórico.

## Alternativas consideradas
- service_account: imposible para Gmail personal.
- IMAP + app password: más simple pero contraseña de app en claro y scope mayor; el usuario prefirió OAuth (ya lo usa en calendario).

## Related
- `.suit/registry/projects.yaml` → `suit-gmail` (puerto 3021)
- `SuitMisCtas/index.html` → vista `v-gmail`
- `MASTER.bat` → autostart :3021
