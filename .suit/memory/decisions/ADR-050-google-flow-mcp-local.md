# ADR-050: Google Flow local MCP para assets creativos

## Status
Accepted (2026-10-10)

## Context
SuitContractRenew (y futuros módulos) necesitan assets creativos (imágenes, videos) para landing y ventas. Google Flow (labs.google/fx/tools/flow — NanoBanana/Veo) no expone API pública; existen MCPs que lo automatizan vía navegador. Requerimiento: no compartir credenciales Google con terceros y usar la sesión ya logueada del usuario.

## Decision
Instalar `shaig-mahmudov/google-flow-mcp` como MCP local (stdio) en `C:\Users\rojo-\Downloads\google-flow-mcp` (fuera del repo — GH Pages publica `path: '.'` y el clone tiene `node_modules/`), registrado en `opencode.json` → `mcp["google-flow"]` (`node .../src/index.js`).

Config: `config/flow.config.json` con `expectedAccount: rbtpdrn@gmail.com`, perfil de Chrome Default, CDP 9222, `headless: false`.

## Rationale
- Camino 2 elegido sobre "browser MCP a mano" (sin tools dedicadas) y sobre openflowmcp.com (servicio de terceros $6/mo, login remoto).
- MCP local conecta por CDP a tu Chrome ya autenticado → la contraseña nunca sale de tu máquina.
- Fuera del repo: el deploy de GitHub Pages sube todo; clon + node_modules no deben versionarse.

## Consequences
- **Chrome ≥136 ignora `--remote-debugging-port` en el perfil Default** → perfil dedicado obligatorio: `google-flow-mcp/chrome-profile/` (ya en `flow.config.json`). Login manual la 1ª vez (quedó persistente: rbtpdrn@gmail.com).
- OpenCode solo ve las tools `flow_*` tras reiniciar la sesión.
- **UI de Flow cambió (2026) a panel de chat** ("¿Qué quieres crear?" / ProseMirror): las tools del adapter `flow_generate_image` del canvas viejo fallan con SAFETY BLOCK (no encuentran tabs Image/Video — comportamiento correcto, evita gastar créditos de video). La generación por chat funciona end-to-end: smoke 2026-10-10 generó 2 imágenes 1376×768 (NanoBanana 2.1) descargables desde URLs `/asb/`; assets del smoke en `SuitContractRenew/landing/assets/hero.png`. Patch del adapter al chat-UI queda pendiente (upstream o fork).
- Escribir `flow.config.json` sin BOM (`Set-Content -Encoding UTF8` de PS5.1 mete BOM y rompe el parse del servidor).
- Automatización de UI no oficial: Google puede cambiar Flow y romper el adapter (requiere update del clone).
- Consumo: imágenes gratis en cuenta normal; video gasta créditos Google.

## Alternatives Considered
- Navegador MCP (playwright/chrome-devtools) sin MCP dedicado: cero instalación pero sin tools tipadas ni descarga/validación de medios.
- openflowmcp.com (HTTP hosteado): dependencia de servicio pago de terceros.
- API oficial de Google: no existe para Flow/Veo en esta vía.

## Related
- `opencode.json` → `mcp["google-flow"]`
- `.suit/INDEX.md` Projects / gotchas AGENTS.md
- ADR-049 (SuitContractRenew, primer consumidor: assets de landing/ventas)
