# MCP Contract — Root Declares Superset, Subproject Activates Subset

## Principle
The root `.mcp.json` declares the full superset of available MCP servers. Each subproject (or external project) either:
- Activates a subset via `enabledMcpjsonServers` in its local settings, or
- Redeclares a server with its own environment overrides.

## Contract

### Root `.mcp.json` (superset)
```json
{
  "mcpServers": {
    "supabase": { "command": "node", "args": ["tooling/mcp-bridge/shim.js", "--package", "@supabase/mcp-server"] },
    "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "."] }
  }
}
```

### Subproject override pattern
```json
// .claude/settings.local.json
{
  "enabledMcpjsonServers": ["supabase"],
  "mcpServers": {
    "supabase": { "command": "node", "args": ["../../tooling/mcp-bridge/shim.js", "--package", "@supabase/mcp-server"] }
  }
}
```

## Rules
1. Root `.mcp.json` never contains secrets — use `shim.js` with `dotenv.config()`.
2. Every subproject declares its own `enabledMcpjsonServers` to avoid loading unused MCPs.
3. To add a new MCP server: add to root `.mcp.json`, then activate per-subproject as needed.
4. Never duplicate server definitions across subprojects — override only the environment variables that differ.
