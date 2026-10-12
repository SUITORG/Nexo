# INSTALACIÓN — ContractRenew (máquina nueva)

**Para qué sirve:** poner ContractRenew en marcha en una computadora o servidor nuevo, sin tocar el repo completo.
**Audiencia:** quien instala (cliente técnico o SuitOrg).

## Requisitos
- Windows 10+ / macOS / Linux
- Node.js 18+ (`node --version`)
- Python 3.10+ (`python --version`)
- Navegador moderno
- ~200 MB de espacio (sin contar node_modules)

## Pasos (5 min)

1. **Copia el módulo** — solo la carpeta `SuitContractRenew/` (no necesitas el resto del repo).
2. **Instala dependencias:**
   ```bash
   cd SuitContractRenew
   npm install
   ```
3. **Configura (solo si usarás la landing con leads):** copia `.env.example` → `.env` y llena `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Sin `.env`, la API y la demo funcionan igual — solo falla el form de la landing.
4. **Arranca:**
   - Windows: doble clic a `abrir.bat` (levanta y abre el navegador), o
   - Todos los SO: `npm start`
5. **Verifica:** abre `http://localhost:3017/api/health` → debe responder `{"status":"ok","module":"SuitContractRenew"}`.

## Checklist de verificación
- [ ] `GET /api/health` → 200
- [ ] `http://localhost:3017/` muestra la landing
- [ ] `python python/main.py due 60` imprime la lista (o "0")

## Actualizar a una versión nueva
1. Para el servicio.
2. Reemplaza la carpeta (guarda `python/contractrenew.db` — ahí viven los contratos).
3. `npm install` → arranca → verifica health.

## Desinstalar
Borra la carpeta. La BD (`python/contractrenew.db`) vive dentro — si quieres conservar los datos, guárdala antes.
