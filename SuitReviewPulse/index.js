const express = require('express');
require('dotenv').config();
const { handleImport, handleReport } = require('./handlers/reviews');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3016;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitReviewPulse' });
});

app.post('/api/import', handleImport);
app.get('/api/report/:empresa', handleReport);

if (require.main === module) {
  app.listen(PORT, () => console.log(`SuitReviewPulse en http://localhost:${PORT}`));
}

module.exports = app;
