const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SD_CODE = `
!pip install -q diffusers transformers accelerate torch
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to("cuda")

prompt = "a beautiful sunset over mountains, digital art"
image = pipe(prompt).images[0]
image.save("output.png")
image
`;

async function main() {
  const prompt = process.argv[2] || "a beautiful sunset over mountains, digital art";
  const outputDir = path.join(__dirname, '..', 'generated-images');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Opening Google Colab...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://colab.research.google.com');

  console.log('\n========================================');
  console.log('INICIA SESION EN GOOGLE COLAB AHORA');
  console.log('========================================');
  console.log('Esperare a que hagas login...');
  console.log('');

  await page.waitForURL('**/colab/**', { timeout: 300000 });
  console.log('Login detectado! Continuando...\n');

  await page.waitForTimeout(3000);

  console.log('Creando notebook nuevo...');
  await page.goto('https://colab.research.google.com/#create=true');

  await page.waitForTimeout(5000);

  console.log('Configurando GPU T4...');
  try {
    await page.click('text=Runtime');
    await page.waitForTimeout(1000);
    await page.click('text=Change runtime type');
    await page.waitForTimeout(2000);

    const gpuOption = page.locator('text=T4 GPU').first();
    if (await gpuOption.isVisible()) {
      await gpuOption.click();
    }
    await page.click('text=Save');
    await page.waitForTimeout(3000);
    console.log('GPU T4 configurada!\n');
  } catch (e) {
    console.log('No se pudo configurar GPU automaticamente. Configurala manualmente.');
  }

  console.log('Escribiendo codigo de Stable Diffusion...');
  const cells = await page.locator('.cell').all();
  if (cells.length > 0) {
    const firstCell = cells[0];
    await firstCell.click();
    await page.waitForTimeout(1000);

    await page.keyboard.type(SD_CODE.replace('prompt = "a beautiful sunset over mountains, digital art"', `prompt = "${prompt}"`));
    await page.waitForTimeout(1000);
  }

  console.log('Ejecutando codigo...');
  await page.keyboard.press('Shift+Enter');
  await page.waitForTimeout(60000);

  console.log('Descargando imagen generada...');
  try {
    await page.waitForSelector('img[src*="output"]', { timeout: 120000 });
    const img = await page.locator('img[src*="output"]').first();
    const src = await img.getAttribute('src');

    if (src) {
      const imgResponse = await page.request.get(src);
      const imgBuffer = await imgResponse.body();
      const outputPath = path.join(outputDir, `sd_${Date.now()}.png`);
      fs.writeFileSync(outputPath, imgBuffer);
      console.log(`\nImagen guardada en: ${outputPath}`);
    }
  } catch (e) {
    console.log('No se pudo descargar automaticamente. Descarga manualmente desde Colab.');
  }

  console.log('\nProceso completado!');
  await browser.waitForTimeout(5000);
  await browser.close();
}

main().catch(console.error);
