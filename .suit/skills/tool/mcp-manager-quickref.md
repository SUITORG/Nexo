# MCP Manager — Quick Reference

## Comandos del sistema
```bash
# Ver estado de todos los proyectos
node scripts/mcp-manager.js status

# Listar MCPs de un proyecto
node scripts/mcp-manager.js list SuitCampanas

# Activar un MCP
node scripts/mcp-manager.js enable comfyui SuitCotizador

# Desactivar un MCP
node scripts/mcp-manager.js disable canva SuitCampanas

# Sincronizar un proyecto con config óptima
node scripts/mcp-manager.js sync SuitChatTG

# Sincronizar todos los proyectos
node scripts/mcp-manager.js sync all

# Ver MCPs óptimos de un proyecto
node scripts/mcp-manager.js optimal SuitChatTG

# Ver MCPs óptimos de todos
node scripts/mcp-manager.js optimal
```

## Comandos opencode
```
/suit:mcp status
/suit:mcp list SuitCampanas
/suit:mcp enable comfyui SuitCotizador
/suit:mcp disable canva SuitCampanas
/suit:mcp sync SuitChatTG
/suit:mcp sync all
/suit:mcp optimal SuitChatTG
```

## MCPs disponibles
| MCP | Para qué |
|---|---|
| github | Git, PRs, issues |
| supabase | DB, auth |
| playwright | Testing SPA |
| chrome-devtools | Debug frontend |
| neon | PostgreSQL serverless |
| google-sheets | Leer/escribir Sheets |
| comfyui | Generar imágenes/frames IA |
| canva | Diseñar materiales |
| obs-mcp | Grabar/OBS |
| capcut | Editar video |
| telegram-bot | Bot Telegram |

## Después de cambiar MCPs
**Reinicia opencode** para que se carguen/descarguen los MCPs.
