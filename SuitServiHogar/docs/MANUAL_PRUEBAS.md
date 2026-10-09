# MANUAL DE PRUEBAS — SuitServiHogar (Modo Test/Dev)

> **Para qué sirve este manual:** explica el modo test/dev del proyecto: cómo correr el flujo completo E2E con mocks, sin depender de servicios reales (Stripe real, Google OAuth, Supabase prod).
> **Audiencia:** desarrollador del proyecto que valida cambios antes de subirlos.

> **Versión:** 1.2  
> **Fecha:** 2026-09-15 (migrado a estándar Guía Total 2026-09-26 · actualizado 2026-10-07 con `qa.bat`, candado PROD y e2e `flujo-dev` · 2026-10-08 con login teléfono+contraseña y e2e `login-telefono`)  
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

### Opción 0 (recomendada): `qa.bat` — un solo comando, 3 ventanas con roles

```bash
qa.bat
```

- Mata instancias previas en 3000/3010, levanta backend (3010) y frontend (3000)
  cada uno en su propia ventana con banner y hora de arranque (`*****`).
- Abre 3 ventanas del navegador, una por rol, con el rol por URL param
  (gana sobre localStorage): `?devMode=true&devMockStripe=true&devMockExchangeRate=true&devAutoLogin=client|technician|admin`.
- En cada ventana se ve el badge **MODO PRUEBA** (esquina superior derecha).

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
http://localhost:3000/?devMode=true&devAutoLogin=technician&devMockStripe=true&devMockExchangeRate=true
```

**Precedencia** (`src/config/devMode.ts`): env `VITE_*` → URL param → `localStorage`.
El nombre correcto del param es `devAutoLogin` (no `autoLogin`).

---

## 3. QUÉ ACTIVA CADA FLAG

| Flag | Qué hace |
|---|---|
| `devMode=true` | Activa todos los mocks: Stripe, Supabase auth, exchange rate |
| `devAutoLogin=technician` | Auto-login como técnico (roberto@servihogar.mx) |
| `devAutoLogin=client` | Auto-login como cliente (guest) |
| `devAutoLogin=admin` | Auto-login como admin (ve el botón "Panel de Administración") |
| `devSlot=1|2|3` | Qué credencial de las 3 del rol usa el auto-login (default `1`) |
| `devSeedData=true` | Precarga: 5 técnicos, 3 órdenes en distintos estados, 2 referidos, 3 cupones |
| `devMockStripe=true` | Pago mock en frontend (`useStripePayment`): sin llamada a `/api/create-payment-intent` ni a la API de Stripe (Stripe.js solo carga el Card Element) |
| `devMockExchangeRate=true` | Tipo de cambio fijo 18.0, sin llamadas a Fixer.io (también aborta `data.fixer.io` en el e2e) |

---

## 3A. COLORES POR PERFIL

Cada perfil pinta la interfaz con una familia distinta de la **misma paleta**
(`src/index.css`, overrides en `[data-role=...]`; `App.tsx` pone `data-role` en `<html>`):

| Perfil | Color | Familia | `--color-primary` |
|---|---|---|---|
| Cliente (frontend) | Azul trust-blue | `primary` | `#00355f` |
| Proveedor/Técnico (frontend) | Verde escrow | `secondary` | `#006c4a` |
| Admin (panel de administración) | Ámbar | `tertiary` | `#4b2d00` |

- El color lo hereda todo: Header, botones, nav, enlaces… y el badge **MODO PRUEBA**.
- Detecta por **rol de la cuenta** (no por pantalla): una ventana = un color, sirve para distinguir las 3 ventanas de `qa.bat` de un vistazo.
- Cliente sin sesión / login = azul (default).
- **Insignia de perfil** (esquina superior derecha): píldora grande con icono y nombre —
  `PERSON Cliente` (azul) / `HANDYMAN Técnico` (verde) / `ADMIN_PANEL_SETTINGS Administrador` (ámbar),
  con el tag **MODO PRUEBA** debajo. Así nunca se duda en qué ventana se está.
- **Órdenes nuevas parpadean:** en *Perfil → Ver Mis Órdenes*, toda orden `Pagada (Escrow)`
  espera acción con un **anillo ámbar pulsante**. Si la lista sale vacía aparece una pista
  con el nombre del técnico QA a contratar.
