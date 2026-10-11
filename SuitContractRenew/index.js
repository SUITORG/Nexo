const express = require('express');
require('dotenv').config();
const { handleAdd, handleDue } = require('./handlers/contracts');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3017;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitContractRenew' });
});

app.post('/api/contracts', handleAdd);
app.get('/api/contracts/due/:dias?', handleDue);

if (require.main === module) {
  app.listen(PORT, () => console.log(`SuitContractRenew en http://localhost:${PORT}`));
}

module.exports = app;
