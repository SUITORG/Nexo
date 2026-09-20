#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\rojo-\\Downloads\\SuitOrg';

const MCP_DEFAULTS = {
  github: {
    type: "local",
    command: ["npx", "-y", "@modelcontextprotocol/server-github"],
    env: { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" },
    enabled: true
  },
  supabase: {
    type: "local",
    command: ["node", "scripts/mcp-supabase.js"],
    enabled: true
  },
  playwright: {
    type: "local",
    command: ["npx", "@playwright/mcp@latest"],
    enabled: true
  },
  "chrome-devtools": {
    type: "local",
    command: ["npx", "-y", "chrome-devtools-mcp@latest", "--no-usage-statistics"],
    enabled: true
  },
  neon: {
    type: "remote",
    url: "https://mcp.neon.tech/mcp",
    enabled: true
  },
  "google-sheets": {
    type: "local",
    command: ["npx", "-y", "mcp-gsheets@latest"],
    enabled: true,
    env: {
      "GOOGLE_PROJECT_ID": "suitorg00",
      "GOOGLE_APPLICATION_CREDENTIALS": "C:\\Users\\rojo-\\Downloads\\suitorg\\google-credentials.json"
    }
  },
  comfyui: {
    type: "local",
    command: ["npx", "-y", "comfyui-mcp"],
    enabled: true,
    env: { "COMFYUI_HOST": "127.0.0.1", "COMFYUI_PORT": "8188" }
  },
  canva: {
    type: "remote",
    url: "https://mcp.canva.com/mcp",
    enabled: true
  },
  "obs-mcp": {
    type: "local",
    command: ["C:\\Users\\rojo-\\Downloads\\SuitOrg\\obs-mcp\\.venv\\Scripts\\obs-mcp.exe"],
    enabled: true,
    env: { "OBS_HOST": "localhost", "OBS_PORT": "4455", "OBS_PASSWORD": "Cro200" }
  },
  capcut: {
    type: "local",
    command: ["C:\\Users\\rojo-\\Downloads\\SuitOrg\\vectcutapi-mcp\\.venv\\Scripts\\python.exe", "mcp_server.py"],
    cwd: "C:\\Users\\rojo-\\Downloads\\SuitOrg\\vectcutapi-mcp",
    enabled: true
  },
  higgsfield: {
    type: "remote",
    url: "https://mcp.higgsfield.ai/mcp",
    enabled: true
  },
  "telegram-bot": {
    type: "local",
    command: ["npx", "-y", "telegram-bot-mcp-server"],
    env: { "TELEGRAM_BOT_API_TOKEN": "${TELEGRAM_BOT_API_TOKEN}" },
    enabled: true
  }
};

// MCPs óptimos por proyecto (basado en análisis del código)
const PROJECT_OPTIMAL = {
  root: ["github", "supabase", "playwright", "chrome-devtools", "neon"],
  SuitCampanas: ["supabase", "google-sheets", "comfyui", "canva"],
  SuitVidGenRemotion: ["supabase", "comfyui", "obs-mcp", "capcut"],
  SuitChatTG: ["supabase", "telegram-bot"],
  SuitServiHogar: ["supabase"],
  SuitReservaciones: ["supabase", "google-sheets"],
  SuitCVLO: ["supabase"],
  SuitComfy: ["comfyui"],
  SuitCotizador: ["supabase"],
  SuitPos: ["supabase"],
  SuitProductos: ["supabase"],
  SuitInventarios: ["supabase"],
  SuitBodega: ["supabase"],
  SuitPedidoExpress: ["supabase"],
  Prospectos: ["google-sheets"]
};

function getConfigPath(project) {
  const dir = project === 'root' || !project ? ROOT : path.join(ROOT, project);
  return path.join(dir, 'opencode.json');
}

function loadConfig(project) {
  const configPath = getConfigPath(project);
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return null;
  }
}

