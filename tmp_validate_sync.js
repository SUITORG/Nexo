const { chromium } = require('playwright');

(async () => {
    console.log("🔍 Iniciando navegador de pruebas...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Capturar logs de consola
    page.on('console', msg => {
        if (msg.text().includes('BACKEND_SYNC')) {
            console.log(`📊 [LOG_NATIVO]: ${msg.text()}`);
        } else if (msg.text().includes('DIAGNOSTICO')) {
            console.error(`❌ [ERROR_NATIVO]: ${msg.text()}`);
        } else {
            console.log(`> ${msg.text()}`);
        }
    });

    try {
        console.log("📡 Navegando a http://localhost:3000...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Esperar un momento para que se procese la carga de datos
        await page.waitForTimeout(5000);
        
        // Extraer el estado de app.data.backend_log
        const backendLog = await page.evaluate(() => {
            return window.app && window.app.data ? window.app.data.backend_log : "DATA_NOT_FOUND";
        });

        console.log("\n--- RESULTADO DE LA AUDITORÍA ---");
        console.log(JSON.stringify(backendLog, null, 2));
        console.log("---------------------------------\n");

    } catch (e) {
        console.error("❌ Error de conexión:", e.message);
    } finally {
        await browser.close();
        console.log("🏁 Validación finalizada.");
    }
})();
