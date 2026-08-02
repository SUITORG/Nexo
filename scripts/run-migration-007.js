const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const REF = process.env.SUPABASE_URL.split('//')[1].split('.')[0];

const sql = fs.readFileSync(__dirname + '/../Documentacion/migrations/007_planes_medios.sql', 'utf8');

async function main() {
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql })
    });
    const txt = await res.text();
    console.log('HTTP', res.status);
    console.log(txt.slice(0, 2000));
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
