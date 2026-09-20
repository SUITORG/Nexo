#!/usr/bin/env node
/**
 * migrate-supabase-to-neon.js
 * Reads all tables from Supabase and inserts into Neon Postgres.
 * 
 * Usage:
 *   node scripts/migrate-supabase-to-neon.js [--dry-run]
 * 
 * Requires env vars:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_KEY=eyJ...
 *   NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/suitorg?sslmode=require
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://egyxgnlnzanxpqyuvmsg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const NEON_URL = process.env.NEON_DATABASE_URL;
const DRY_RUN = process.argv.includes('--dry-run');

// All private tables to migrate (MASTER tables stay in Google Sheets)
// PostgreSQL folds unquoted identifiers to lowercase, so use lowercase here
const TABLES = [
  'lead', 'clientes', 'negocios',
  'cuenta', 'contacto', 'proyecto', 'material', 'servicio', 'manodeobra', 'concepto', 'plantilla',
  'producto', 'inventario', 'bodega', 'movimientoinventario',
  'negociopdv', 'terminal', 'turno', 'orden', 'ordenitem', 'pago',
  'reservacion', 'cita',
  'campana', 'contactocampana',
  'serviciodom',
  'sesionchat', 'mensajechat', 'tareaai',
  'videoproject'
];

// Maps Supabase table names to Neon table names (snake_case vs PascalCase)
const TABLE_MAP = {
  // Supabase uses snake_case, Neon schema uses PascalCase
  // Most should match, but some need mapping
};

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

async function main() {
  if (!SUPABASE_KEY) {
    console.error('Missing SUPABASE_KEY env var');
    process.exit(1);
  }
  if (!NEON_URL) {
    console.error('Missing NEON_DATABASE_URL env var');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const neon = new Client({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });

  console.log('Connecting to Neon...');
  await neon.connect();

  let totalRows = 0;
  const results = [];

  for (const table of TABLES) {
    const neonTable = TABLE_MAP[table] || table;
    console.log(`\nMigrating: ${table} → ${neonTable}`);

    // Fetch from Supabase (paginated, 1000 at a time)
    let from = 0;
    const pageSize = 1000;
    let rows = [];
    let batch;

    do {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) {
        console.error(`  ⚠ Error reading ${table}:`, error.message);
        break;
      }
      batch = data || [];
      rows = rows.concat(batch);
      from += pageSize;
    } while (batch.length === pageSize);

    if (rows.length === 0) {
      console.log(`  (empty)`);
      results.push({ table, rows: 0, status: 'empty' });
      continue;
    }

    console.log(`  Found ${rows.length} rows`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert ${rows.length} rows`);
      results.push({ table, rows: rows.length, status: 'dry-run' });
      continue;
    }

    // Get column names from first row
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = columns.map(c => `"${c}"`).join(', ');

    // Upsert in batches of 100
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      for (const row of chunk) {
        const values = columns.map(c => row[c]);
        try {
          await neon.query(
            `INSERT INTO "${neonTable}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (err) {
          console.error(`  ⚠ Insert error on ${table}:`, err.message);
        }
      }
    }

    console.log(`  ✓ Inserted ${inserted}/${rows.length}`);
    totalRows += inserted;
    results.push({ table, rows: inserted, status: 'ok' });
  }

  console.log('\n========== MIGRATION SUMMARY ==========');
  console.log(`Total rows migrated: ${totalRows}`);
  for (const r of results) {
    console.log(`  ${r.table}: ${r.rows} rows [${r.status}]`);
  }

  await neon.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
