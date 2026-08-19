# SuitStableDiffusion

Generación de imágenes con Stable Diffusion vía Google Colab.

## Uso Rápido

### Windows
Doble clic en `generate.bat` o ejecuta:
```bash
generate.bat
```

### Terminal
```bash
cd SuitStableDiffusion
npm run generate
```

### Flujo
1. Se abre Chrome con Google Colab
2. **Tú haces login** con tu cuenta de Google
3. Escribes tu prompt
4. El script genera la imagen automáticamente

## Archivos
- `generate.bat` - Ejecutable rápido
- `scripts/generate.js` - Script principal
- `scripts/colab-sd.js` - Script alternativo con prompt por defecto
- `generated-images/` - Imágenes generadas
