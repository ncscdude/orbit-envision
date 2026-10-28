import { test, expect, type Page } from '@playwright/test';

// 0.7.0: ORBIT Admin (diagnose and repair, no decisions), role changes with BMO approval,
// Board President AI visibility, and the Roles & Access link to the Field Guide.
const STATE_KEY = 'orbit_demo_state_v6';

async function switchRole(page: Page, role: string) {
  await page.getByRole('button', { name: 'Select user role' }).click();
  await page.getByRole('button', { name: new RegExp(`^${role.replace('/', '\\/')}`) }).click();
}
const ledgerTypes = (page: Page) =>
  page.evaluate(k => (JSON.parse(localStorage.getItem(k) || '{}').ledger ?? []).map((e: { type: string }) => e.type), STATE_KEY);

test('Admin sees every tool, finds a glitch, and repairs it with a logged reason', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'ORBIT Admin');
  await expect(page.locator('nav button')).toHaveCount(13);
  const diag = page.getByTestId('diagnostics');
  await page.getByRole('button', { name: /Inject test glitch/ }).click();
  await expect(diag).toContainText('has two scores from the same voter');
  await diag.locator('tr', { hasText: 'Duplicate score' }).getByRole('button', { name: 'Repair' }).click();
  await page.getByLabel('Repair reason').fill('Duplicate entry reported by the Board Recorder at 0900');
  await page.getByRole('button', { name: 'Run repair' }).click();
  await expect(diag).not.toContainText('has two scores from the same voter');
  await expect.poll(() => ledgerTypes(page)).toContain('ADMIN_REPAIR');
});

test('Admin scoring attempt is refused and logged', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'ORBIT Admin');
  await page.locator('nav button', { hasText: 'Panel Workspace' }).click();
  await expect(page.locator('main')).toContainText('View only: your role does not vote');
  await expect(page.getByRole('button', { name: /Submit & Next/ })).toHaveCount(0);
});

test('Admin requests a role change and the BMO Lead approves it', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'ORBIT Admin');
  await page.getByRole('tab', { name: /Roles/ }).click();
  await page.getByLabel('User to change').selectOption('DEV-HQ-01');
  await page.getByLabel('New role').selectOption('Board Recorder');
  await page.getByLabel('Reason for role change').fill('Backfill Recorder for the ILE board this week');
  await page.getByRole('button', { name: 'Submit request' }).click();
  await expect(page.getByTestId('role-requests')).toContainText('Pending');

  await switchRole(page, 'BMO Lead');
  await page.locator('nav button', { hasText: 'Access Admin' }).click();
  await page.getByRole('tab', { name: /Roles/ }).click();
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByTestId('role-requests')).toContainText('Approved');
  await page.getByRole('button', { name: 'Select user role' }).click();
  await expect(page.getByRole('button', { name: /^Board Recorder/ })).toHaveCount(2);
});

test('the Board President turns the Scribe summary off and the Panelist no longer sees it', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Board President');
  await page.getByLabel('Scribe summary: Off').check();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect.poll(() => ledgerTypes(page)).toContain('AI_VISIBILITY_CHANGE');

  await switchRole(page, 'Panelist');
  await page.locator('main tbody tr').first().click();
  await expect(page.locator('main')).toContainText('The Scribe summary hidden by the Board President');
});

test('Panelist sees Board Statistics without the scoring tab', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Panelist');
  await page.locator('nav button', { hasText: 'Board Statistics' }).click();
  await expect(page.locator('main')).toContainText('scoring tab and other members');
  await expect(page.getByRole('button', { name: 'Scoring & Evaluator Analytics' })).toHaveCount(0);
});

test('Roles & Access opens the Field Guide permission table generated from the app', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Roles & Access' });
  await expect(link).toHaveAttribute('href', '/guide/#permissions');
  await page.goto('/guide/#permissions');
  const matrix = page.locator('#matrix');
  await expect(matrix).toContainText('Access Admin');
  await expect(matrix).toContainText('ORBIT Admin');
  await expect(matrix.getByRole('row', { name: /^Panel Oversight/ })).toContainText('Owns');
});
