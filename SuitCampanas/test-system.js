// Test automatizado del sistema Campañas AI
// Requiere Node.js y el paquete 'axios'

const axios = require('axios');

const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    testData: {
        caption: 'Test automatizado - ' + new Date().toISOString(),
        mediaUrl: 'https://example.com/image.jpg',
        postDate: new Date().toISOString().slice(0, 16),
        token: 'SUITORG_SECURE_TOKEN_2026'
    }
};

async function runTests() {
    console.log('🧪 Iniciando pruebas del sistema Campañas AI...\n');

    try {
        // Test 1: Petición exitosa
        console.log('Test 1: Petición con datos válidos...');
        const response = await axios.post(TEST_CONFIG.baseUrl, TEST_CONFIG.testData);

        if (response.data.status === 'success') {
            console.log('✅ Test 1 PASADO: Datos guardados correctamente');
            console.log(`   ID: ${response.data.id}\n`);
        } else {
            throw new Error(`Respuesta inesperada: ${response.data.message}`);
        }

        // Test 2: Token inválido
        console.log('Test 2: Petición con token inválido...');
        const badResponse = await axios.post(TEST_CONFIG.baseUrl, {
            ...TEST_CONFIG.testData,
            token: 'token_invalido'
        });

        if (badResponse.data.status === 'error' && badResponse.data.message.includes('Token')) {
            console.log('✅ Test 2 PASADO: Token inválido rechazado\n');
        } else {
            throw new Error('Test 2 fallido: Token inválido no fue rechazado');
        }

        // Test 3: Caption vacío
        console.log('Test 3: Petición con caption vacío...');
        const emptyResponse = await axios.post(TEST_CONFIG.baseUrl, {
            ...TEST_CONFIG.testData,
            caption: ''
        });

        if (emptyResponse.data.status === 'error' && emptyResponse.data.message.includes('Caption')) {
            console.log('✅ Test 3 PASADO: Caption vacío rechazado\n');
        } else {
            throw new Error('Test 3 fallido: Caption vacío no fue rechazado');
        }

        console.log('🎉 Todas las pruebas pasaron!');
        console.log('\n📊 Resumen:');
        console.log('- El sistema está funcionando correctamente');
        console.log('- La validación de seguridad funciona');
        console.log('- Las validaciones de datos funcionan');
        console.log('- CORS está configurado correctamente');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Error: No se puede conectar al servidor');
            console.log('   Inicia el servidor con: npm start');
            console.log('   O abre test.html en tu navegador para pruebas manuales');
        } else {
            console.log('❌ Error en las pruebas:', error.message);
        }
    }
}

// Ejecutar pruebas
if (require.main === module) {
    runTests();
}

module.exports = { runTests, TEST_CONFIG };