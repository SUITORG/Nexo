const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Brief generator (SuitOrg) — mount FIRST
console.log('[SERVER] Loading Brief Generator...');
app.use(require('./scripts/brief-generate'));
console.log('[SERVER] Brief Generator mounted');

// Montar submódulos
console.log('[SERVER] Loading SuitAI...');
const suitAiApp = require('./SuitAI/index');
console.log('[SERVER] SuitAI loaded, mounting...');
app.use(suitAiApp);
console.log('[SERVER] SuitAI mounted');

console.log('[SERVER] Loading Citas...');
const citasApp = require('./citas/index');
console.log('[SERVER] Citas loaded, mounting...');
app.use(citasApp);
console.log('[SERVER] Citas mounted');

console.log('[SERVER] Loading SuitReservaciones...');
const reservacionesApp = require('./SuitReservaciones/index');
console.log('[SERVER] SuitReservaciones loaded, mounting...');
app.use(reservacionesApp);
console.log('[SERVER] SuitReservaciones mounted');

console.log('[SERVER] Loading SuitPedidoExpress...');
const pedidoExpressApp = require('./SuitPedidoExpress/index');
console.log('[SERVER] SuitPedidoExpress loaded, mounting...');
app.use(pedidoExpressApp);
console.log('[SERVER] SuitPedidoExpress mounted');

console.log('[SERVER] Loading SuitPos...');
const posApp = require('./SuitPos/index');
console.log('[SERVER] SuitPos loaded, mounting...');
app.use(posApp);
console.log('[SERVER] SuitPos mounted');

console.log('[SERVER] Loading SuitProductos...');
const productosApp = require('./SuitProductos/index');
console.log('[SERVER] SuitProductos loaded, mounting...');
app.use(productosApp);
console.log('[SERVER] SuitProductos mounted');

console.log('[SERVER] Loading SuitInventarios...');
const inventariosApp = require('./SuitInventarios/index');
console.log('[SERVER] SuitInventarios loaded, mounting...');
app.use(inventariosApp);
console.log('[SERVER] SuitInventarios mounted');

console.log('[SERVER] Loading SuitBodega...');
const bodegaApp = require('./SuitBodega/index');
console.log('[SERVER] SuitBodega loaded, mounting...');
app.use(bodegaApp);
console.log('[SERVER] SuitBodega mounted');

console.log('[SERVER] Loading SuitMistral...');
const mistralApp = require('./SuitMistral/index');
console.log('[SERVER] SuitMistral loaded, mounting...');
app.use(mistralApp);
console.log('[SERVER] SuitMistral mounted');

// Debug: list all registered routes
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log('[ROUTE]', Object.keys(middleware.route.methods).join(','), middleware.route.path);
    } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                console.log('[ROUTE]', Object.keys(handler.route.methods).join(','), handler.route.path);
            }
        });
    }
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] listen callback fired, server.address() =`, server.address());
    console.log(`[SERVER] server.listening =`, server.listening);
    console.log(`
🚀 SUITORG SECURE SERVER RUNNING
-------------------------------
URL: http://localhost:${PORT}
Status: Protected (AI Proxy & DB Admin Proxy Active)
-------------------------------
    `);
    
    setInterval(() => {
        console.log(`[SERVER] heartbeat: listening=${server.listening}, address=${JSON.stringify(server.address())}`);
    }, 10000);
});

server.on('error', (err) => {
    console.error('❌ [SERVER_ERROR]', err);
});

server.on('close', () => {
    console.error('❌ [SERVER_CLOSED] Server socket closed');
});