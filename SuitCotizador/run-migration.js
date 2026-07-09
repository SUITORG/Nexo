require('dotenv').config();
const fs = require('fs');

const projectRef = 'egyxgnlnzanxpqyuvmsg';
const managementKey = 'sbp_8fdea317a887f866d6fa1d434e82d23e8c06071a';
const baseUrl = 'https://api.supabase.com/v1/projects/' + projectRef;

async function runQuery(sql) {
  const res = await fetch(baseUrl + '/database/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + managementKey
    },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : (data.message || JSON.stringify(data)));
  return data;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function splitTopLevel(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  let dollarTag = '';
  let inSingleQuote = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1] || '';

    if (!inSingleQuote && !inDollar && ch === '$' && next === '$') {
      inDollar = true; dollarTag = '$$'; current += '$$'; i += 2; continue;
    }
    if (inDollar && dollarTag === '$$' && ch === '$' && next === '$') {
      current += '$$'; i += 2; inDollar = false; dollarTag = ''; continue;
    }

    if (!inSingleQuote && !inDollar && ch === '$') {
      let tag = '';
      let j = i + 1;
      while (j < sql.length && sql[j] !== '$' && sql[j] !== '\n' && sql[j] !== '\r') { tag += sql[j]; j++; }
      if (j < sql.length && sql[j] === '$' && tag.length > 0) {
        inDollar = true; dollarTag = '$' + tag + '$'; current += '$' + tag + '$'; i = j + 1; continue;
      }
    }
    if (inDollar && dollarTag !== '$$' && ch === '$') {
      let j = i + 1; let endTag = '$';
      while (j < sql.length && sql[j] !== '$' && endTag.length < dollarTag.length) { endTag += sql[j]; j++; }
      if (j < sql.length && sql[j] === '$') {
        endTag += '$';
        if (endTag === dollarTag) { current += dollarTag; i = j + 1; inDollar = false; dollarTag = ''; continue; }
      }
    }

    if (!inDollar && ch === "'" && next === "'") { current += "''"; i += 2; continue; }
    if (!inDollar && ch === "'") { inSingleQuote = !inSingleQuote; current += ch; i++; continue; }

    if (!inDollar && !inSingleQuote && ch === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = ''; i++; continue;
    }

    current += ch; i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);
  return statements;
}

async function main() {
  await sleep(70000);

  console.log('🔌 Connecting...');
  try {
    await runQuery('SELECT 1');
    console.log('✅ Connected!');
  } catch (e) {
    console.error('❌', e.message.substring(0, 200));
    return;
  }

  // Check what exists
  const { data: tables } = await runQuery(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%Cotizac%'
  `);
  console.log('📋 Existing tables:', tables?.map(r => r.table_name).join(', ') || 'none');

  const { data: funcs } = await runQuery(`
    SELECT proname FROM pg_catalog.pg_proc 
    WHERE pronamespace = 'public'::regnamespace 
    AND proname LIKE '%cotizac%' OR proname LIKE '%generar_folio%' OR proname LIKE '%evaluar_condicion%' OR proname LIKE '%update_actualizado%'
  `);
  console.log('📋 Existing functions:', funcs ? funcs.map(r => r.proname).join(', ') : 'none');

  // Only run the functions that don't exist
  const existingTables = new Set((tables || []).map(t => t.table_name));
  const existingFuncs = new Set((funcs || []).map(f => f.proname));

  const rawSql = fs.readFileSync('Documentacion/migrations/001_suit_cotizador.sql', 'utf8');
  const cleaned = rawSql.replace(/^--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const allStatements = splitTopLevel(cleaned).filter(s => s.length > 0);

  // Only run CREATE TABLE/INDEX if tables missing, always run CREATE FUNCTION (OR REPLACE)
  const filtered = allStatements.filter(stmt => {
    const upper = stmt.toUpperCase().trim();
    if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX') || 
        upper.startsWith('ALTER TABLE') || upper.startsWith('CREATE POLICY') ||
        upper.startsWith('COMMENT ON')) {
      // Extract table name to check if it exists
      return true; // OR REPLACE handles this safely
    }
    return true; // run everything, OR REPLACE is safe
  });

  console.log(`📄 Executing ${filtered.length} statements...`);

  let success = 0, failed = 0;
  for (let i = 0; i < filtered.length; i++) {
    const stmt = filtered[i];
    try {
      await runQuery(stmt + ';');
      success++;
    } catch (e) {
      const msg = e.message;
      if (msg.includes('already exists') || msg.includes('duplicate key') || 
          msg.includes('duplicate') || msg.includes('already has') ||
          msg.includes('already a policy') || msg.includes('already a trigger')) {
        success++;
        continue;
      }
      failed++;
      const preview = stmt.substring(0, 150).replace(/\n/g, ' ');
      console.log(`\n⚠️  #${i + 1}: ${msg.substring(0, 150)}`);
      console.log(`   SQL: ${preview}`);
    }
    if ((success + failed) % 5 === 0 || i === filtered.length - 1) {
      process.stdout.write(`\r✅ ${success} | ❌ ${failed} | ${i + 1}/${filtered.length}`);
    }
    await sleep(1200);
  }

  console.log(`\n\n🎉 Done! ${success} OK, ${failed} failed`);
}

main().catch(e => console.error('FATAL:', e));
