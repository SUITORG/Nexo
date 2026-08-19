const fs = require('fs');
const path = require('path');

// Read the file
const content = fs.readFileSync(path.join(__dirname, 'qr-clean.txt'), 'utf8');

// Extract QR code lines (lines that start with █ or ▄)
const lines = content.split('\n');
let qrLines = [];
let inQR = false;

for (const line of lines) {
  if (line.includes('QR code generated')) {
    inQR = true;
    continue;
  }
  if (line.includes('Starting MCP server')) {
    inQR = false;
    continue;
  }
  if (inQR && (line.includes('█') || line.includes('▄'))) {
    // Remove ANSI color codes and keep only the QR characters
    const cleanLine = line
      .replace(/\[[\d;]*m/g, '')
      .replace(/\u001b/g, '')
      .replace(/^\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}:\d{4}\s+\[32minfo\[39m:\s+/, '')
      .trim();
    if (cleanLine) {
      qrLines.push(cleanLine);
    }
  }
}

// Save clean QR code
const cleanQR = qrLines.join('\n');
fs.writeFileSync(path.join(__dirname, 'whatsapp-qr.txt'), cleanQR, 'utf8');
console.log('Clean QR code saved to whatsapp-qr.txt');
console.log('\n' + cleanQR);