- **Ojo con el cruce de roles:** cada técnico solo ve **sus** órdenes. En el loop QA el cliente
  debe contratar a **Ing. Roberto Garza** (cuenta slot 1 del proveedor); si contratas a otro
  técnico, esa orden **no** aparecerá en la ventana del técnico QA.

---

## 3B. CREDENCIALES QA — 3 POR PERFIL (9 CUENTAS)

Cada rol tiene 3 cuentas reales (Supabase Auth). **Contraseña: la de `DEV_QA_PASSWORD`
en `SuitServiHogar/.env`** (misma para las 9; ver con `type .env | findstr DEV_QA`).
Las cuentas se crean solas en el primer login (`/api/dev/qa-login` las crea/repara).

> **Contrato Req#22:** la UI **no** tiene formulario de usuario/contraseña
> (auth de producción = Google OAuth). Se entra con estas credenciales por el
> flujo dev: la URL de "Entrada" de abajo hace auto-login con la cuenta indicada.

| # | Perfil | Email | Slot | Entrada (localhost) |
|---|---|---|---|---|
| 1 | Cliente | `cliente-qa@test.mx` | 1 | `/?devMode=true&devAutoLogin=client&devSlot=1` |
| 2 | Cliente | `cliente-qa-2@test.mx` | 2 | `/?devMode=true&devAutoLogin=client&devSlot=2` |
| 3 | Cliente | `cliente-qa-3@test.mx` | 3 | `/?devMode=true&devAutoLogin=client&devSlot=3` |
| 4 | Proveedor | `roberto@servihogar.mx` | 1 | `/?devMode=true&devAutoLogin=technician&devSlot=1` |
| 5 | Proveedor | `tecnico-qa-2@servihogar.mx` | 2 | `/?devMode=true&devAutoLogin=technician&devSlot=2` |
| 6 | Proveedor | `tecnico-qa-3@servihogar.mx` | 3 | `/?devMode=true&devAutoLogin=technician&devSlot=3` |
| 7 | Admin | `admin@servihogar.mx` | 1 | `/?devMode=true&devAutoLogin=admin&devSlot=1` |
| 8 | Admin | `admin-qa-2@servihogar.mx` | 2 | `/?devMode=true&devAutoLogin=admin&devSlot=2` |
| 9 | Admin | `admin-qa-3@servihogar.mx` | 3 | `/?devMode=true&devAutoLogin=admin&devSlot=3` |

(Rutas relativas a `http://localhost:3000`; añade `&devMockStripe=true&devMockExchangeRate=true` para flujo completo sin Stripe/Fixer reales.)

**Formas de entrar:**
1. **`qa.bat`** — abre las 3 cuentas slot 1 (cliente/proveedor/admin) en 3 ventanas.
2. **URL directa** de la tabla — cada credencial en su ventana/pestaña.
3. **Consola (F12)**: `localStorage.setItem('devMode','true'); localStorage.setItem('devAutoLogin','technician'); localStorage.setItem('devSlot','2'); location.reload();`

---

## 3C. CHAT DE NEGOCIACIÓN (órdenes ↔ chat en vivo)

**Ruta del cliente:** Perfil → "Ver Mis Órdenes" → tarjetas con estado (la pagada pulsa en ámbar) → botón **Chat**.
**Ruta del técnico:** Perfil → "Ver Mis Órdenes" → tarjeta → icono chat.

| Tema | Comportamiento esperado |
|---|---|
| Mensaje propio | Aparece al instante en tu pantalla (append local) |
| Mensaje ajeno | Llega en vivo por Supabase Realtime (`sh_messages`) |
| Si no llega en vivo | Reentrar al chat (back → chat) recarga historial por REST |
| Realtime habilitado | `alter publication supabase_realtime add table public.sh_messages;` (proyecto `egyxgnlnzanxpqyuvmsg`) — si se recrea el proyecto, repetir |

---

## 3D. NAVEGACIÓN POR PERFIL (barra inferior)

La barra inferior tiene **4 pestañas**; la 3ª cambia según el perfil logueado:

| Perfil (badge) | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Cliente (azul) | Inicio | Explorar | **Mis Órdenes** | Perfil |
| Técnico (verde) | Inicio | Explorar | **Mis Órdenes** | Perfil |
| Admin (ámbar) | Inicio | Explorar | **Panel** (→ Admin Panel) | Perfil |

