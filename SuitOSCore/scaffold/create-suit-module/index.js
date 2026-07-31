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

function generateModule(moduleName, targetDir, port, frontend) {
  const dirs = ['', 'db', 'handlers', 'services'];
  if (frontend) dirs.push('public');
  for (const d of dirs) {
    fs.mkdirSync(path.join(targetDir, d), { recursive: true });
  }

  const replacements = {
    '{{MODULE_NAME}}': moduleName,
    '{{PORT}}': port || '3000',
    '{{CORE_PATH}}': path.relative(targetDir, CORE_DIR).replace(/\\/g, '/'),
  };

  function processFile(srcPath, destDir, outName) {
    let content = fs.readFileSync(srcPath, 'utf8');
    for (const [key, val] of Object.entries(replacements)) {
      content = content.split(key).join(val);
    }
    const targetFile = path.join(destDir, outName);
    if (!fs.existsSync(targetFile)) {
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`  Created: ${path.relative(targetDir, targetFile)}`);
    }
  }

  function scanDir(dir, destDir, prefix) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        if (e.name === '_frontend') continue; // handled separately
        scanDir(path.join(dir, e.name), destDir, prefix);
      } else if (e.isFile()) {
        let outName = e.name.replace(/\.template$/, '').replace(/^_/, '');
        if (prefix) outName = prefix + '/' + outName;
        // Map template subdirs to target subdirs: _db/ → db/, _handlers/ → handlers/
        const relDir = path.relative(TEMPLATES_DIR, dir)
        const targetSubdir = relDir.replace(/^_/, '')
        const targetDest = targetSubdir ? path.join(destDir, targetSubdir) : destDir
        processFile(path.join(dir, e.name), targetDest, e.name.replace(/\.template$/, '').replace(/^_/, ''))
      }
    }
  }

  scanDir(TEMPLATES_DIR, targetDir, '');

  if (frontend) {
    const feDir = path.join(TEMPLATES_DIR, '_frontend');
    if (fs.existsSync(feDir)) {
      const feFiles = fs.readdirSync(feDir);
      for (const f of feFiles) {
        let content = fs.readFileSync(path.join(feDir, f), 'utf8');
        for (const [key, val] of Object.entries(replacements)) {
          content = content.split(key).join(val);
        }
        let outName = f.replace(/\.template$/, '').replace(/^_/, '');
        const targetFile = path.join(targetDir, 'public', outName);
        if (!fs.existsSync(targetFile)) {
          fs.writeFileSync(targetFile, content, 'utf8');
          console.log(`  Created: public/${outName}`);
        }
      }
      const indexPath = path.join(targetDir, 'index.js');
      if (fs.existsSync(indexPath)) {
        let main = fs.readFileSync(indexPath, 'utf8');
        if (!main.includes('express.static')) {
          const serveLine = `app.use(express.static(path.join(__dirname, 'public')));\n`;
          if (!main.includes('const path = require')) {
            main = main.replace(/^const express/, "const path = require('path');\nconst express");
          }
          const listenLine = main.indexOf('app.listen');
          if (listenLine >= 0) {
            main = main.slice(0, listenLine) + serveLine + main.slice(listenLine);
            fs.writeFileSync(indexPath, main, 'utf8');
          }
        }
      }
    }
  }

  if (frontend) {
    const indexPath = path.join(targetDir, 'index.js');
    if (fs.existsSync(indexPath)) {
      let main = fs.readFileSync(indexPath, 'utf8');
      if (!main.includes('express.static')) {
        const serveLine = `app.use(express.static(path.join(__dirname, 'public')));\n`;
        const listenLine = main.indexOf('app.listen');
        if (listenLine >= 0) {
          const pathReq = `const path = require('path');\n`;
          main = main.replace(/^const express/, pathReq + 'const express');
          main = main.slice(0, listenLine) + serveLine + main.slice(listenLine);
          fs.writeFileSync(indexPath, main, 'utf8');
        }
      }
    }
  }
}

function main() {
  const args = parseArgs();
  const moduleName = args.name || args._;
  const frontend = !!args.frontend;

  if (!moduleName) {
    console.log('Usage: node scaffold/create-suit-module/index.js --name MyModule [--port 3000] [--dir ./MyModule] [--frontend]');
    process.exit(1);
  }

  const targetDir = args.dir ? path.resolve(args.dir) : path.resolve(process.cwd(), moduleName);
  const port = args.port || '3000';

  console.log(`\n  Creating module "${moduleName}" at ${targetDir}${frontend ? ' (with frontend)' : ''}\n`);
  generateModule(moduleName, targetDir, port, frontend);
  console.log(`\n  Done. Next steps:`);
  console.log(`    cd ${path.relative(process.cwd(), targetDir)}`);
  console.log(`    npm install`);
  console.log(`    cp .env.example .env  # configure your environment`);
  console.log(`    node index.js         # starts on port ${port}\n`);
}

main();
