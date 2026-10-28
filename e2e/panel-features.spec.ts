import { test, expect, type Page } from '@playwright/test';

// A-1 to A-5, A-7: Board President, panel chat, full-text reader, per-board rosters, fit reveal.
const STATE_KEY = 'orbit_demo_state_v5';

async function switchRole(page: Page, role: string) {
  await page.getByRole('button', { name: 'Select user role' }).click();
  await page.getByRole('button', { name: new RegExp(`^${role.replace('/', '\\/')}`) }).click();
}

async function ledgerTypes(page: Page): Promise<string[]> {
  return page.evaluate(k => (JSON.parse(localStorage.getItem(k) || '{}').ledger ?? []).map((e: { type: string }) => e.type), STATE_KEY);
}

test('Board President lands on the queue with panel oversight and hidden AI fit', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Board President');
  const main = page.locator('main');
  await expect(main.getByTestId('president-oversight')).toBeVisible();
  await expect(main.getByText('after you score').first()).toBeVisible();
  await main.getByRole('button', { name: 'How this list was built' }).click();
  await expect(main.getByTestId('roster-panel')).toContainText('Population query');
});

test('Panelist reads the full record, discusses it, and the AI fit appears only after scoring', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Panelist');
  const main = page.locator('main');
  await main.locator('tbody tr').filter({ hasText: 'after you score' }).first().click();

  await main.getByRole('button', { name: 'Read full record' }).click();
  const dialog = page.getByRole('dialog', { name: 'Full record' });
  await expect(dialog).toContainText('Statement of Intent');
  await dialog.getByRole('button', { name: /Appraisals/ }).click();
  await expect(dialog).toContainText('Officer Performance Report');
  await dialog.getByRole('button', { name: 'Close full record' }).click();
  await expect.poll(() => ledgerTypes(page)).toContain('RECORD_OPEN');

  await main.getByRole('button', { name: /^Discuss/ }).click();
  const chat = main.getByTestId('panel-chat');
  await chat.getByLabel('Chat message').fill('Check the 2024 strat against the SOI.');
  await chat.getByLabel('Chat message').press('Enter');
  await expect(chat.getByTestId('chat-messages')).toContainText('Check the 2024 strat');
  await expect.poll(() => ledgerTypes(page)).toContain('PANEL_MESSAGE');

  await chat.getByLabel('Chat message').fill('His medical file says');
  await expect(chat.getByRole('alert')).toContainText('health information');

  await main.getByRole('button', { name: 'Predictive & Drivers' }).click();
  await expect(main).toContainText('Fit value shows after you score');
  await page.getByRole('button', { name: '8.5', exact: true }).click();
  await page.getByRole('button', { name: /Submit & Next/ }).click();
  await page.getByRole('button', { name: 'Previous candidate in queue' }).click();
  await expect(main).toContainText('LLM Fit:');
});

test('Board Recorder reads panel chat but cannot post or vote', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Board Recorder');
  await page.locator('nav button', { hasText: 'Candidate Queue' }).click();
  const main = page.locator('main');
  await main.getByRole('button', { name: 'Panel channel' }).click();
  await expect(main.getByTestId('panel-chat')).toContainText('Read only for your role');
  await expect(main.getByTestId('panel-chat')).toContainText('Panel channel is open');
});

test('Panelist sees only their own DELTA entries', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Panelist');
  await page.locator('nav button', { hasText: 'DELTA Ledger' }).click();
  await expect(page.locator('main')).toContainText('Showing your own entries only');
  await expect(page.locator('main')).not.toContainText('Col Vance (BMO Lead)');
});
