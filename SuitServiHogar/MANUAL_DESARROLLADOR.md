# MANUAL DESARROLLADOR — Modo Test/Dev SuitServiHogar

> **Versión:** 1.0  
> **Fecha:** 2026-09-15  
> **Propósito:** Probar flujo completo E2E sin dependencias externas (Stripe real, Google OAuth, Supabase prod)

---

## 1. QUÉ ES EL MODO DESARROLLADOR

Un **feature flag** que activa mocks y datos de prueba para ejecutar el flujo completo:

```
Cliente → Explorar → Escrow → Pago (mock) → Técnico → En ruta → Completado → PIN → Liberado → Reseña → Referido
```

**Sin necesidad de:**
- Cuenta Stripe real ni webhooks
- Google OAuth real
- Base de datos Supabase de producción
- Tarjetas de crédito reales

---

## 2. ACTIVACIÓN RÁPIDA

### Opción A: Variable de entorno (recomendada)

```bash
# .env.local (no commitear)
VITE_DEV_MODE=true
VITE_DEV_AUTO_LOGIN=technician  # o 'client', 'admin'
VITE_DEV_SEED_DATA=true
```

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (con mocks)
VITE_DEV_MODE=true node server.js
```

### Opción B: localStorage (runtime, sin reiniciar)

```javascript
// En consola del navegador (F12)
localStorage.setItem('devMode', 'true');
localStorage.setItem('devAutoLogin', 'technician'); // 'client' | 'technician' | 'admin'
localStorage.setItem('devSeedData', 'true');
location.reload();
```

### Opción C: URL param (para compartir)

```
http://localhost:3000/?devMode=true&autoLogin=technician&seedData=true
```

---

## 3. QUÉ ACTIVA CADA FLAG

| Flag | Qué hace |
|---|---|
| `devMode=true` | Activa todos los mocks: Stripe, Supabase auth, exchange rate |
| `devAutoLogin=technician` | Auto-login como técnico (roberto@servihogar.mx) |
| `devAutoLogin=client` | Auto-login como cliente (guest) |
| `devAutoLogin=admin` | Auto-login como admin (acceso a `/admin`) |
| `devSeedData=true` | Precarga: 5 técnicos, 3 órdenes en distintos estados, 2 referidos, 3 cupones |
| `devMockStripe=true` | PaymentIntent siempre exitoso, webhook automático |
| `devMockExchangeRate=true` | Tipo de cambio fijo 18.0, sin llamadas a Fixer.io |

---

## 4. FLUJO DE PRUEBA COMPLETO (5 min)

### Paso 1: Iniciar en modo dev
```bash
# Terminal 1
VITE_DEV_MODE=true VITE_DEV_AUTO_LOGIN=client VITE_DEV_SEED_DATA=true npm run dev

# Terminal 2
VITE_DEV_MODE=true node server.js
```

### Paso 2: Flujo Cliente (automático si `devAutoLogin=client`)
1. App carga → **Explorar** → ve 5 técnicos con datos reales
2. Click **"Solicitar"** en primer técnico
3. Pantalla **Escrow** → completa dirección (calle + número)
3. Click **"Usar mi GPS"** → mock devuelve coords ofuscadas
4. Sección **Cupón** → escribe `REF-TECH-TEST123` → **Aplicar** → ve descuento $150
5. **Stripe Card Input** → usa tarjeta test `4242 4242 4242 4242` / `12/28` / `123` / `88720`
6. Click **"Pagar $XXX MXN"** → **mock devuelve éxito instantáneo**
7. Ve **PaymentSuccessModal** → click **"Ver Mis Órdenes"**

### Paso 3: Flujo Técnico (cambia `devAutoLogin=technician` y recarga)
1. App carga → **Perfil Técnico** → ve "Panel de Administración" (si admin)
2. Click **"Ver Mis Órdenes"** → pestaña **Activas** → ve la orden del cliente
3. Click **"Iniciar ruta"** → confirma → estado → **En ruta**
4. Click **"Marcar completado"** → sube foto evidencia (mock) → **Completado**
5. Click **"Finalizar (PIN)"** → ingresa `1234` → **Liberar fondos**
6. Ve **PaymentSuccessModal** → click **"Dejar reseña"**

### Paso 4: Reseña + Referido
1. **ReviewScreen** → 5 estrellas + "Excelente servicio" → **Enviar**
2. Ve **ReferralScreen** → comparte código `REF-TECH-ABC123`
3. Como cliente nuevo (`devAutoLogin=client` en pestaña incógnito) → usa cupón → **$100 descuento**

### Paso 5: Admin (si `devAutoLogin=admin`)
1. Navega a `/admin` → **Dashboard** ve métricas
2. Pestaña **Técnicos** → suspende/activa
3. Pestaña **Disputas** → ve órdenes canceladas
4. Pestaña **Insights** → "Tus trabajos de pintura tardan 18% más"

---

## 5. ARQUITECTURA DEL MODO DEV

### Frontend (`src/config/devMode.ts`)
```typescript
export const isDevMode = () => 
  import.meta.env.VITE_DEV_MODE === 'true' || 
  localStorage.getItem('devMode') === 'true' ||
  new URLSearchParams(window.location.search).get('devMode') === 'true';

