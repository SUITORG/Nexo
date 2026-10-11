const { importRows, report } = require('../db/client');

async function handleImport(req, res) {
  const { empresa, reviews } = req.body;
  if (!empresa || !Array.isArray(reviews) || reviews.length === 0)
    return res.status(400).json({ error: 'empresa and reviews[] required' });
  try {
    await importRows(empresa, reviews);
    res.json({ ok: true, imported: reviews.length, empresa });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function handleReport(req, res) {
  const { empresa } = req.params;
  if (!empresa) return res.status(400).json({ error: 'empresa required' });
  try {
    res.json(await report(empresa));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { handleImport, handleReport };
