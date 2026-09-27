## Evaluación Técnica: SuitServiHogar

### Puntuación: 6/10

### Stack Propuesto
- Frontend: React 19 + Vite + TypeScript + Tailwind v4 (etiquetado como "vanilla, no frameworks" en la propuesta — **inconsistente**)
- Backend: Express.js (puerto 3010) + GAS (Google Apps Script) + Supabase Functions
- DB: Supabase (PostgreSQL 15+) con RLS + Realtime + Storage
- Auth: Google OAuth via Supabase
- Pagos: Stripe Connect (Express accounts)
- Maps: Google Maps API (GPS + ofuscación 150-250m)
- Exchange: Fixer.io API (tipo de cambio real MXN/USD)

**Nota:** El stack contradice la regla inmutable #7 de SuitOrg ("No frontend frameworks — vanilla JS only"). React 19 **es** un framework. La etiqueta "vanilla" es incorrecta.

---

### Complejidad Estimada
- Archivos a crear/modificar: ~200+ (src/lib, src/services, src/hooks, src/components/screens (7), src/components/modals (5), App.tsx, server.js, schema.sql + 8 migraciones)
- Horas estimadas: 400-600h (MVP completo con 41 requisitos, tests, CI/CD, PWA, docs)
- Dependencias externas: Stripe Connect, Supabase, Google Maps API, Fixer.io, Google OAuth
- **Nota:** Proyecto ya implementado (41/41 requisitos, tests passing, CI/CD verde). La complejidad real ya fue absorbida; evaluación es sobre *mantenimiento futuro* y *migración a SuitOrg*.

---

### Integración con SuitOrg
- **Compatibilidad con arquitectura actual:** **Baja**. Arquitectura híbrida propia (React + Supabase RLS + Express + GAS) vs. arquitectura SuitOrg (vanilla JS SPA hash-routing + GAS CRUD Sheets + Node.js proxy Supabase + dual backend).
- **Archivos afectados para integración:**
  - `server.js` (puerto 3010) → montar en `server.js` principal (puerto 3001) o registrar en `projects.yaml`
  - Auth flow → adaptar a RBAC SuitOrg (DIOS/ADMIN/STAFF/DELIVERY)
  - DB → migrar de RLS Supabase a `id_empresa` filtering + GAS Sheets MASTER tables
  - Frontend → reescribir de React+TSX a vanilla JS + hash routing (`#servihogar`)
- **Conflicto con módulos existentes:** Puerto 3010 no registrado en `.suit/registry/projects.yaml` (puertos 3001-3013 ocupados). Stripe webhook en Express requiere orden antes de `express.json()` (regla conocida AGENTS.md línea 13).
- **Nota:** Integración nativa requeriría reescritura casi total del frontend y adaptación del backend al patrón dual GAS/Node de SuitOrg.

---

### Mantenimiento
- **Facilidad de mantenimiento:** **Media-Alta** (docs completos, tests unitarios+E2E, CI/CD, types TypeScript).
- **Deuda técnica potencial:**
  1. **Stack divergence**: React vs. vanilla JS SuitOrg — dos paradigmas conviviendo.
  2. **RLS vs. id_empresa**: Doble aislamiento (RLS + id_empresa) = complejidad y riesgo de inconsistencia.
  3. **Puerto 3010**: No registrado en registry; conflicto si se añade otro módulo en 3010.
  4. **GAS usage**: Propuesta dice GAS para CRUD Sheets pero arquitectura real usa Supabase directo + Express; GAS parece residual.
  5. **Hardcoded rate 18.0** en `src/lib/constants.ts` — debería venir de `Config_SEO` o Fixer.io dinámico.
- **Nota:** Código actual limpio y probado, pero *fuera* de convenciones SuitOrg. Migrar costará más que mantener aparte.

---

