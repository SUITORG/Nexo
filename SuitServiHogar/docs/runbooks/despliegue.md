# Runbook — Despliegue

> Última revisión: 2026-10-07 · Fuente: `docs/13-despliegue-y-operacion.md`, `.github/workflows/ci.yml`, `server.js`

## Entornos reales

| Entorno | Qué | Dónde | Estado |
|---|---|---|---|
| **Laptop (dev)** | Vite 3000 + API 3010 + Supabase remoto | esta máquina | `ACTUAL` |
| CI | lint + tsc + vitest + Playwright | GitHub Actions | `ACTIVO` |
| Producción frontend | `dist/` → GitHub Pages | push a `main` | `ACTIVO` (CI) |
| Producción backend | `server.js` | **[PENDIENTE] sin host** | no existe aún |

## 1. Backend en laptop

```bash
cp .env.example .env      # una vez: Supabase, Stripe, OpenRouter
npm install
npx tsx server.js         # → http://localhost:3010
```

**Healthcheck** (endpoint público, sin auth):

```bash
curl http://localhost:3010/api/config/category/platform
# esperado: {"success":true,"configs":[...]}
```

Variables mínimas (`server.js`): `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (o `VITE_SUPABASE_URL`), `OPENROUTER_API_KEY` (opcional — sin ella `/api/ai/analyze` devuelve 503), `STRIPE_PORT` (default 3010).

⚠️ `dotenv.config({ override: true })` — una variable stale del entorno Windows puede ganar sobre `.env` (ver `server.js:5`).

### Webhook de Stripe (necesita URL pública)

En laptop, Stripe no alcanza `localhost`. Opciones:

```bash
# túnel (ejemplo con cloudflared/ngrok) → exponer 3010
ngrok http 3010
# en Stripe → Developers → Webhooks → endpoint:
#   https://<tunel>/api/webhook   (eventos: payment_intent.*)
```

Con Stripe CLI (solo eventos de test, sin túnel):

```bash
stripe listen --forward-to localhost:3010/api/webhook
```

Luego: Stripe Dashboard → Webhooks → añadir el endpoint público con los mismos eventos.

## 2. Frontend (CI → GitHub Pages)

- `git push origin main` → workflow `ci.yml` → jobs: lint/typecheck → unit → e2e → **deploy-production** (solo si los 3 pasan).
- Los e2e en CI requieren secrets de GitHub: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`. Si faltan, el job falla y **no despliega**.
- Preview en PR (`deploy-preview`) es un placeholder — no hace nada.

```bash
npm run lint && npm test     # antes de push
git push origin main
```

## 3. Producción backend — [PENDIENTE]

No hay host definido (todo corre en laptop, 2026-10-07). Cuando exista:

1. Definir host + dominio y variable `APP_URL` (la CORS de `server.js` en prod usa `APP_URL`).
2. Variables de entorno en el host (mismas que `.env`, `NODE_ENV=production` — apaga los endpoints dev).
3. Healthcheck post-deploy: `curl https://<host>/api/config/category/platform`.
4. Webhook de Stripe → URL definitiva en Dashboard.
5. Actualizar este runbook con el host real.

## Checklist pre-despliegue

- [ ] `npm run lint` + `npm test` en verde
- [ ] `.env` al día (vars nuevas documentadas en `.env.example`)
- [ ] `node --check server.js` si cambió el backend
- [ ] Healthcheck responde
- [ ] (prod) webhook apunta a la URL correcta

## Checklist post-despliegue

- [ ] Healthcheck 200 con `{"success":true}`
- [ ] Frontend carga en Pages
- [ ] Flujo test card `4242…` completo (reserva → PIN)
- [ ] Logs sin errores nuevos → si falla: `rollback.md`
