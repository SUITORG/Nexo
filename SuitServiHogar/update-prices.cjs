require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://egyxgnlnzanxpqyuvmsg.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) { console.error('Falta SUPABASE_SERVICE_ROLE_KEY en SuitServiHogar/.env'); process.exit(1); }

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Ejecutando actualización de precios...');
  
  const sql = `
    UPDATE public.sh_service_categories 
    SET base_price_mxn = CASE id
      WHEN 'plomeria'       THEN 650
      WHEN 'electricidad'   THEN 720
      WHEN 'pintura'        THEN 420
      WHEN 'limpieza'       THEN 380
      WHEN 'hvac'           THEN 8500
      WHEN 'jardineria'     THEN 550
      WHEN 'gasfiteria'     THEN 1200
      WHEN 'albanileria'    THEN 2500
      WHEN 'cerrajeria'     THEN 850
      WHEN 'carpinteria'    THEN 1200
      WHEN 'techos'         THEN 3500
      WHEN 'fumigacion'     THEN 800
      WHEN 'mudanzas'       THEN 2500
      ELSE base_price_mxn
    END
    WHERE id IN (
      'plomeria','electricidad','pintura','limpieza','hvac',
      'jardineria','gasfiteria','albanileria','cerrajeria',
      'carpinteria','techos','fumigacion','mudanzas'
    );
  `;

  const { error } = await supabase.rpc('exec_sql', { query: sql });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Actualización completada');
  }

  const { data, error: err2 } = await supabase
    .from('sh_service_categories')
    .select('id, name, base_price_mxn')
    .order('name');

  if (err2) {
    console.error('Error verificando:', err2);
  } else {
    console.log('\nPrecios actualizados:');
    console.table(data);
  }
}

run().catch(console.error);