- **Cliente:** Perfil muestra "Mi Cuenta" + Mis Órdenes + **Contratar servicio** (oculta la sección de alianza técnica).
- **Técnico:** solicitudes a 1 tap desde la nav; Perfil muestra "Ver Mis Órdenes" arriba.
- **Admin:** "Panel de Administración" es la **primera tarjeta** de Perfil (o la pestaña Panel en la nav) → Dashboard / Técnicos / Disputas / Config.
- La antigua pestaña "Garantía Escrow" (demo) se quitó de la nav.
- Cerrajerí­a no lista técnicos (no hay en DB) — usa Climas/Plomerí­a/Electricidad para demos.

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
1. Carga en **Perfil/Técnico** → click botón **"Panel de Administración"** → **Dashboard** ve métricas
2. Pestaña **Técnicos** → suspende/activa
3. Pestaña **Disputas** → ve órdenes canceladas
4. Pestaña **Insights** → "Tus trabajos de pintura tardan 18% más"

---

## 5. ARQUITECTURA DEL MODO DEV

### Frontend (`src/config/devMode.ts`)

```typescript
// Precedencia: env VITE_* → URL param → localStorage
function getEnv(key: string): string | undefined {
  return import.meta.env[key] ||
         new URLSearchParams(window.location.search).get(key) ||
         localStorage.getItem(key);
}

// Candado anti-producción: en build PROD fuera de localhost NUNCA hay modo prueba
export function isDevMode(): boolean {
  if (import.meta.env.PROD && !isLocalhost()) return false;
  return getEnv('VITE_DEV_MODE') === 'true' || getEnv('devMode') === 'true';
}

// getDevConfig() devuelve enabled:false + todas las flags en false si !isDevMode()
```

- Badge **MODO PRUEBA**: `src/components/DevModeBadge.tsx`, renderizado junto a
  `<DevSessions />` en `App.tsx` — solo aparece cuando `isDevMode()`.

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

### E2E Tests (Playwright) — flujo real completo

El flujo completo está automatizado en **`tests/e2e/flujo-dev.spec.ts`**
(3 contextos de navegador: cliente → técnico → admin):

1. **Cliente**: auto-login QA → Explorar → "Contratar Garantía" en Roberto Garza →
   dirección → paga con **mock** → modal "Custodia Escrow Activada" → extrae el id
   real `ORD-*` creado en BD.
2. **Técnico**: Perfil → "Ver Mis Órdenes" → localiza la orden por ref →
   "Iniciar ruta" → "Marcar completado" → "Finalizar (PIN cliente)" → PIN `8821` →
   "Liberar fondos" → verifica **"Liberado / Pagado"** en Historial.
3. **Admin**: Perfil → "Panel de Administración" → heading **"Admin Panel"**.

El login teléfono+contraseña está automatizado en **`tests/e2e/login-telefono.spec.ts`**:

1. **Registro**: sin sesión → Explorar → "Contratar Garantía" → LoginScreen →
   tab "Crear cuenta" → nombre + teléfono `55XXXXXXXX` + contraseña → verifica
   pantalla de Escrow (el registro crea la cuenta vía `POST /api/auth/register`
   y entra con la sesión nueva).
2. **Login**: segunda sesión aparte con las mismas credenciales → verifica Escrow.
3. **Error genérico**: contraseña incorrecta → alerta "Teléfono o contraseña
   incorrectos" (no filtra si la cuenta existe).

```bash
# Levanta vite:3000 + backend:3010 automáticamente (playwright.config webServer)
npm run test:e2e            # smoke (4) + flujo-dev (1) + login-telefono (2)
npm run test:e2e -- tests/e2e/flujo-dev.spec.ts   # solo el flujo completo
npm run test:e2e -- tests/e2e/login-telefono.spec.ts   # solo login teléfono
```

Notas:
- El test fuerza flags por `addInitScript` (localStorage) y aborta `data.fixer.io`,
  así que funciona aunque el server se haya levantado a mano sin `VITE_DEV_*`.
- La identidad QA se crea/garantiza en `POST /api/dev/qa-login` (incluye la fila
  `sh_technicians` con rol para técnico/admin).

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

**Candado automático:** `isDevMode()` (`devMode.ts`) devuelve `false` en cualquier
build PROD fuera de localhost — aunque queden `VITE_DEV_*` en el build o flags en
localStorage. El badge "MODO PRUEBA" tampoco se renderiza.

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

**Fin del Manual de Pruebas v1.0**

> **Tip:** Guarda este archivo en `MANUAL_PRUEBAS.md` y compártelo con el equipo. El modo dev ahorra ~30 min por ciclo de prueba E2E.