# Convenciones — SuitOrg

## Naming

| Contexto | Convención | Ejemplos |
|---|---|---|
| Funciones JS/GS | `camelCase` | `getSS`, `handlePostAction`, `setWorkMode` |
| Clases | `PascalCase` | `ImageProcessor`, `ReelGenerator` |
| Constantes | `UPPER_SNAKE_CASE` | `SECRET_TOKEN`, `CONFIG`, `DB_ID` |
| Columnas DB | `snake_case` | `id_empresa`, `fecha_estatus` |
| Tablas DB | `PascalCase_With_Underscores` | `Config_Empresas`, `Proyectos_Bitacora` |
| IDs de negocio | `PREFIX-NNN` | `LEAD-001`, `ORD-123`, `CLI-042` |
| Variables de entorno | `UPPER_SNAKE_CASE` | `GEMINI_API_KEY`, `SUPABASE_URL` |
| Endpoints API | kebab-case | `/api/video-imaginacion`, `/api/db/:table` |
| Archivos JS/GS | kebab-case | `core.js`, `ai_engine.js`, `local-server-node.js` |

## Estilo de Código

- **Funciones**: `function name() {}` en GAS; arrow functions `const name = () => {}` en Node moderno
- **Async**: `async/await` preferido sobre promesas `.then()`
- **Errores**: Patrón `{ status: "success"/"error", message, data }` en todas las respuestas API
- **Logs**: Emoji-prefix (`🤖 [IA_ENGINE]`, `📦 [BACKEND]`) en GAS y Node
- **Versiones**: String `vX.Y.Z` en header de cada módulo (`v15.9.1`, `v16.7.28`)
- **Comentarios**: Ninguno (el código es auto-documentado); solo version headers
- **Módulos GAS**: Objeto literal namespace (`DriveManager = {}`), no clases ES6
- **Módulos Node**: `require` (CommonJS), no `import` ESM (excepto `ssg-engine.mjs`)

## Patrones Usados

- **Switch-case de acciones**: `handlePostAction` en GAS centraliza por `action`
- **Dual-write**: Escribe primero a Supabase, replica a GSheets
- **Fallback chain**: AI multi-modelo → Gemini → OpenRouter → LM Studio local
- **Find-or-create**: Clientes por teléfono, recetas por nombre
- **Soft-delete**: Columna `activo` (TRUE/FALSE), nunca DELETE
- **Proxy pattern**: Node.js proxifica a GAS para evitar CORS
- **Idempotent seed**: `ensureSeed()` verifica existencia antes de insertar

## Patrones Prohibidos

- UUIDs aleatorios como IDs de negocio (solo secuenciales `PREFIX-NNN`)
- Borrado físico de registros (usar `activo = FALSE`)
- `mode: 'cors'` en fetch hacia GAS (GAS rechaza preflight OPTIONS)
- Framework frontend (React/Vue/etc.) — mantener vanilla
- Nombres de archivo con espacios o acentos

## Tests

- **Solo existe**: `CampanasAi/test-system.js` (80 líneas, axios), `test-backend.html`, `test.html`, `test-simple.html`
- No hay framework de testing (ni Jest, ni Mocha, ni Vitest)
- [PENDIENTE: No hay convención definida para escribir tests nuevos]

## Commits

- Prefijo emoji + tipo: `📦 Refactor:`, `🚀 Release:`, `🔒 Security:`, `🎨 UI:`, `✨ Feat/Fix:`
- Formato: `{emoji} {tipo}: {descripción} (v{X.Y.Z})`
- Commits frecuentes, mensajes descriptivos en español
- Ejemplo: `📦 Refactor: Consolidación de workflows, rediseño de rejilla POS y ajustes de OTP en WhatsApp (v4.6.9)`

[PENDIENTE: No hay convención de ramas (git flow, trunk-based, etc.) visible en los commits/logs.]