export const getDevConfig = () => ({
  autoLogin: import.meta.env.VITE_DEV_AUTO_LOGIN || 
             localStorage.getItem('devAutoLogin') ||
             new URLSearchParams(window.location.search).get('autoLogin'),
  seedData: import.meta.env.VITE_DEV_SEED_DATA === 'true' || 
            localStorage.getItem('devSeedData') === 'true',
  mockStripe: import.meta.env.VITE_DEV_MOCK_STRIPE === 'true',
  mockExchangeRate: import.meta.env.VITE_DEV_MOCK_EXCHANGE_RATE === 'true',
});
```

### Backend (`server.js` - bloques condicionales)
```javascript
const DEV_MODE = process.env.VITE_DEV_MODE === 'true';

if (DEV_MODE) {
  // Mock Stripe: PaymentIntent siempre成功
  app.post('/api/create-payment-intent', (req, res) => {
    return res.json({ 
      clientSecret: 'pi_dev_mock_secret', 
      couponDiscount: 0, 
      commissionPct: 15 
    });
  });

  // Mock webhook: auto-confirma pago
  app.post('/api/dev/confirm-payment', (req, res) => {
    updateOrderStatus(req.body.orderId, 'funded');
    res.json({ success: true });
  });

  // Seed data endpoint
  app.post('/api/dev/seed', async (req, res) => {
    await seedTestData(); // 5 techs, 3 orders, referrals, coupons
    res.json({ success: true });
  });
}
```

### Auto-login (`src/hooks/useDevAuth.ts`)
```typescript
export function useDevAuth() {
  const config = getDevConfig();
  
  useEffect(() => {
    if (!config.autoLogin) return;
    
    const mockUsers = {
      technician: { 
        id: 'tech-1', 
        email: 'roberto@servihogar.mx', 
        role: 'technician',
        user_metadata: { name: 'Roberto Pérez' }
      },
      client: { 
        id: 'client-1', 
        email: 'guest@dev.local', 
        role: 'client',
        user_metadata: { name: 'Cliente Demo' }
      },
      admin: { 
        id: 'admin-1', 
        email: 'admin@servihogar.mx', 
        role: 'admin',
        user_metadata: { name: 'Admin Demo' }
      },
    };
    
    // Simula onAuthStateChange
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user);
        if (session.user.role === 'technician') fetchTechnician();
      }
    });
    
    // Mock signIn
    supabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({ 
      data: { user: mockUsers[config.autoLogin] }, 
      error: null 
    });
  }, [config.autoLogin]);
}
```

---

## 6. DATOS DE PRUEBA (SEED)

Ejecutar manualmente si no usas `devSeedData`:
```bash
curl -X POST http://localhost:3010/api/dev/seed
```

**Crea:**
| Entidad | Cantidad | Detalle |
|---|---|---|
| Técnicos | 5 | Roberto, Carlos, Héctor, Juan, María (con `stripe_account_id` mock) |
| Órdenes | 3 | 1 `funded`, 1 `in_progress`, 1 `completed` |
| Referidos | 2 | 1 tech ($150), 1 client ($100 cupón) |
| Cupones | 3 | `REF-TECH-TEST123` ($150), `REF-CLIENT-TEST456` ($100), `REF-TECH-EXPIRED` (expirado) |
| Reseñas | 2 | 5★ y 4★ en técnicos distintos |
| Mensajes | 5 | Chat entre cliente-técnico con fotos |

---

## 7. COMANDOS ÚTILES PARA DESARROLLO

```bash
# Inicio rápido modo dev completo
VITE_DEV_MODE=true VITE_DEV_AUTO_LOGIN=technician VITE_DEV_SEED_DATA=true npm run dev

# Solo frontend con auto-login cliente
VITE_DEV_MODE=true VITE_DEV_AUTO_LOGIN=client npm run dev

# Backend con mocks
VITE_DEV_MODE=true node server.js

# Ejecutar seed manual
curl -X POST http://localhost:3010/api/dev/seed

# Confirmar pago mock (desde frontend dev tools)
fetch('/api/dev/confirm-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: 'ORD-001' })
})

# Limpiar modo dev (runtime)
localStorage.removeItem('devMode');
localStorage.removeItem('devAutoLogin');
localStorage.removeItem('devSeedData');
location.reload();

