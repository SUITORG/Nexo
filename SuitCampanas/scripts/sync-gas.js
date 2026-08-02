const supabase = require('../lib/supabase');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzlNe28j7yJObxqfCyUg595Zeg1IjsMMjOZyf8KOK5pkCYU-zYFJrsyzwsJhNFjZy1v-A/exec';
const SECRET_TOKEN = "SUITORG_SECURE_TOKEN_2026";

function postToGAS(payload) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(GAS_URL, options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', () => resolve(0));
    req.write(postData);
    req.end();
  });
}

async function syncIndustrias() {
  console.log('🔄 Sincronizando industrias Supabase → GAS...');

  const { data: industrias, error } = await supabase
    .from('industrias')
    .select('*, nichos(*)')
    .order('categoria');

  if (error) {
    console.error(`❌ Error leyendo industrias: ${error.message}`);
    return;
  }

  const statusCode = await postToGAS({
    token: SECRET_TOKEN,
    action: 'sync_industrias',
    industrias
  });

  console.log(`  ${industrias.length} industrias → GAS (${statusCode})`);
}

async function syncCampanas() {
  console.log('🔄 Sincronizando campañas Supabase → GAS...');

  const { data: campanas, error } = await supabase
    .from('campanas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error leyendo Supabase:', error.message);
    return;
  }

  console.log(`  ${campanas.length} campañas leídas de Supabase`);

  for (const c of campanas) {
    const statusCode = await postToGAS({
      token: SECRET_TOKEN,
      caption: c.tema || c.nombre || '',
      mediaUrl: '',
      postDate: c.fecha_creacion || '',
      status: `SupabaseID:${c.id}, Empresa:${c.empresa}, Formato:${c.formato}, Estado:${c.estado}`
    });
    console.log(`  ${statusCode === 200 ? '✅' : '❌'} Campaña ${c.id} → GAS (${statusCode})`);
  }
}

(async () => {
  await syncIndustrias();
  await syncCampanas();
  console.log('✅ Sincronización completada');
})().catch(console.error);