function saveConfig(project, config) {
  const configPath = getConfigPath(project);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function getProjectMCPs(project) {
  const config = loadConfig(project);
  if (!config || !config.mcp) return [];
  return Object.entries(config.mcp)
    .filter(([_, v]) => v.enabled !== false)
    .map(([k]) => k);
}

function listMCPs(project) {
  const config = loadConfig(project);
  if (!config || !config.mcp) {
    console.log(`\n${project || 'root'}: No tiene opencode.json o no tiene MCPs configurados.`);
    return;
  }
  const mcps = Object.entries(config.mcp);
  const activos = mcps.filter(([_, v]) => v.enabled !== false);
  const desactivados = mcps.filter(([_, v]) => v.enabled === false);
  
  console.log(`\n=== ${project || 'root'} ===`);
  console.log(`  Activos (${activos.length}): ${activos.map(([k]) => k).join(', ') || 'ninguno'}`);
  if (desactivados.length > 0) {
    console.log(`  Desactivados (${desactivados.length}): ${desactivados.map(([k]) => k).join(', ')}`);
  }
}

function enableMCP(mcpName, project) {
  if (!MCP_DEFAULTS[mcpName]) {
    console.log(`\nMCP "${mcpName}" no reconocido. Disponibles: ${Object.keys(MCP_DEFAULTS).join(', ')}`);
    return;
  }
  
  let config = loadConfig(project);
  if (!config) {
    config = { "$schema": "https://opencode.ai/config.json", "mcp": {} };
  }
  if (!config.mcp) config.mcp = {};
  
  config.mcp[mcpName] = MCP_DEFAULTS[mcpName];
  saveConfig(project, config);
  console.log(`\n✓ MCP "${mcpName}" activado en ${project || 'root'}`);
}

function disableMCP(mcpName, project) {
  let config = loadConfig(project);
  if (!config || !config.mcp || !config.mcp[mcpName]) {
    console.log(`\nMCP "${mcpName}" no está en ${project || 'root'}`);
    return;
  }
  
  delete config.mcp[mcpName];
  saveConfig(project, config);
  console.log(`\n✓ MCP "${mcpName}" desactivado de ${project || 'root'}`);
}

function statusAll() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   ESTADO DE MCPs POR PROYECTO               ║');
  console.log('╚══════════════════════════════════════════════╝');
  
  // Root
  listMCPs('root');
  
  // Proyectos con opencode.json
  const projects = fs.readdirSync(ROOT).filter(d => {
    try {
      const stat = fs.statSync(path.join(ROOT, d));
      return stat.isDirectory() && !d.startsWith('.') && fs.existsSync(path.join(ROOT, d, 'opencode.json'));
    } catch { return false; }
  });
  
  projects.forEach(p => listMCPs(p));
  
  console.log('\n⚠  Recuerda reiniciar opencode para que los cambios tomen efecto.');
}

function syncProject(project) {
  const optimal = PROJECT_OPTIMAL[project];
  if (!optimal) {
    console.log(`\nNo hay MCPs óptimos definidos para "${project}".`);
    console.log(`Proyectos conocidos: ${Object.keys(PROJECT_OPTIMAL).join(', ')}`);
    return;
  }
  
  let config = loadConfig(project);
  if (!config) {
    config = { "$schema": "https://opencode.ai/config.json", "mcp": {} };
  }
  if (!config.mcp) config.mcp = {};
  
  const current = Object.keys(config.mcp);
  const toAdd = optimal.filter(m => !current.includes(m));
  const toRemove = current.filter(m => !optimal.includes(m));
  
  if (toAdd.length === 0 && toRemove.length === 0) {
    console.log(`\n✓ ${project || 'root'} ya está sincronizado con la configuración óptima.`);
    return;
  }
  
  // Agregar MCPs faltantes
  toAdd.forEach(mcp => {
    if (MCP_DEFAULTS[mcp]) {
      config.mcp[mcp] = MCP_DEFAULTS[mcp];
      console.log(`  + ${mcp}`);
    }
  });
  
  // Quitar MCPs excedentes
  toRemove.forEach(mcp => {
    delete config.mcp[mcp];
    console.log(`  - ${mcp}`);
  });
  
  saveConfig(project, config);
  console.log(`\n✓ ${project || 'root'} sincronizado: +${toAdd.length} / -${toRemove.length}`);
}

