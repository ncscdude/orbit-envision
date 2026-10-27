import { test, expect, type Page } from '@playwright/test';

function watch(page: Page) {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => {
    const host = new URL(r.url()).hostname;
    if (!['localhost', '127.0.0.1'].includes(host) && !r.url().startsWith('data:')) external.push(r.url());
  });
  return { errors, external };
}

test('Command Center loads with ORBIT wording and no outside calls', async ({ page }) => {
  const w = watch(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /ORBIT Command Center/ })).toBeVisible();
  await expect(page.getByText('FICTIONAL DATA', { exact: false }).first()).toBeVisible();
  expect(w.external, 'no requests to outside hosts').toEqual([]);
  expect(w.errors).toEqual([]);
});

test('every tab for the default role renders without errors', async ({ page }) => {
  const w = watch(page);
  await page.goto('/');
  const tabs = page.locator('nav button');
  const count = await tabs.count();
  expect(count).toBeGreaterThan(3);
  for (let i = 0; i < count; i++) {
    await tabs.nth(i).click();
    await expect(page.locator('main, #root').first()).toBeVisible();
  }
  expect(w.errors).toEqual([]);
  expect(w.external).toEqual([]);
});
