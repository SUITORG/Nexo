// tests/e2e/smoke.test.ts
// Basic smoke tests - verify pages return 200

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('home page returns 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('explorar page returns 200', async ({ page }) => {
    const response = await page.goto('/explorar');
    expect(response?.status()).toBe(200);
  });

  test('perfil page returns 200 (or redirects)', async ({ page }) => {
    const response = await page.goto('/perfil');
    expect([200, 302, 307].includes(response?.status() || 0)).toBe(true);
  });

  test('escrow page returns 200', async ({ page }) => {
    const response = await page.goto('/escrow');
    expect(response?.status()).toBe(200);
  });
});