function syncAll() {
  console.log('\n=== SINCRONIZANDO TODOS LOS PROYECTOS ===\n');
  
  Object.keys(PROJECT_OPTIMAL).forEach(project => {
    syncProject(project);
  });
  
  console.log('\n✓ Todos los proyectos sincronizados.');
  console.log('⚠  Recuerda reiniciar opencode para que los cambios tomen efecto.');
}

function showOptimal(project) {
  const optimal = PROJECT_OPTIMAL[project];
  if (!optimal) {
    console.log(`\nNo hay MCPs óptimos definidos para "${project}".`);
    console.log(`Proyectos conocidos: ${Object.keys(PROJECT_OPTIMAL).join(', ')}`);
    return;
  }
  
  const current = getProjectMCPs(project);
  const missing = optimal.filter(m => !current.includes(m));
  const extra = current.filter(m => !optimal.includes(m));
  
  console.log(`\n=== MCPs óptimos para ${project || 'root'} ===`);
  console.log(`  Óptimos:     ${optimal.join(', ')}`);
  console.log(`  Actuales:    ${current.length > 0 ? current.join(', ') : '(ninguno)'}`);
  
  if (missing.length > 0) {
    console.log(`  Faltantes:   ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.log(`  Excedentes:  ${extra.join(', ')}`);
  }
  if (missing.length === 0 && extra.length === 0) {
    console.log(`  Estado:      ✓ Sincronizado`);
  } else {
    console.log(`  Estado:      ✗ Desincronizado (usa "sync ${project}" para corregir)`);
  }
}

function showAllOptimal() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   MCPs ÓPTIMOS POR PROYECTO                 ║');
  console.log('╚══════════════════════════════════════════════╝');
  
  Object.entries(PROJECT_OPTIMAL).forEach(([project, mcps]) => {
    const current = getProjectMCPs(project);
    const sync = current.length === mcps.length && mcps.every(m => current.includes(m));
    const icon = sync ? '✓' : '✗';
    console.log(`\n${icon} ${project || 'root'}`);
    console.log(`  Óptimos:  ${mcps.join(', ')}`);
    if (current.length > 0 && !sync) {
      console.log(`  Actuales: ${current.join(', ')}`);
    }
  });
}

// CLI
const [,, cmd, arg1, arg2] = process.argv;

switch (cmd) {
  case 'list':
    if (arg1) {
      listMCPs(arg1);
    } else {
      console.log('Uso: mcp-manager.js list <proyecto>');
    }
    break;
    
  case 'enable':
    if (arg1) {
      enableMCP(arg1, arg2);
    } else {
      console.log('Uso: mcp-manager.js enable <mcp> [proyecto]');
    }
    break;
    
  case 'disable':
    if (arg1) {
      disableMCP(arg1, arg2);
    } else {
      console.log('Uso: mcp-manager.js disable <mcp> [proyecto]');
    }
    break;
    
  case 'status':
    statusAll();
    break;
    
  case 'sync':
    if (arg1 === 'all') {
      syncAll();
    } else if (arg1) {
      syncProject(arg1);
    } else {
      console.log('Uso: mcp-manager.js sync <proyecto|all>');
    }
    break;
    
  case 'optimal':
    if (arg1) {
      showOptimal(arg1);
    } else {
      showAllOptimal();
    }
    break;
    
  default:
    console.log(`
╔══════════════════════════════════════════════╗
║   MCP Manager - Gestión de MCPs por Proyecto ║
╚══════════════════════════════════════════════╝

Uso:
  node mcp-manager.js list <proyecto>          Lista MCPs de un proyecto
  node mcp-manager.js enable <mcp> [proyecto]  Activa un MCP
  node mcp-manager.js disable <mcp> [proyecto] Desactiva un MCP
  node mcp-manager.js status                   Estado de todos los proyectos
  node mcp-manager.js sync <proyecto|all>      Sincroniza con config óptima
  node mcp-manager.js optimal [proyecto]       Muestra MCPs óptimos

MCPs disponibles: ${Object.keys(MCP_DEFAULTS).join(', ')}

Proyectos con config óptima: ${Object.keys(PROJECT_OPTIMAL).join(', ')}
    `);
}
