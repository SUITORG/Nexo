// Mock Server para testing local
// Simula la respuesta de Google Apps Script

const http = require('http');
const url = require('url');

const SECRET_TOKEN = "SUITORG_SECURE_TOKEN_2026";

const server = http.createServer((req, res) => {
    // Habilitar CORS para testing local
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);

                // Validar token
                if (!data.token || data.token !== SECRET_TOKEN) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: "error",
                        message: "Token inválido"
                    }));
                    return;
                }

                // Validar caption
                if (!data.caption?.trim()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: "error",
                        message: "Caption es requerido"
                    }));
                    return;
                }

                // Simular éxito
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: "success",
                    message: "Contenido guardado en Google Sheets",
                    id: "mock-uuid-" + Date.now()
                }));

            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: "error",
                    message: error.toString()
                }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "error", message: "Endpoint no encontrado" }));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Mock server corriendo en http://localhost:${PORT}`);
    console.log(`\n📝 Instrucciones para testear:`);
    console.log(`1. Abre test.html en tu navegador`);
    console.log(`2. Cambia la URL a: http://localhost:${PORT}`);
    console.log(`3. Prueba el formulario`);
    console.log(`\n⚠️  Este servidor solo es para pruebas. No escribe en Google Sheets reales.`);
});