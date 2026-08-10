# AGENTS.md — SuitOrg Ecosystem Rules

## Architecture
- **Frontend**: HTML/CSS/JS puro (sin frameworks). v16.7.28
- **Backend**: Google Apps Script (GAS) modular en `backend/`. v15.9.9
- **DB**: Híbrida — Google Sheets (primaria) + Supabase (en migración)
- **CampanasAi**: Sub-proyecto CMS bajo `CampanasAi/`, servido en puerto 8000

## Inmutable Rules (no romper)

### Multi-Tenant Isolation
1. Toda query debe filtrar por `id_empresa`. Ningún negocio ve datos de otro.
2. Tablas globales (`Config_Empresas`, `Config_Roles`, `Config_SEO`, etc.) son solo lectura para inquilinos.
3. Tablas privadas (`Leads`, `Proyectos`, `Catalogo`) se filtran estrictamente por `id_empresa`.

### Backend (GAS)
4. Backend dual: `backend/core.js` (orquestador maestro) y `CampanasAi/backend.gs` (CMS simple).
5. Usar `LockService` para operaciones concurrentes (timeout 30s).
6. No borrado físico — usar columna `activo` (TRUE/FALSE).
7. IDs secuenciales: `LEAD-XXX`, `ORD-XXX`, `PROD-XX`. No UUIDs aleatorios.
8. Token de seguridad requerido en todo POST al backend.

### Server (Node.js Express)
9. `server.js` en raíz (puerto 3001) sirve el frontend multi-inquilino.
10. `CampanasAi/local-server-node.js` (puerto 8000) sirve el CMS.
11. Helmet activo con CSP estricta para seguridad.
12. Endpoints protegidos: `/api/db/*` usa service_role key (bypass RLS), solo llamadas internas.

### Frontend
13. Archivos clave: `index.html` (SPA), `app.js` (orquestador), `js/modules/*` (módulos).
14. Navegación por hash (`#orbit`, `#pos`, `#home`, etc.).
15. Roles RBAC: DIOS (999), ADMIN (10), STAFF (5), DELIVERY.
16. Inactividad: visitantes 5min → reset a Orbit. Staff con crédito DIARIO/GLOBAL → 8h, otros → 120s.

### Drive & Assets
17. Logo: Google Picker API (configurado con API Key y Client ID) con fallback a URL manual.
18. Fotos carrusel: subida local secuencial por slide (solo modos BD y BDPR).

### CampanasAi (sub-proyecto)
19. 3 modos: Ai (IA genera), BD (base datos + IA), BDPR (base datos + manual).
20. Prompts de IA hardcodeados en `script.js:449-486` (no vienen de DB aún).
21. Guardado a hoja `SMMC` en Google Sheets ID `1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8`.

### Seguridad
22. `.env` contiene secrets (API keys, tokens). No exponer en código ni commits.
23. Helmet CSP bloquea recursos no autorizados. Agregar dominios a `connect-src` y `img-src` si se integran nuevos servicios.
