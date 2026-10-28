// tests/e2e/ajuste-insitu.spec.ts
// Req #44 — Re-cotización / Ajuste in-situ (Opción A sobre sh_price_negotiations):
// cliente paga (mock) → técnico pasa a in_progress y re-cotiza →
// cliente aprueba (cobro mock) con desglose o rechaza. Verifica además el
// reflejo en el total de la orden y el chip en la vista del técnico.
//
// Una sola prueba con 2 rondas secuenciales: la identidad QA del cliente es
// única, así que dos tests en paralelo se pisarían el banner (pendingEntry es
// de un solo ajuste a la vez). Ronda 2 empieza con la ronda 1 ya resuelta.

import { test, expect, Page } from '@playwright/test';

type Role = 'client' | 'technician';

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

// Cliente solicita y paga con mock; devuelve el id ORD-* creado
async function bookAndPay(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Solicitar un Servicio de Confianza' }).click();
  const techCard = page.locator('div.space-y-3\\.5 > div').filter({ hasText: 'Roberto Garza' }).first();
  await expect(techCard).toBeVisible({ timeout: 15000 });
  await techCard.getByRole('button', { name: 'Contratar Garantía' }).click();

  await expect(page.getByText('Solicitud de Servicio y Custodia Escrow')).toBeVisible({ timeout: 15000 });
  await page.getByPlaceholder('Ej: Av. Monterrey, Blvd. Hidalgo').fill('Blvd. Chapultepec');
  await page.getByPlaceholder('Ej: 1245').fill('1200');
  await page.waitForSelector('iframe[name*="__privateStripeFrame"]', { timeout: 20000 });
  await page.getByRole('button', { name: /Pagar \$/ }).click();

  await expect(page.getByText('¡Custodia Escrow Activada!')).toBeVisible({ timeout: 20000 });
  const orderId = (await page
    .locator('span.font-mono')
    .filter({ hasText: /^ORD-/ })
    .first()
    .textContent())?.trim() ?? '';
  expect(orderId).toMatch(/^ORD-/);
  await page.getByRole('button', { name: 'Regresar al Inicio' }).click();
  return orderId;
}

// Técnico: fundada → in_progress → envía re-cotización
async function techRequestAdjustment(page: Page, ref: string, amount: string, reason: string) {
  await page.locator('nav').filter({ hasText: 'Inicio' }).getByRole('button', { name: 'Perfil' }).click();
  await page.getByRole('button', { name: 'Ver Mis Órdenes' }).click();
  await expect(page.getByText('Activas (')).toBeVisible({ timeout: 15000 });

  const refSpan = page.getByText(`#${ref}`, { exact: true });
  await expect(refSpan).toBeVisible({ timeout: 20000 });
  const orderCard = refSpan.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');

  await orderCard.getByRole('button', { name: 'Iniciar ruta' }).click();
  await expect(orderCard.getByText('En ruta / Trabajando')).toBeVisible({ timeout: 15000 });
  await orderCard.getByRole('button', { name: 'Re-cotizar' }).click();

  await expect(page.getByRole('heading', { name: 'Re-cotizar servicio' })).toBeVisible();
  await page.getByPlaceholder('Ej: 300').fill(amount);
  await page.getByPlaceholder(/Se encontró tubería/).fill(reason);
  await page.getByRole('button', { name: 'Enviar re-cotización' }).click();

  await expect(page.getByText(`⏳ Ajuste enviado — esperando cliente (+$${amount} MXN)`)).toBeVisible({ timeout: 15000 });
}

