const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Check if we can bypass by using RPC or try different endpoints
  // First, let's see what functions exist
  const sql = fs.readFileSync('Documentacion/migrations/001_suit_cotizador.sql', 'utf8');
  
  // Try a different approach - use the pg-meta endpoint via fetch
  const projectRef = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
  
  // Try direct REST endpoint for running SQL
  // Supabase has a /rest/v1/ endpoint that can handle RAW SQL via the "Prefer: params=single-object" header
  // But actually, the real way is to use the PostgREST endpoint
  
  // Let's try to use Supabase's SQL endpoint via the management API
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  
  console.log('Project ref:', projectRef);
  console.log('Management URL:', managementUrl);
  
  // Try with service role key as bearer token
  try {
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apiKey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: 'SELECT 1 AS test' })
    });
    const result = await response.json();
    console.log('Management API response:', JSON.stringify(result).substring(0, 500));
  } catch (e) {
    console.log('Management API failed:', e.message);
  }
  
  // Try pg-meta direct endpoint
  try {
    const pgMetaUrl = `${process.env.SUPABASE_URL}/pg/api/v1/query`;
    console.log('pg-meta URL:', pgMetaUrl);
    const response2 = await fetch(pgMetaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apiKey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: 'SELECT 1 AS test' })
    });
    const result2 = await response2.text();
    console.log('pg-meta response:', result2.substring(0, 500));
  } catch (e) {
    console.log('pg-meta failed:', e.message);
  }

  // Try postgrest raw sql via rest/v1/
  try {
    const restUrl = `${process.env.SUPABASE_URL}/rest/v1/`;
    // PostgREST doesn't support raw SQL queries
    // But Supabase extends it with the "Prefer" header
    console.log('PostgREST URL:', restUrl);
  } catch (e) {
    console.log('PostgREST failed:', e.message);
  }
}

main().catch(e => console.error('FATAL:', e));
