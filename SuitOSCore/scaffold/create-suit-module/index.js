#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const CORE_DIR = path.resolve(__dirname, '..', '..');

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i].slice(2);
      const val = process.argv[i + 1];
      if (val && !val.startsWith('--')) {
        args[key] = val;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function generateModule(moduleName, targetDir, port) {
  const dirs = ['', 'db', 'handlers', 'services'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(targetDir, d), { recursive: true });
  }

  const replacements = {
    '{{MODULE_NAME}}': moduleName,
    '{{PORT}}': port || '3000',
    '{{CORE_PATH}}': path.relative(targetDir, CORE_DIR).replace(/\\/g, '/')
  };

  const templates = fs.readdirSync(TEMPLATES_DIR);
  for (const tmpl of templates) {
    let content = fs.readFileSync(path.join(TEMPLATES_DIR, tmpl), 'utf8');
    for (const [key, val] of Object.entries(replacements)) {
      content = content.split(key).join(val);
    }

    let outName = tmpl.replace(/^_/, '').replace(/\.template$/, '');
    const targetFile = path.join(targetDir, outName);
    if (!fs.existsSync(targetFile)) {
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`  Created: ${outName}`);
    }
  }
}

function main() {
  const args = parseArgs();
  const moduleName = args.name || args._;

  if (!moduleName) {
    console.log('Usage: node scaffold/create-suit-module/index.js --name MyModule [--port 3000] [--dir ./MyModule]');
    process.exit(1);
  }

  const targetDir = args.dir ? path.resolve(args.dir) : path.resolve(process.cwd(), moduleName);
  const port = args.port || '3000';

  console.log(`\n  Creating module "${moduleName}" at ${targetDir}\n`);
  generateModule(moduleName, targetDir, port);
  console.log(`\n  Done. Next steps:`);
  console.log(`    cd ${path.relative(process.cwd(), targetDir)}`);
  console.log(`    npm install`);
  console.log(`    cp .env.example .env  # configure your environment`);
  console.log(`    node index.js         # starts on port ${port}\n`);
}

main();
