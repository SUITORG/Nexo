const { spawn } = require('child_process');
const path = require('path');

const PY = process.env.PYTHON || 'python';
const CWD = path.join(__dirname, '..', 'python');

function runPy(args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const p = spawn(PY, args, { cwd: CWD, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    let out = '', err = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (err += d));
    p.on('error', reject);
    p.on('close', code =>
      code === 0 ? resolve(out) : reject(new Error(err || `python exit ${code}`))
    );
    setTimeout(() => { p.kill(); reject(new Error('python timeout')); }, timeoutMs);
  });
}

function addContract({ cliente, renovacion, precio_mensual = 0, tipo = 'mantenimiento' }) {
  const args = ['main.py', 'add', cliente, renovacion];
  if (precio_mensual) args.push(String(precio_mensual));
  if (tipo && tipo !== 'mantenimiento') args.push(tipo);
  return runPy(args);
}

async function dueContracts(dias = 60) {
  const out = await runPy(['main.py', 'due-json', String(dias)]);
  return JSON.parse(out);
}

module.exports = { runPy, addContract, dueContracts };
