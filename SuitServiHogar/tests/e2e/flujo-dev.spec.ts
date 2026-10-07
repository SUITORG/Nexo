// tests/e2e/flujo-dev.spec.ts
// Modo prueba local: cliente solicita y paga (mock) -> tecnico completa y
// libera fondos con PIN -> admin abre su panel. Sin servicios reales de pago
// (mockStripe) ni de tipo de cambio (mockExchangeRate + abort a fixer).

import { test, expect, Page } from '@playwright/test';

type Role = 'client' | 'technician' | 'admin';

const DEV_PARAMS = 'devMode=true&devMockStripe=true&devMockExchangeRate=true';

async function openAs(page: Page, role: Role) {
  await page.addInitScript(() => {
    localStorage.setItem('devMode', 'true');
    localStorage.setItem('devMockStripe', 'true');
    localStorage.setItem('devMockExchangeRate', 'true');
  });
  await page.route(/data\.fixer\.io/, (route) => route.abort());

  const loginWait = page.waitForEvent('console', {
    predicate: (m) => m.text().includes('Sesión real iniciada') || m.text().includes('Login real no disponible'),
    timeout: 45000,
  });
  await page.goto(`/?${DEV_PARAMS}&devAutoLogin=${role}`);
  const msg = await loginWait;
  expect(msg.text(), `auto-login QA (${role})`).toContain('Sesión real iniciada');
  await expect(page.getByTestId('modo-prueba-badge')).toBeVisible();
  await expect(page.getByText('Solicitar un Servicio de Confianza')).toBeVisible({ timeout: 20000 });
}

test('flujo dev completo: cliente paga (mock) -> tecnico libera -> admin ve panel', async ({ browser }) => {
  test.setTimeout(240000);

  // ── 1) Cliente: solicita y paga en mock ──
  const clientCtx = await browser.newContext();
  const client = await clientCtx.newPage();
  await openAs(client, 'client');

  await client.getByRole('button', { name: 'Solicitar un Servicio de Confianza' }).click();
  const techCard = client.locator('div.space-y-3\\.5 > div').filter({ hasText: 'Roberto Garza' }).first();
  await expect(techCard).toBeVisible({ timeout: 15000 });
  await techCard.getByRole('button', { name: 'Contratar Garantía' }).click();

  await expect(client.getByText('Solicitud de Servicio y Custodia Escrow')).toBeVisible({ timeout: 15000 });
  await client.getByPlaceholder('Ej: Av. Monterrey, Blvd. Hidalgo').fill('Blvd. Chapultepec');
  await client.getByPlaceholder('Ej: 1245').fill('1200');
  await client.waitForSelector('iframe[name*="__privateStripeFrame"]', { timeout: 20000 });
  await client.getByRole('button', { name: /Pagar \$/ }).click();

  await expect(client.getByText('¡Custodia Escrow Activada!')).toBeVisible({ timeout: 20000 });
  const orderId = (await client
    .locator('span.font-mono')
    .filter({ hasText: /^ORD-/ })
    .first()
    .textContent())?.trim() ?? '';
  expect(orderId, 'la orden creada debe existir en BD con id ORD-*').toMatch(/^ORD-/);
  await client.getByRole('button', { name: 'Regresar al Inicio' }).click();
  await clientCtx.close();

  const ref = orderId.slice(-6);

  // ── 2) Tecnico: inicia ruta -> completa -> libera con PIN ──
  const techCtx = await browser.newContext();
  const tech = await techCtx.newPage();
  await openAs(tech, 'technician');
  await tech.locator('nav').filter({ hasText: 'Inicio' }).getByRole('button', { name: 'Perfil' }).click();
  await expect(tech.getByText('Mis Órdenes de Servicio')).toBeVisible({ timeout: 15000 });
  await tech.getByRole('button', { name: 'Ver Mis Órdenes' }).click();
  await expect(tech.getByText('Activas (')).toBeVisible({ timeout: 15000 });

  const refSpan = tech.getByText(`#${ref}`, { exact: true });
  await expect(refSpan).toBeVisible({ timeout: 20000 });
  const orderCard = refSpan.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');

  await expect(orderCard.getByText('Pagada (Escrow)')).toBeVisible({ timeout: 15000 });
  await orderCard.getByRole('button', { name: 'Iniciar ruta' }).click();
  await expect(orderCard.getByText('En ruta / Trabajando')).toBeVisible({ timeout: 15000 });
  await orderCard.getByRole('button', { name: 'Marcar completado' }).click();
  await expect(orderCard.getByText('Completado (esperando PIN)')).toBeVisible({ timeout: 15000 });
  await orderCard.getByRole('button', { name: 'Finalizar (PIN cliente)' }).click();
  await expect(tech.getByText('Confirmar liberación')).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await tech.locator('input[type="password"]').nth(i).fill('8821');
  }
  await tech.getByRole('button', { name: 'Liberar fondos' }).click();
  await expect(tech.getByText('Confirmar liberación')).toBeHidden({ timeout: 20000 });

  await tech.getByRole('button', { name: 'Historial' }).click();
  await expect(orderCard.getByText('Liberado / Pagado')).toBeVisible({ timeout: 15000 });
  await techCtx.close();

  // ── 3) Admin: abre su panel ──
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await openAs(admin, 'admin');
  await admin.locator('nav').filter({ hasText: 'Inicio' }).getByRole('button', { name: 'Perfil' }).click();
  await expect(admin.getByRole('button', { name: 'Panel de Administración' })).toBeVisible({ timeout: 15000 });
  await admin.getByRole('button', { name: 'Panel de Administración' }).click();
  await expect(admin.getByRole('heading', { name: 'Admin Panel' })).toBeVisible({ timeout: 15000 });
  await adminCtx.close();
});
