const { runPy, todayJson } = require('../db/client');

async function handleToday(req, res) {
  try { res.json(await todayJson()); }
  catch (e) { res.status(500).json({ error: e.message }); }
}

async function handlePetAdd(req, res) {
  const { nombre, raza, dueno_tel, vacunas_notas } = req.body || {};
  if (!nombre || !dueno_tel) return res.status(400).json({ error: 'nombre y dueno_tel requeridos' });
  try {
    const out = await runPy(['main.py', 'pet-add', nombre, raza || '', dueno_tel, vacunas_notas || '']);
    res.json({ ok: true, detalle: out.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function handleBookAdd(req, res) {
  const { pet_id, fecha, hora, servicio, precio, deposito_pct } = req.body || {};
  if (!pet_id || !fecha || !hora || !servicio) return res.status(400).json({ error: 'pet_id, fecha, hora, servicio requeridos' });
  try {
    const args = ['main.py', 'book-add', String(pet_id), fecha, hora, servicio, String(precio || 0)];
    if (deposito_pct != null) args.push(String(deposito_pct));
    const out = await runPy(args);
    res.json({ ok: true, detalle: out.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function handleCancel(req, res) {
  try {
    const out = await runPy(['main.py', 'cancel', String(req.params.id)]);
    res.json({ ok: out.includes('OK'), detalle: out.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

module.exports = { handleToday, handlePetAdd, handleBookAdd, handleCancel };