# Ver estado dev actual
console.log({
  devMode: localStorage.getItem('devMode'),
  autoLogin: localStorage.getItem('devAutoLogin'),
  seedData: localStorage.getItem('devSeedData'),
});
```

---

## 7. TESTING AUTOMATIZADO CON MODO DEV

### E2E Tests (Playwright) - modo headless
```typescript
// tests/e2e/full-flow.dev.test.ts
test.describe('Full Flow Dev Mode', () => {
  test.use({ 
    baseURL: 'http://localhost:3000/?devMode=true&autoLogin=client&seedData=true' 
  });

  test('flujo completo cliente → técnico → reseña', async ({ page }) => {
    // 1. Cliente crea orden
    await page.goto('/explorar');
    await page.click('[data-testid="technician-card"]:first-child button:has-text("Solicitar")');
    await expect(page).toHaveURL(/.*escrow/);
    
    // 2. Dirección + GPS mock
    await page.fill('input[placeholder*="Calle"]', 'Av. Test');
    await page.fill('input[placeholder*="Número"]', '123');
    await page.click('button:has-text("Usar mi GPS")');
    await expect(page.locator('text=Blindaje 150-250m')).toBeVisible();
    
    // 3. Pago mock
    await page.fill('input[placeholder="Código de cupón"]', 'REF-TECH-TEST123');
    await page.click('button:has-text("Aplicar")');
    await expect(page.locator('text=-$150.00 MXN')).toBeVisible();
    
    // Stripe test card
    await page.fill('input[name="cardnumber"]', '4242 4242 4242 4242');
    await page.fill('input[name="exp-date"]', '12/28');
    await page.fill('input[name="cvc"]', '123');
    await page.fill('input[name="postal"]', '88720');
    await page.click('button:has-text("Pagar")');
    
    // 4. Verifica éxito
    await expect(page.locator('text=Pago exitoso')).toBeVisible({ timeout: 10000 });
    
    // 5. Cambia a técnico (nueva pestaña)
    const techPage = await page.context().newPage();
    await techPage.goto('/?devMode=true&autoLogin=technician&seedData=true');
    await techPage.click('text=Ver Mis Órdenes');
    await techPage.click('[data-testid="order-card"]:first-child button:has-text("Iniciar ruta")');
    await techPage.click('button:has-text("Confirmar")');
    await expect(techPage.locator('text=En ruta')).toBeVisible();
    
    // 6. Completar + PIN
    await techPage.click('button:has-text("Marcar completado")');
    await techPage.setInputFiles('input[type="file"]', 'tests/fixtures/evidence.jpg');
    await techPage.click('button:has-text("Subir y completar")');
    await techPage.click('button:has-text("Finalizar (PIN)")');
    await techPage.fill('input[placeholder="PIN"]', '1234');
    await techPage.click('button:has-text("Liberar fondos")');
    await expect(techPage.locator('text=Fondos liberados')).toBeVisible();
  });
});
```

**Ejecutar:**
```bash
# Terminal 1: dev servers
VITE_DEV_MODE=true VITE_DEV_SEED_DATA=true npm run dev &
VITE_DEV_MODE=true node server.js &

# Terminal 2: tests
npm run test:e2e -- tests/e2e/full-flow.dev.test.ts
```

---

## 8. TROUBLESHOOTING MODO DEV

| Problema | Solución |
|---|---|
| `devMode` no activa | Verifica `localStorage.getItem('devMode') === 'true'` en consola |
| Auto-login no funciona | Revisa `localStorage.getItem('devAutoLogin')` y recarga |
| Seed no carga | Ejecuta `curl -X POST http://localhost:3010/api/dev/seed` manualmente |
| Stripe mock falla | Verifica `VITE_DEV_MOCK_STRIPE=true` en backend |
| Tipo de cambio no mock | `VITE_DEV_MOCK_EXCHANGE_RATE=true` |
| Datos persisten entre tests | `localStorage.clear()` + `supabase.from('sh_orders').delete()` |

---

## 9. DESACTIVAR MODO DEV (PRODUCCIÓN)

```bash
# 1. Quita variables .env
# VITE_DEV_MODE=true  ← ELIMINAR o false

# 2. Limpia localStorage usuarios
localStorage.clear();

# 3. Verifica build producción
npm run build
# Ningún console.log de "DEV MODE" en dist/

# 4. Variables producción reales
VITE_DEV_MODE=false
STRIPE_WEBHOOK_SECRET=whsec_prod_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 10. CHECKLIST MODO DEV

| Item | ✅ |
|---|---|
| `VITE_DEV_MODE=true` en .env.local | |
| `devAutoLogin` configurado (technician/client/admin) | |
| `devSeedData=true` para datos listos | |
| Backend inicia con `VITE_DEV_MODE=true` | |
| Seed data carga (5 techs, 3 orders) | |
| Flujo cliente completo funciona (mock pago) | |
| Flujo técnico completo funciona (ruta → PIN) | |
| Reseña + referido funcionan | |
| Admin panel accesible (`autoLogin=admin`) | |
| E2E tests pasan en modo dev | |
| **Producción: `VITE_DEV_MODE=false`** | |

---

**Fin del Manual Desarrollador v1.0**

> **Tip:** Guarda este archivo en `MANUAL_DESARROLLADOR.md` y compártelo con el equipo. El modo dev ahorra ~30 min por ciclo de prueba E2E.