import { test, expect, type Page } from '@playwright/test';

async function switchRole(page: Page, role: string) {
  await page.getByRole('button', { name: 'Select user role' }).click();
  await page.getByRole('button', { name: new RegExp(`^${role.replace('/', '\\/')}`) }).click();
}

test('Panelist has no Career Planner tab', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Panelist');
  await expect(page.locator('nav')).not.toContainText('Career Planner');
});

test('Career Planner role sees the Career Planner tab', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'CFM / Career Planner');
  await expect(page.locator('nav').getByRole('button', { name: /Career Planner N-Box/ })).toBeVisible();
});

test('a logged action records actor, role, and type in the DELTA ledger', async ({ page }) => {
  await page.goto('/');
  await page.locator('nav').getByRole('button', { name: /Candidate Queue/ }).click();
  await page.getByRole('button', { name: /Random Shuffle/ }).click();
  await page.locator('nav').getByRole('button', { name: /DELTA Ledger/ }).click();
  const row = page.locator('tbody tr', { hasText: 'SHUFFLE' }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText('BMO Lead');
});
