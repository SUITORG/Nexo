# MCP Manager — Gestión de MCPs por Proyecto

Gestiona qué MCPs están activos en cada proyecto de SuitOrg.

## Cómo funciona

opencode carga `opencode.json` del directorio donde se ejecuta. Cada proyecto puede tener el suyo con MCPs diferentes.

## Estructura de archivos

```
SuitOrg/                    ← opencode.json raíz (github, supabase, playwright, chrome-devtools, neon)
├── SuitCampanas/           ← opencode.json (supabase, google-sheets, comfyui, canva)
├── SuitVidGenRemotion/     ← opencode.json (supabase, comfyui, obs-mcp, capcut)
└── SuitCotizador/          ← opencode.json (supabase, github)
```

## MCPs Disponibles

| MCP | Tipo | Para qué |
|---|---|---|
| `github` | local | PRs, issues, git |
| `supabase` | local | DB principal, auth |
| `playwright` | local | Testing del SPA |
| `chrome-devtools` | local | Debug frontend |
| `neon` | remote | PostgreSQL serverless |
| `google-sheets` | local | Leer/escribir Sheets |
| `comfyui` | local | Generar imágenes/frames con IA |
| `canva` | remote | Diseñar materiales visuales |
| `obs-mcp` | local | Grabar pantalla, controlar OBS |
| `capcut` | local | Editar clips, efectos |
| `higgsfield` | remote | Video generation (obsoleto) |

## Comandos

### Listar MCPs de un proyecto
```
mcp manager list [proyecto]
```
Muestra los MCPs activos en el proyecto indicado.

### Activar un MCP
```
mcp manager enable <mcp-name> [proyecto]
```
Agrega el MCP al `opencode.json` del proyecto.

### Desactivar un MCP
```
mcp manager disable <mcp-name> [proyecto]
```
Elimina el MCP del `opencode.json` del proyecto.

### Ver estado general
```
mcp manager status
```
Muestra qué MCPs tiene cada proyecto.

### Sincronizar con config óptima
```
mcp manager sync <proyecto>
mcp manager sync all
```
Agrega MCPs faltantes y quita excedentes según la config óptima definida.

### Ver MCPs óptimos
```
mcp manager optimal <proyecto>
mcp manager optimal
```
Muestra qué MCPs debería tener cada proyecto y si está sincronizado.

## Flujo típico

1. Usuario: "quiero trabajar en SuitCampanas"
2. Agente: ejecuta `mcp manager list SuitCampanas`
3. Agente: muestra MCPs disponibles y activos
4. Usuario: "agrega comfyui y canva"
5. Agente: ejecuta `mcp manager enable comfyui SuitCampanas` y `mcp manager enable canva SuitCampanas`
6. Usuario reinicia opencode para que tome los cambios

## Notas importantes

- Los cambios requieren **reiniciar opencode** para que se carguen/descarguen los MCPs
- La raíz de SuitOrg nunca debe tener MCPs de subproyectos (comfyui, obs-mcp, capcut, canva)
- Cada subproyecto debe tener solo los MCPs que necesita
- Si no hay `opencode.json` en un proyecto, se usa la config global
