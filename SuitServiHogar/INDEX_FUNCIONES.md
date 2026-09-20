# Índice de Funciones — SuitServiHogar
**Generado:** 2026-09-15 | **Stack:** React 19 + Vite + TypeScript + Tailwind v4

> **Uso:** Antes de leer un archivo completo, busca aquí la función/componente que necesitas
> y lee solo esa línea+rango. Esto ahorra ~80% de tokens por sesión.

---

## `src/types.ts`
| Línea | Export | Descripción |
|-------|--------|-------------|
| 1 | `Currency` | `'MXN' \| 'USD'` |
| 3 | `ScreenId` | `'inicio' \| 'explorar' \| 'escrow' \| 'perfil' \| 'solicitud' \| 'tecnico'` |
| 5 | `Technician` | Interface completa del técnico (ratings, pricing, stripeAccountId) |
| 28 | `ServiceCategory` | Interface de categoría (name, icon, base price) |
| 38 | `EscrowOrder` | Interface de orden escrow (status machine, pricing, evidence) |

## `src/lib/`
| Archivo | Línea | Export | Descripción |
|---------|-------|--------|-------------|
| `constants.ts` | 1 | `COLONIAS_REYNOSA` | 12 colonias de Reynosa (readonly tuple) |
| `constants.ts` | 16 | `EXCHANGE_RATE_MXN_USD` | `18.0` — tipo de cambio fijo |
| `supabase.ts` | 12 | `supabase` | Cliente Supabase singleton |
| `stripe.ts` | 9 | `stripePromise` | Stripe.js load promise |

## `src/services/authService.ts`
| Línea | Función | Descripción |
|-------|---------|-------------|
| 3 | `signInWithGoogle()` | OAuth login via Supabase |
| 14 | `signOut()` | Cierra sesión |
| 19 | `getCurrentUser()` | Retorna usuario actual |
| 24 | `getSession()` | Retorna sesión Supabase |
| 29 | `getTechnicianByEmail(email)` | Busca técnico por email en `sh_technicians` |

## `src/services/categoryService.ts`
| Línea | Función | Descripción |
|-------|---------|-------------|
| 26 | `fetchCategories()` | Trae todas las categorías |
| 36 | `fetchCategoryById(id)` | Trae una categoría por ID |

## `src/services/technicianService.ts`
| Línea | Función | Descripción |
|-------|---------|-------------|
| 52 | `fetchTechnicians(colonia?)` | Técnicos activos, filtro opcional por colonia |
| 68 | `fetchTechnicianById(id)` | Técnico por ID |
| 79 | `fetchTechniciansByCategory(catId, colonia?)` | Técnicos por categoría + colonia |
| 96 | `saveStripeAccountId(techId, stripeId)` | Guarda Stripe Connect account ID |

## `src/services/bookingService.ts`
| Línea | Función | Descripción |
|-------|---------|-------------|
| 46 | `createOrder(techId, title, desc, clientId, zone)` | Crea orden draft en `sh_orders` |
| 94 | `fetchOrdersByClient(clientId)` | Órdenes del cliente (join técnico) |
| 119 | `updateOrderStatus(orderId, status)` | Avanza status en la máquina |
| 131 | `addEvidencePhoto(orderId, photoUrl)` | Agrega foto al array evidence_photos |
| 149 | `uploadEvidencePhoto(file, orderId)` | Sube archivo a `sh-evidence` bucket y linka a orden |
| 168 | `processClientCancellation(orderId, clientId)` | RPC cancelación cliente |
| 182 | `processSpecialistCancellation(orderId, techId)` | RPC cancelación técnico |
| 196 | `fetchOrdersByTechnician(techId)` | Órdenes del técnico (join técnico) |

## `src/hooks/useStripePayment.ts`
| Línea | Hook | Descripción |
|-------|------|-------------|
| 14 | `useStripePayment()` | `createPaymentIntent` + `confirmPayment` + `processing` state |

## `src/components/`
| Archivo | Línea | Componente | Descripción |
|---------|-------|------------|-------------|
| `StripeCardInput.tsx` | 19 | `StripeCardInput` | Wrapper CardElement con estilos |
| `Header.tsx` | 16 | `Header` | Top bar: colonia, currency toggle, share, avatar |
| `BottomNav.tsx` | 9 | `BottomNav` | Nav inferior: 4 tabs |

## `src/components/screens/`
| Archivo | Línea | Componente | Descripción |
|---------|-------|------------|-------------|
| `HomeScreen.tsx` | 12 | `HomeScreen` | Landing + hero + categorías + CTA |
| `ExploreScreen.tsx` | 16 | `ExploreScreen` | Buscador de técnicos + filtros |
| `LoginScreen.tsx` | 8 | `LoginScreen` | Google OAuth + guest continue |
| `BookingEscrowScreen.tsx` | 18 | `BookingEscrowScreen` | Booking completo: fecha, precio, Stripe, pay |
| `SettlementEscrowScreen.tsx` | 34 | `SettlementEscrowScreen` | Recibo post-pago con breakdown SAT |
| `ProPortalScreen.tsx` | 12 | `ProPortalScreen` | Portal Aliados Pro (perfil técnico) |
| `TechnicianOrdersScreen.tsx` | 24 | `TechnicianOrdersScreen` | Órdenes: tabs Activas/Historial, acciones, PIN |

## `src/components/modals/`
| Archivo | Línea | Componente | Descripción |
|---------|-------|------------|-------------|
| `TechnicianProfileModal.tsx` | 10 | `TechnicianProfileModal` | Bottom-sheet perfil técnico |
| `ColoniaSelectorModal.tsx` | 10 | `ColoniaSelectorModal` | Selector de colonia buscable |
| `ScheduleVisitModal.tsx` | 8 | `ScheduleVisitModal` | Form para agendar visita de auditoría |
| `PaymentSuccessModal.tsx` | 10 | `PaymentSuccessModal` | Confirmación post-pago |
| `RulesModal.tsx` | 7 | `RulesModal` | Reglas del Protocolo Antifuga |

## `src/App.tsx`
| Línea | Export | Descripción |
|-------|--------|-------------|
| 26 | `App` (default) | Root: auth, data loading, screen routing, payment handler, modals |

## `server.js` (Express, port 3010)
| Línea | Ruta | Descripción |
|-------|------|-------------|
| 17 | `POST /api/create-connect-account` | Cuenta Stripe Connect Express para técnico |
| 54 | `POST /api/create-payment-intent` | PaymentIntent con split 15/85 |
| 94 | `POST /api/webhook` | Webhook `payment_intent.succeeded` |

---
> **Auto-generado** — Ejecuta `node scripts/generate-index.js` para actualizar.
