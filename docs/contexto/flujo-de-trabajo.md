# Flujo de Trabajo — SuitOrg

## Cómo hacer un cambio

```
1. Leer INDEX_FUNCIONES.md → localizar función exacta (archivo:línea)
2. Leer solo el contexto de la función (ahorra tokens)
3. Identificar si el cambio toca: multi-tenant, seguridad, persistencia, GAS o Supabase
4. Clasificar riesgo: bajo / medio / alto
5. Ejecutar cambio
6. Correr validaciones disponibles
7. Regenerar INDEX_FUNCIONES.md si se agregaron/renombraron funciones
8. Commit con formato: {emoji} {tipo}: {descripción} (v{X.Y.Z})
```

## Checklist de "Terminado"

- [ ] El cambio respeta las reglas de AGENTS.md (especialmente multi-tenant isolation)
- [ ] No hay secrets expuestos en código (.env sigue ignorado por git)
- [ ] `id_empresa` está filtrado en toda nueva query
- [ ] No se usa borrado físico (solo `activo = FALSE`)
- [ ] IDs secuenciales, no UUIDs
- [ ] Si es POST a GAS: incluye token de seguridad
- [ ] INDEX_FUNCIONES.md actualizado (correr `node scripts/generate-index.js`)
- [ ] Smoke check manual: probar flujo feliz y caso error
- [ ] [PENDIENTE: No hay tests automatizados que correr — agregar tests es deuda técnica]
- [ ] [PENDIENTE: No hay lint/typecheck que ejecutar]

## Deploy

### GAS (Google Apps Script)
```bash
clasp push   # sube backend/ a script.google.com
clasp deploy # despliega nueva versión
```

### Frontend (GitHub Pages)
El workflow `.github/workflows/deploy.yml` despliega automáticamente al hacer push a `main`:
1. Crea `js/modules/config.js` con secrets de GH Actions
2. Sube todo el repo como artifact
3. Despliega a GitHub Pages

### Servidor Node (si aplica)
- `server.js` (puerto 3001): `npm start` o `npm run dev`
- `CampanasAi/local-server-node.js` (puerto 8000): `node local-server-node.js`
- `citas/index.js` (puerto 3002): `node citas/index.js`

### WSL Backups
```bash
DATE_STR=$(date +%d%m%y)
zip -r "SUIT_${DATE_STR}_WSL.zip" . -x "*/node_modules/*" "*/.git/*" "*.zip" "*/.agent/*"
```

## Entornos

| Entorno | Propósito | Ubicación |
|---|---|---|
| Desarrollo local | WSL 2 en Windows | `C:\Users\rojo-\Downloads\SUITORGSTORE01` |
| Producción (GAS) | Google Script runtime | `script.google.com` (ID: `1pSFYiYl_blIOzZ_kBSYDB-2CRjx6b44LENqkodgmqg_QI7e5S4WwpiJS`) |
| Producción (Frontend) | GitHub Pages | `suitorgstore01.github.io` (asumido del workflow) |

[PENDIENTE: No hay definición de ambiente de staging/pre-producción. Todo cambio va directo a producción.]
[PENDIENTE: No hay proceso documentado de rollback más allá de restaurar desde _LEGACY_BACKUPS/.]
