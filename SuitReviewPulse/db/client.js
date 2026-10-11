const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

function importRows(empresa, rows) {
  const tmp = path.join(os.tmpdir(), `rp-import-${Date.now()}.csv`);
  const header = 'review_id,business,author,rating,comment,date\n';
  const body = rows.map(r =>
    [r.review_id, r.business || empresa, r.author, r.rating, r.comment, r.date]
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  fs.writeFileSync(tmp, header + body, 'utf-8');
  return runPy(['main.py', 'import', tmp, empresa]).finally(() => fs.unlink(tmp, () => {}));
}

async function report(empresa) {
  const out = await runPy(['main.py', 'report-json', empresa]);
  return JSON.parse(out);
}

module.exports = { runPy, importRows, report };
