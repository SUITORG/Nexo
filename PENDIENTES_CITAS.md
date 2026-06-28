# Pendientes — Módulo de Citas

## ✅ Completado por opencode

- [x] Crear estructura `citas/` con módulos (whatsapp, ai, calendar, notifier, actions, webhook)
- [x] SQL migration (ejecutar en Supabase Dashboard)
- [x] Endpoint GET `/api/citas` y `/api/clientes` para listar por empresa
- [x] Montar citas como sub-app en `server.js` (puerto único 3001)
- [x] Variables `.env` pre-configuradas (`CITAS_PORT`, `WEBHOOK_VERIFY_TOKEN`)
- [x] Test de integración: create client → schedule → cancel → waitlist (todo OK)
- [x] Endpoint `POST /api/webhook/citas` en server.js para notificaciones internas
- [x] Schema SQL corregido (sin FK references, `Config_Empresas` no tiene PK en Supabase)
- [x] Sub-app montada en server.js (rutas en puerto 3001 unificado)
- [x] Rutas expuestas: `GET/POST /webhook/whatsapp`, `GET /api/citas`, `GET /api/clientes`

## 🔴 Pendiente de ti (lo que no puedo automatizar)

- [ ] **Obtener WhatsApp API Token** (token permanente) y **Phone Number ID** de [developers.facebook.com](https://developers.facebook.com)
- [ ] Configurar el Webhook en Meta: URL `https://tudominio.com/webhook/whatsapp`, verify token `suitorg-citas-2026`
- [ ] Compartir calendarios Google con `opencode-sheets@suitorg00.iam.gserviceaccount.com` (rol: "Make changes to events")
- [ ] Descomentar `WHATSAPP_API_TOKEN` y `WHATSAPP_PHONE_ID` en `.env`
- [ ] Probar enviando un WhatsApp real al número de la empresa

## 🟡 Mejoras futuras

- [ ] Recordatorios automáticos 24h antes vía WhatsApp
- [ ] Dashboard web para ver citas por empresa

---

# Pendientes — Migración CampanasAi a Supabase

## 🔴 Pendiente de ti

- [ ] **Redeployar GAS**: `clasp push` en `CampanasAi/` para activar el endpoint `sync_industrias`
- [ ] Ejecutar: `node CampanasAi/scripts/sync-gas.js` para sincronizar industrias a Google Sheets (pestaña "Industrias")
- [ ] Verificar que la pestaña "Industrias" apareció en el Google Sheet con los datos
