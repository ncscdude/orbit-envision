import { test, expect, type Page } from '@playwright/test';

// INTENT-001 AC-8: unknown identity or unmapped role lands on "No access" and logs ACCESS_DENIED.
const DEV_USER_KEY = 'orbit_dev_user';
const STATE_KEY = 'orbit_demo_state_v6';

async function signInAs(page: Page, userId: string) {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [DEV_USER_KEY, userId]);
}

async function lastLedgerEntry(page: Page) {
  return page.evaluate(k => {
    const ledger = JSON.parse(localStorage.getItem(k) || '{}').ledger ?? [];
    return ledger[ledger.length - 1] ?? null;
  }, STATE_KEY);
}

test('unknown identity lands on No access and logs ACCESS_DENIED', async ({ page }) => {
  await signInAs(page, 'DEV-NOT-A-USER');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible();
  await expect(page.locator('nav')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /ORBIT Command Center/ })).toHaveCount(0);
  await expect.poll(async () => (await lastLedgerEntry(page))?.type).toBe('ACCESS_DENIED');
  const entry = await lastLedgerEntry(page);
  expect(entry.payload.reason).toBe('UNKNOWN_IDENTITY');
  expect(entry.role).toBe('Unmapped');
});

test('identity with no role table entry lands on No access and logs ACCESS_DENIED', async ({ page }) => {
  await signInAs(page, 'DEV-NOROLE-01');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible();
  await expect(page.locator('nav')).toHaveCount(0);
  await expect.poll(async () => (await lastLedgerEntry(page))?.type).toBe('ACCESS_DENIED');
  const entry = await lastLedgerEntry(page);
  expect(entry.payload.reason).toBe('UNMAPPED_ROLE');
  expect(entry.payload.userId).toBe('DEV-NOROLE-01');
  expect(entry.actor).toContain('Unmapped');
});
