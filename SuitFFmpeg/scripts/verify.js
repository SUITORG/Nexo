#!/usr/bin/env node
// SuitFFmpeg - Verificador de instalación
// Uso: node scripts/verify.js

const { execSync } = require('child_process');

console.log('[SuitFFmpeg] Verificando instalación...');

try {
  const version = execSync('ffmpeg -version', { encoding: 'utf8', timeout: 5000 });
  const firstLine = version.split('\n')[0];
  console.log('[OK] FFmpeg encontrado:', firstLine);
  
  // Check for required codecs
  const codecs = execSync('ffmpeg -codecs 2>&1', { encoding: 'utf8', timeout: 5000 });
  const hasH264 = codecs.includes('libx264');
  const hasAac = codecs.includes('aac');
  
  console.log('[OK] libx264:', hasH264 ? 'YES' : 'NO (needed for video encoding)');
  console.log('[OK] aac:', hasAac ? 'YES' : 'NO (needed for audio encoding)');
  
  if (hasH264 && hasAac) {
    console.log('\n✅ SuitFFmpeg está listo para uso en SuitCampanas');
  } else {
    console.log('\n⚠️ Faltan codecs. Reinstalar con: winget install Gyan.FFmpeg');
  }
} catch (e) {
  console.error('[ERROR] FFmpeg no encontrado:', e.message);
  console.error('Instalar con: winget install Gyan.FFmpeg');
  process.exit(1);
}
