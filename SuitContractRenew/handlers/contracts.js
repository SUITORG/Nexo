const { addContract, dueContracts } = require('../db/client');

async function handleAdd(req, res) {
  const { cliente, renovacion, precio_mensual, tipo } = req.body;
  if (!cliente || !renovacion)
    return res.status(400).json({ error: 'cliente and renovacion (YYYY-MM-DD) required' });
  try {
    const out = await addContract({ cliente, renovacion, precio_mensual, tipo });
    res.json({ ok: true, detalle: out.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function handleDue(req, res) {
  const dias = parseInt(req.params.dias, 10) || 60;
  try {
    res.json(await dueContracts(dias));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { handleAdd, handleDue };
