# MANUAL TÉCNICO — ContractRenew

> **Para qué sirve:** mantener, desplegar y operar ContractRenew.
> **Audiencia:** desarrollador SuitOrg.
> **Última actualización:** 2026-10-11

## Resumen en corto (tabla técnica)

| Aspecto | Qué es |
|---|---|
| **Alcance** | Carpeta `SuitContractRenew/` — módulo **independiente** (no es parte del SPA principal ni multi-tenant) |
| **Tipo** | Aplicación web **local**: un backend + una landing, en un solo proceso |
| **Frontend** | Solo la **landing** (`landing/index.html`, HTML/CSS/JS vanilla — sin frameworks) con formulario de leads |
| **Backend** | **Node.js + Express** en puerto 3017: API REST (`/api/health`, `/api/contracts`, `/api/contracts/due/:dias`, `/api/leads`) |
| **Base de datos** | **SQLite local** (`python/contractrenew.db`, WAL) — núcleo en **Python stdlib** (sin pip); Node hace spawn con `PYTHONIOENCODING=utf-8` |
| **¿Google Sheets?** | **No.** Sin `Config_Empresas`, `id_empresa: null`, sin GAS |
| **¿Supabase?** | Solo para `leads_contractrenew` (leads de la landing, insert server-side con service role) |
| **Configuración** | Local: `.env` (SUPABASE_URL + SERVICE_ROLE, gitignored); plantilla en `.env.example` |
| **Para correrlo** | `abrir.bat` (levanta + abre navegador) o `node index.js` |
| **Herramientas** | Node/Express · Python 3 (stdlib) · SQLite · Supabase (solo leads) · git · skill `bat-launcher` |

## Arquitectura
- **API:** `index.js` Express, puerto **3017** (`module.exports = app`). Rutas: `GET /api/health`, `POST /api/contracts`, `GET /api/contracts/due/:dias?` (default 60).
- **Núcleo:** `python/main.py` (stdlib puro, sin pip) + `python/db.py` (SQLite WAL, tabla `contracts`). El wrapper spawn con `PYTHONIOENCODING=utf-8` (`db/client.js`).
- **Datos:** `python/contractrenew.db` (gitignored).

## Correr

**Requisitos de equipo:** cualquier PC con 4 GB RAM y Windows 10+/macOS/Linux · Node.js 18+ · Python 3.10+ · navegador moderno. Sin GPU, sin internet obligatoria (Supabase solo si se usan leads).

```bash
cd SuitContractRenew && npm install && npm start    # :3017
python python/main.py add "Talleres López" 2026-12-01 800
python python/main.py due 60
python python/main.py due-json 60
python python/main.py close 3
```

## Gotchas
- **Encoding Windows:** `PYTHONIOENCODING=utf-8` ya seteado en `db/client.js` (cp1252 rompe acentos).
- **Fechas:** formato estricto `YYYY-MM-DD` (comparaciones SQL con `date()`).
- **`close` es soft-delete** (`activo=0`), nunca DELETE físico (regla repo #2).
- **SQLite WAL:** no borrar el `.db-wal` con el proceso corriendo.

## Multi-tenant (futuro)
MVP single-tenant. Integración al ecosistema → Supabase + `id_empresa` (regla inmutable #1).

## Puerto
| Puerto | Módulo |
|---|---|
| 3017 | SuitContractRenew |
