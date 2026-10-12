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
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(err || `python exit ${code}`)));
    setTimeout(() => { p.kill(); reject(new Error('python timeout')); }, timeoutMs);
  });
}

function todayJson() {
  return runPy(['main.py', 'today-json']).then(out => JSON.parse(out));
}

module.exports = { runPy, todayJson };
