const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const https = require('https');

const FOLDER_ID = '1TmHfohiIahyJUyLLRjuxgskwdNpsmZAJ';
const MEDIA_FOLDER = path.join(__dirname, '..', 'media');
const CREDS_PATH = path.join(__dirname, '..', '..', 'suitorg00-bf9dc6dcb6ca.json');

async function main() {
    if (!fs.existsSync(MEDIA_FOLDER)) fs.mkdirSync(MEDIA_FOLDER, { recursive: true });

    const auth = new google.auth.GoogleAuth({
        keyFile: CREDS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Listando archivos en la carpeta...');
    const res = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
        fields: 'files(id, name, mimeType, size)',
        pageSize: 100
    });

    const files = res.data.files;
    if (!files || files.length === 0) {
        console.log('❌ No se encontraron archivos de imagen/video en la carpeta.');
        return;
    }

    console.log(`📁 Encontrados ${files.length} archivos:`);
    for (const file of files) {
        console.log(`  - ${file.name} (${file.mimeType}, ${file.size} bytes)`);
    }

    let downloaded = 0;
    for (const file of files) {
        const ext = path.extname(file.name).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mpg', '.avi', '.mov'].includes(ext)) {
            console.log(`  ⏭️ Saltando ${file.name} (formato no soportado)`);
            continue;
        }

        const destPath = path.join(MEDIA_FOLDER, file.name);
        if (fs.existsSync(destPath)) {
            console.log(`  ⏭️ Ya existe: ${file.name}`);
            downloaded++;
            continue;
        }

        try {
            const dest = fs.createWriteStream(destPath);
            const res = await drive.files.get(
                { fileId: file.id, alt: 'media' },
                { responseType: 'stream' }
            );
            await new Promise((resolve, reject) => {
                res.data.pipe(dest);
                dest.on('finish', resolve);
                dest.on('error', reject);
            });
            console.log(`  ✅ Descargado: ${file.name}`);
            downloaded++;
        } catch (err) {
            console.log(`  ❌ Error descargando ${file.name}: ${err.message}`);
        }
    }

    console.log(`\n🎉 ${downloaded}/${files.length} archivos en ${MEDIA_FOLDER}`);
}

main().catch(err => console.error('Error:', err.message));