### Escalabilidad
- **Multi-tenant:** **Parcial**. Propuesta dice "Single-tenant por empresa (Reynosa), aislamiento por id_empresa en todas las queries, RLS en todas las tablas". En la práctica: RLS de Supabase hace el aislamiento, no `id_empresa` en queries (patrón SuitOrg). No hay `Config_Empresas` ni gating por `usa_servihogar`.
- **Rendimiento bajo carga:** Supabase Realtime + RLS escala bien para miles de usuarios concurrentes; Stripe Connect webhook en Express (single-threaded) puede ser bottleneck sin queue.
- **Nota:** Diseñado para single-tenant Reynosa. Multi-tenant real requeriría: tabla `Config_Empresas` con flag `usa_servihogar`, gating en frontend (`#servihogar` solo si flag activo), y reescritura de queries a `id_empresa` filter (no RLS).

---

### Checklist SuitOrg
- [ ] Vanilla JS (no frameworks frontend) — **NO** (React 19)
- [ ] Multi-tenant con `id_empresa` en todas las queries — **PARCIAL** (RLS, no id_empresa filter)
- [ ] Soft delete (`activo = FALSE`) — **SÍ** (mencionado en convenciones)
- [ ] IDs secuenciales (no UUIDs) — **PENDIENTE** (no verificado en schema.sql; Supabase usa UUID por defecto)
- [ ] GAS backend para CRUD en Sheets, Node.js para Supabase — **PARCIAL** (GAS mencionado pero arquitectura real es Supabase+Express)
- [ ] Puerto único no registrado en `projects.yaml` — **NO** (3010 no está en registry)
- [ ] `API_AUTH_TOKEN` en todos los POST a GAS — **NO VERIFICABLE** (GAS usage unclear)

**Cumplimiento: 1.5/6 reglas**

---

### Fortalezas
1. MVP completo y probado (41/41 requisitos, tests, CI/CD, PWA, docs exhaustivas).
2. Modelo de negocio claro: escrow Stripe Connect (15/85 split), volume discounts, donations.
3. Deep-Vetting técnico (INE + biometría + domicilio) + PIN conformidad antifuga — diferenciador fuerte.
4. Tabulador bimonetario MXN/USD con tipo de cambio real (Fixer.io).
5. Chat restringido a evidencia (fotos) — reduce fuga de plataforma.
6. Certificación "Técnico Certificado de Confianza" (10 servicios 5★ consecutivos) — gamificación de calidad.

---

### Riesgos técnicos
1. **Stack divergence crítico**: React 19 vs. vanilla JS SuitOrg — dos bases de código, dos paradigmas, doble mantenimiento.
2. **RLS vs. id_empresa**: Aislamiento dual confuso; riesgo de queries sin `id_empresa` si se migra a patrón SuitOrg.
3. **Puerto 3010 sin registrar**: Conflicto potencial en `projects.yaml`; no hay gate de frontend documentado.
4. **GAS role ambiguo**: Propuesta dice GAS para CRUD Sheets, pero implementación usa Supabase directo. ¿Dual-write? ¿Sync? No definido.
5. **IDs secuenciales**: Supabase/PostgreSQL usa UUID; requeriría lógica custom para `SERV-XXX`, `TEC-XXX`, `ORD-XXX`.
6. **Stripe webhook ordering**: `server.js` Express debe registrar webhook ANTES de `express.json()` (regla AGENTS.md).
7. **Hardcoded exchange rate**: `rate 18.0` en constants — single point of failure para precios bimonetarios.
8. **Single-tenant hardcoded**: "Reynosa" en código; multi-tenant real requiere refactor profundo.

---

### Recomendación
- **CONDICIONAL**
- **Condición**: Reescritura del frontend a vanilla JS SPA (hash routing `#servihogar`), migración de RLS a `id_empresa` filtering + GAS MASTER tables, registro en `.suit/registry/projects.yaml` con puerto 3010 (o 3014 si se reserva), gate `usa_servihogar` en `Config_Empresas`, y ADR documentando la decisión. Alternativa: operar como submódulo independiente (micro-frontend) montado en `#servihogar` vía iframe/ES module, manteniendo React internamente pero aislado del core SuitOrg — requiere ADR de excepción arquitectónica.