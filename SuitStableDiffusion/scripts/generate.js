const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SD_CODE_TEMPLATE = (prompt) => `
!pip install -q diffusers transformers accelerate torch

from diffusers import StableDiffusionPipeline
import torch
from IPython.display import display

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to("cuda")

prompt = "${prompt.replace(/"/g, '\\"')}"
image = pipe(prompt).images[0]
display(image)
image.save("output.png")
print("Imagen generada!")
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('\n=== SuitStableDiffusion ===\n');

  rl.question('Escribe tu prompt: ', async (prompt) => {
    if (!prompt.trim()) {
      console.log('Prompt vacío. Saliendo...');
      rl.close();
      return;
    }

    console.log(`\nGenerando: "${prompt}"...\n`);

    const outputDir = path.join(__dirname, 'generated-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://colab.research.google.com');

    console.log('========================================');
    console.log('INICIA SESION EN GOOGLE COLAB AHORA');
    console.log('========================================');
    console.log('Esperare a que hagas login...\n');

    await page.waitForURL('**/colab/**', { timeout: 300000 });
    console.log('Login detectado! Continuando...\n');

    await page.waitForTimeout(3000);

    console.log('Creando notebook nuevo...');
    await page.goto('https://colab.research.google.com/#create=true');
    await page.waitForTimeout(5000);

    console.log('Configurando GPU...');
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
      console.log('GPU configurada!\n');
    } catch (e) {
      console.log('Configura GPU manualmente si es necesario.\n');
    }

    console.log('Escribiendo codigo...');
    const cells = await page.locator('.cell').all();
    if (cells.length > 0) {
      const firstCell = cells[0];
      await firstCell.click();
      await page.waitForTimeout(1000);
      await page.keyboard.type(SD_CODE_TEMPLATE(prompt));
      await page.waitForTimeout(1000);
    }

    console.log('Ejecutando codigo...');
    await page.keyboard.press('Shift+Enter');
    await page.waitForTimeout(90000);

    console.log('\nProceso completado!');
    console.log('La imagen se muestra en la celda de Colab.');
    console.log('Haz clic derecho → "Save image as..." para descargar.\n');

    rl.close();
    await browser.waitForTimeout(3000);
    await browser.close();
  });
}

main().catch(console.error);