// Tarjeta de una orden específica (scoped asserts: la identidad QA acumula
// órdenes de corridas previas con textos idénticos → strict mode)
function orderCard(page: Page, ref: string) {
  return page
    .getByText(`#${ref}`, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
}

// Cliente abre Mis Órdenes y espera el banner con el ref de su orden
async function openClientBanner(page: Page, ref: string) {
  await page.locator('nav').filter({ hasText: 'Inicio' }).getByRole('button', { name: 'Mis Órdenes' }).click();
  await expect(page.getByText('Mis Órdenes de Servicio')).toBeVisible({ timeout: 15000 });
  const heading = page.getByRole('heading', { name: 'Aprobación de Ajuste de Precio' });
  await expect(heading).toBeVisible({ timeout: 20000 });
  // el banner corresponde a ESTA orden (subtítulo "servicio · #ref"; la identidad QA es única)
  await expect(page.getByText(`· #${ref}`)).toBeVisible();
}

test('ajuste in-situ: técnico re-cotiza → aprueba (mock) con desglose y también rechaza', async ({ browser }) => {
  test.setTimeout(300000);

  // ═══ Ronda 1: aprobar (mock) ═══
  const clientCtx = await browser.newContext();
  const client = await clientCtx.newPage();
  await openAs(client, 'client');
  const orderId1 = await bookAndPay(client);
  await clientCtx.close();
  const ref1 = orderId1.slice(-6);

  const techCtx = await browser.newContext();
  const tech = await techCtx.newPage();
  await openAs(tech, 'technician');
  await techRequestAdjustment(tech, ref1, '300', 'Tubería dañada adicional bajo el fregadero');

  const clientCtx1b = await browser.newContext();
  const client1b = await clientCtx1b.newPage();
  await openAs(client1b, 'client');
  await openClientBanner(client1b, ref1);
  await expect(client1b.getByText('Tubería dañada adicional bajo el fregadero')).toBeVisible();
  await expect(client1b.getByText('Monto base (ya en Escrow)')).toBeVisible();
  await expect(client1b.getByText('+$300 MXN', { exact: true })).toBeVisible(); // fila del banner (el chip de órdenes previas también dice +$300)
  await expect(client1b.getByText('$1,150 MXN').first()).toBeVisible(); // 850 + 300

  await client1b.getByRole('button', { name: 'Aprobar y pagar' }).click();
  // mock: acepta sin tarjeta → el banner DE ESTA ORDEN desaparece y el total refleja el ajuste
  // (assert scoped por `· #ref`: con residuos de corridas previas el banner puede
  //  re-mostrar otro ajuste pendiente de la misma identidad QA)
  await expect(client1b.getByText(`· #${ref1}`)).toBeHidden({ timeout: 20000 });
  const card1 = orderCard(client1b, ref1);
  await expect(card1.getByText('✅ Ajuste aprobado: +$300 MXN — nuevo total $1,150 MXN')).toBeVisible({ timeout: 15000 });
  await expect(card1.getByText('$1,150 MXN', { exact: true })).toBeVisible();
  await clientCtx1b.close();

  // Técnico ve el chip de aceptado tras recargar
  await tech.reload();
  await expect(tech.getByText('Solicitar un Servicio de Confianza')).toBeVisible({ timeout: 20000 });
  await tech.locator('nav').filter({ hasText: 'Inicio' }).getByRole('button', { name: 'Perfil' }).click();
  await tech.getByRole('button', { name: 'Ver Mis Órdenes' }).click();
  await expect(tech.getByText(`#${ref1}`, { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(
    orderCard(tech, ref1).getByText('✅ Ajuste aprobado y cobrado: +$300 MXN (total $1,150 MXN)')
  ).toBeVisible({ timeout: 15000 });

  // ═══ Ronda 2: rechazar (nueva orden — la ronda 1 ya quedó accepted) ═══
  const clientCtx2 = await browser.newContext();
  const client2 = await clientCtx2.newPage();
  await openAs(client2, 'client');
  const orderId2 = await bookAndPay(client2);
  await clientCtx2.close();
  const ref2 = orderId2.slice(-6);

  await techRequestAdjustment(tech, ref2, '250', 'Refacción extra del sistema');

  const clientCtx3 = await browser.newContext();
  const client3 = await clientCtx3.newPage();
  await openAs(client3, 'client');
  await openClientBanner(client3, ref2);
  await client3.getByRole('button', { name: 'Rechazar' }).click();
  await expect(client3.getByText(`· #${ref2}`)).toBeHidden({ timeout: 20000 });
  const card2 = orderCard(client3, ref2);
  await expect(card2.getByText('❌ Rechazaste el ajuste — se mantiene el monto base')).toBeVisible({ timeout: 15000 });
  // El total NO cambia (850 de Roberto Garza)
  await expect(card2.getByText('$850 MXN', { exact: true })).toBeVisible();
  await clientCtx3.close();

  // Técnico ve el chip de rechazado
  await tech.reload();
  await expect(tech.getByText('Solicitar un Servicio de Confianza')).toBeVisible({ timeout: 20000 });
  await tech.locator('nav').filter({ hasText: 'Inicio' }).getByRole('button', { name: 'Perfil' }).click();
  await tech.getByRole('button', { name: 'Ver Mis Órdenes' }).click();
  await expect(tech.getByText(`#${ref2}`, { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(
    orderCard(tech, ref2).getByText('❌ Ajuste rechazado — se mantiene el precio base')
  ).toBeVisible({ timeout: 20000 });
  await techCtx.close();
});
