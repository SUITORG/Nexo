const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// For SPA routing, redirect all other requests to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
🚀 SUITORG LOCAL SERVER RUNNING
-------------------------------
URL: http://localhost:${PORT}
Directory: ${__dirname}
Version: 5.7.1 (Stable Sync)
-------------------------------
Presiona Ctrl+C para detener.
    `);
});
