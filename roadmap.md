# 🗺️ ROADMAP — SuitOrg (v16.7.28)

> Unificado desde: `roadmap.md` + `PENDIENTES_*` + `Documentacion/06-estatus-roadmap.md` + `CampanasAi/ROADMAP_CampanasAI.md`

---

---

## 🟢 Pendientes por Área

### Reservaciones (Citas + Calendar)

- [ ] **Webhook Meta**: Configurar URL `https://tudominio.com/webhook/whatsapp` con verify token `suitorg-citas-2026`
- [ ] Recordatorios automáticos 24h antes vía WhatsApp (cuando WhatsApp API esté en producción)
- [ ] Dashboard web para ver citas por empresa

### Pagos (Stripe)

- [ ] Configurar `stripe_activo = TRUE` en `Config_Empresas` (Sheets) para negocios que acepten tarjeta
- [ ] Configurar Webhook en Stripe Dashboard → `https://tudominio.com/api/stripe/webhook` (eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`)

### ViRe (Remotion Video)

- [ ] Obtener API key de **KIE.ai** — da acceso a GPT-4o Image, Veo 3, Sora 2, ElevenLabs
- [ ] Configurar Google Cloud TTS (facturación activa) y descargar credenciales JSON
- [ ] Probar Remotion Studio: `cd SuitVidGenRemotion && npm run dev` → `http://localhost:3004`
- [ ] Conectar `scripts/helpers/dbConnector.js` a la API de CampanasAi
- [ ] Agregar endpoint `POST /api/vire/render` en `local-server-node.js`
- [ ] Integrar `@remotion/captions` con `createTikTokStyleCaptions()` para subtítulos profesionales
- [ ] Soportar archivos SRT generados por Whisper
- [ ] Plantillas: Reel (1080x1920), Story (1080x1920), Post (1080x1080), Banner (1200x628)

### CampanasAi / Imaginación

- [ ] Verificar que la pestaña "Industrias" apareció en el Google Sheet
- [ ] Probar flujo IMG completo: elegir formato → subir logo → elegir receta → "Crear Video de Imaginación"
- [ ] Probar Agente de Tendencias: click "Buscar Tendencias" en modo IMG
- [ ] Probar `browser-act stealth-extract` para tendencias reales
- [ ] Configurar publicación automática a redes sociales
- [ ] Soportar videos (mp4/mpg) además de imágenes
- [ ] Soportar audio MP3 como música de fondo

### Infraestructura & Optimización

- [ ] **Optimización de carga secuencial (GAS→Supabase)**:
  - **GAS**: Nuevo action `getConfig` que devuelve solo `Config_Empresas` filtrada (~300ms en vez de 2-5s)
  - **GAS**: Flag `skip_private=true` en `getAll` para omitir tablas privadas cuando `db_engine=SUPABASE`
  - **Frontend**: `loadData()` bifurca temprano — si `db_engine=SUPABASE`, salta `getAll` pesado y carga maestras desde GAS (12 tablas) + privadas desde Supabase (18 en paralelo)
  - **Archivos**: `backend/core.js` (doGet), `js/modules/core.js` (loadData), `clasp push`
  - **Ganancia**: ~3-5s → ~1-1.5s en SUPABASE mode. GSHEETS no se modifica.
- [ ] Sincronización automática GSheets → Supabase (puente invisible)
- [ ] Bug: Catálogo POS solo muestra 1 producto con `db_engine=SUPABASE`
- [ ] Implementar `saveRecord()` en módulos restantes de admin.js (Leads, etc.)
- [ ] Pulse de sincronización (heartbeat cada 30-60s en POS/Monitor)
- [ ] Gestión de sesiones por rol (Staff persistente / Clientes 60 min)
- [ ] Detección de datos caducos antes de procesar pagos

### Módulos Funcionales

- [ ] **v16.9.8**: JSON Generator Tool — generar estructura JSON desde datos persistentes
- [ ] **v16.9.5**: UI Polishing & SEO Shield — filtrado JSON-LD, logo corporativo fallback
- [ ] **v15.8.0**: AI Interactive & Health Status — indicador visual de disponibilidad de IA
- [ ] **v6.3.0**: Suit Shortlinks & Friendly URLs — capa de enlaces internos con alias
- [ ] **v5.8.0**: Blog & Accesibilidad (A11y) — artículos, lectores de pantalla, alto contraste
- [ ] **v6.4.0**: Discovery & Visitor Seeding — persistencia de visitas (LocalStorage)
- [ ] **v16.8.0**: Admin Manual Gallery Management — panel drag & drop para galería
- [ ] Visibilidad de Logs: delay visual o marquesina para `BS-T`
- [ ] Robustez de Logs: captura de error exacto en bloques `catch`
- [ ] **v5.9.0**: Smart Memory & Human Handoff (WhatsApp Bridge)
- [ ] **v15.7.0**: Config_AIO Personalidad de Negocio — tono, USP, limitaciones por empresa

### Seguridad & Multi-Tenant

- [ ] RLS por tenant (filtro real `id_empresa` en todas las tablas Supabase)
- [ ] Encriptación de passwords
- [ ] Panel admin para agregar usuarios sin tocar GSheets
- [ ] Aislamiento multi-tenant en reportes
- [ ] Excepción de consolidación solo para SuitOrg (vista global DIOS)

### Cuotas & SaaS

- [ ] Interfaz Admin para consultar y actualizar estados de pago
- [ ] Alertas de vencimiento de cuotas

### Asistente IA Premium

- [ ] Interacción por voz (Speech-to-Text + Text-to-Speech)
- [ ] Function Calling operativo (consultar stock, ventas del día, créditos)
- [ ] Parametrización y monetización por empresa (SaaS Hook)
- [ ] Seguridad integrada (RBAC por función)

### Estandarización MCP

- [ ] Servidor de herramientas MCP independiente
- [ ] Compatibilidad universal (Web, Desktop, WhatsApp)
- [ ] Bridge Cloud → Google Apps Script Backend
- [ ] NotebookLM Integration

### Despliegue & Cloud

- [ ] Despliegue externo (Vercel o similar)
- [ ] Fix de renderizado en prod: rutas de imágenes (C:// → Drive URL)
- [ ] Configurar Oracle Cloud Free Tier (VPS con Node.js, FFmpeg, PM2, nginx)
- [ ] Dominio personalizado + HTTPS (Let's Encrypt)
- [ ] Backup automático

### Calidad (QA)

- [ ] Aseguramiento con Playwright: validación visual automática de flujos críticos
- [ ] Auditoría Visual UX: colores, textos, layouts

### Integraciones

- [ ] Higgsfield AI: autenticar (`higgsfield auth login`), probar generación de imagen
- [ ] Notion API: explorar casos de uso, crear skill de opencode

### Georreferenciación

- [ ] **v5.2.6**: Localización inteligente (capturar ubicación del visitante para auto-llenado)

---

## ✅ Historial (Completado)

### v16.7.x — Reservaciones + Calendar
- Botón "Agendar Cita" en header nav (público)
- Modal de reservación → `POST /api/reservaciones` → Supabase
- Google Calendar API habilitada + service account configurada
- `usa_reservaciones` normalizado a 0/1/2 en `core.js`
- `submitReservation` con fallback: SUPABASE→local endpoint, GSHEETS→GAS
- Staff panel lee `Reservaciones` desde Supabase
- `findOrCreateClient` + `createReservation` handler en GAS
- `AGENTS.md`: regla `node --check` tras cada edición JS

### v16.3.x–v16.7.x — Hybrid Data Engine
- Motor dual (GSheets + Supabase) con merge por `db_engine`
- 18 tablas cargadas desde Supabase vía proxy `/api/db/:table`
- `Config_Empresas` merge: Supabase sobreescribe GAS
- RBAC: Usuarios y Config_Roles desde Supabase

### v16.0 – Stripe Payments
- Módulo Stripe en `conecionpagos/index.js`
- Endpoints: config, create-payment-intent, payment-status, webhook
- Botón "Tarjeta" en POS + checkout público
- Flujo: Stripe Elements → PaymentIntent → Webhook

### v15.x — Hybrid AI, PA PER, Seguridad
- Motor dual Gemini/OpenRouter con auto-rotación
- PA PER: migración a Supabase, memoria semántica
- Eliminación de secrets hardcodeados (PropertiesService)
- JSON-LD dinámico, AIO, permisos para bots
- Martha Padrón Trust-First Flow

### v14.x–v13.x — Multi-Tenant, Galería, Hero
- Arquitectura multi-motor (GSheets + Supabase)
- Hero Banner Pro, Galería Matrix Dinámica
- Identidad visual por tenant (color_tema)

### v6.x–v12.x — Modularización, SEO, Delivery
- Frontend modular: core, auth, ui, pos, agents, router
- Matriz SEO dinámica, sitemap, robots.txt
- Flujo Delivery de 3 pasos (Listo → En Camino → Entregado)
- OTP con privacidad por rol
- POS con catálogo, carrito, checkout Express
- Gallery Slider, Sub-Pages Engine, Shortlinks

### v5.x–v4.x — Base del sistema
- Suit BI Matrix (KPIs dinámicos desde Excel)
- Fábrica de Negocios (misión, visión, valores auto-generados)
- Catálogo CRUD con IDs secuenciales PROD-XX
- RBAC granular, auto-logoff por inactividad
- Checkout Express con cargo por envío dinámico
- Módulo de Atención al Cliente (CRM Quejas)
