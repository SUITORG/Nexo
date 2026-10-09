// tests/e2e/login-telefono.spec.ts
// Login teléfono+contraseña: registro crea cuenta en Supabase y deja reservar;
// en una sesión aparte, login con las mismas credenciales funciona.

import { test, expect, Page } from '@playwright/test';

const DEV_PARAMS = 'devMode=true&devMockStripe=true&devMockExchangeRate=true';

async function gotoLoginFromBooking(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('devMode', 'true');
    localStorage.setItem('devMockStripe', 'true');
    localStorage.setItem('devMockExchangeRate', 'true');
  });
  await page.goto(`/?${DEV_PARAMS}`);
  await expect(page.getByText('Solicitar un Servicio de Confianza')).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Solicitar un Servicio de Confianza' }).click();
  const techCard = page.locator('div.space-y-3\\.5 > div').filter({ hasText: 'Roberto Garza' }).first();
  await expect(techCard).toBeVisible({ timeout: 15000 });
  await techCard.getByRole('button', { name: 'Contratar Garantía' }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible({ timeout: 15000 });
}

async function acceptLegal(page: Page) {
  const legal = page.getByRole('checkbox');
  if (!(await legal.isChecked())) await legal.click({ force: true });
}

test('registro y login con teléfono (misma contraseña)', async ({ browser }) => {
  test.setTimeout(180000);
  const phone = '55' + Date.now().toString().slice(-8);
  const password = 'E2ePassw0rd';

  // ── 1) Registro desde la pantalla de login ──
  const regCtx = await browser.newContext();
  const reg = await regCtx.newPage();
  await gotoLoginFromBooking(reg);
  await reg.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await reg.getByLabel('Nombre').fill('QA Teléfono');
  await reg.getByPlaceholder('899 123 4567').fill(phone);
  await reg.getByPlaceholder('10+ caracteres, letras y números').fill(password);
  await reg.getByPlaceholder('Misma contraseña').fill(password);
  await acceptLegal(reg);
  await reg.getByRole('button', { name: 'Crear cuenta y entrar' }).click();
  await expect(reg.getByText('Solicitud de Servicio y Custodia Escrow')).toBeVisible({ timeout: 30000 });
  await regCtx.close();

  // ── 2) Login con las mismas credenciales en sesión aparte ──
  const loginCtx = await browser.newContext();
  const login = await loginCtx.newPage();
  await gotoLoginFromBooking(login);
  await login.getByPlaceholder('899 123 4567').fill(phone);
  await login.getByPlaceholder('10+ caracteres, letras y números').fill(password);
  await acceptLegal(login);
  await login.getByRole('button', { name: 'Entrar con teléfono' }).click();
  await expect(login.getByText('Solicitud de Servicio y Custodia Escrow')).toBeVisible({ timeout: 30000 });
  await loginCtx.close();
});

test('login con contraseña incorrecta muestra error genérico', async ({ browser }) => {
  test.setTimeout(120000);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await gotoLoginFromBooking(page);
  await page.getByPlaceholder('899 123 4567').fill('5511112222');
  await page.getByPlaceholder('10+ caracteres, letras y números').fill('WrongPass99');
  await acceptLegal(page);
  await page.getByRole('button', { name: 'Entrar con teléfono' }).click();
  await expect(page.getByRole('alert').getByText('Teléfono o contraseña incorrectos')).toBeVisible({ timeout: 20000 });
  await ctx.close();
});
