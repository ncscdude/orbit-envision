import { test, expect, type Page } from '@playwright/test';

// The MVP build is served beside the full demo at /mvp/ (same source, MVP scope).
const MVP = '/mvp/';
const MVP_TABS = ['HELIOS Command', 'Candidate Queue', 'Panel Workspace', 'Panel Oversight', 'Scoring Audit', 'Board Statistics & Roles', 'DELTA Ledger', 'Failure Tests'];
const MVP_ROLES = ['ORBIT Admin', 'BMO Lead', 'Board President', 'Panelist', 'Board Recorder'];

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

async function switchRole(page: Page, role: string) {
  await page.getByRole('button', { name: 'Select user role' }).click();
  await page.getByRole('button', { name: new RegExp(`^${role}`) }).click();
}

test('MVP loads on HELIOS Command with the MVP tools only and no outside calls', async ({ page }) => {
  const w = watch(page);
  await page.goto(MVP);
  await expect(page.getByTestId('mvp-badge')).toBeVisible();
  const tabs = page.locator('nav button');
  await expect(tabs).toHaveCount(MVP_TABS.length);
  for (let i = 0; i < MVP_TABS.length; i++) await expect(tabs.nth(i)).toContainText(MVP_TABS[i]);
  await expect(page.locator('nav')).not.toContainText('Match Lab');
  await expect(page.locator('nav')).not.toContainText('Career Planner');
  await expect(page.getByText('FICTIONAL DATA', { exact: false }).first()).toBeVisible();
  expect(w.external, 'no requests to outside hosts').toEqual([]);
  expect(w.errors).toEqual([]);
});

test('MVP offers only the five MVP roles, and every tab renders for each', async ({ page }) => {
  const w = watch(page);
  await page.goto(MVP);
  await page.getByRole('button', { name: 'Select user role' }).click();
  const options = page.locator('header .absolute button');
  await expect(options).toHaveCount(MVP_ROLES.length);
  await page.getByRole('button', { name: 'Select user role' }).click();
  for (const role of MVP_ROLES) {
    await switchRole(page, role);
    const tabs = page.locator('nav button');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
    }
  }
  expect(w.errors).toEqual([]);
  expect(w.external).toEqual([]);
});

test('a late file is held at WARN until the BMO Lead accepts it, and both steps are logged', async ({ page }) => {
  await page.goto(MVP);
  await page.locator('nav').getByRole('button', { name: /DELTA Ledger/ }).click();
  const panel = page.getByTestId('late-files');
  await expect(panel).toContainText('0 WAITING');
  await panel.getByRole('button', { name: 'Receive Late File' }).click();
  await expect(panel).toContainText('1 WAITING');
  await expect(panel).toContainText('Waiting for BMO Lead');

  // The Board Recorder can see it but cannot accept it.
  await switchRole(page, 'Board Recorder');
  await expect(page.getByTestId('late-files').getByRole('button', { name: 'Accept and File' })).toBeDisabled();

  await switchRole(page, 'BMO Lead');
  await page.locator('nav').getByRole('button', { name: /DELTA Ledger/ }).click();
  await page.getByTestId('late-files').getByRole('button', { name: 'Accept and File' }).click();
  await expect(page.getByTestId('late-files')).toContainText('0 WAITING');
  await expect(page.getByTestId('late-files')).toContainText('Accepted');
  await expect(page.locator('tbody tr', { hasText: 'accepted for' }).first()).toBeVisible();
});

test('Failure Tests: an Admin vote is refused and logged, and a glitch is caught and repaired', async ({ page }) => {
  await page.goto(MVP);
  await switchRole(page, 'ORBIT Admin');
  await expect(page.getByRole('heading', { name: 'Failure Tests' })).toBeVisible();
  await expect(page.getByTestId('admin-refused')).toContainText('0 refused');
  await page.getByRole('button', { name: 'Try a vote as Admin' }).click();
  await expect(page.getByTestId('admin-refused')).toContainText('1 refused');

  const diagnostics = page.getByTestId('diagnostics');
  await expect(diagnostics.getByText('Fault')).toHaveCount(0);
  await page.getByRole('button', { name: /Inject test glitch/ }).click();
  await expect(diagnostics.getByText('Fault').first()).toBeVisible();
  await diagnostics.getByRole('button', { name: 'Repair' }).first().click();
  await page.getByLabel('Repair reason').fill('Demo drill: duplicate score injected for the failure test.');
  await page.getByRole('button', { name: 'Run repair' }).click();
  await expect(diagnostics.getByText('Fault')).toHaveCount(0);
});

test('Failure Tests: the tamper test flips the ledger guard to FAIL and back', async ({ page }) => {
  await page.goto(MVP);
  await page.locator('nav').getByRole('button', { name: /Failure Tests/ }).click();
  const guards = page.getByTestId('decision-guards');
  await expect(guards).toContainText('entries verify');
  await page.getByRole('button', { name: 'Run tamper test' }).click();
  await expect(guards).toContainText('tamper test running');
  await expect(page.locator('header')).toContainText('TAMPER DETECTED');
  await page.getByRole('button', { name: 'End tamper test' }).click();
  await expect(guards).toContainText('entries verify');
});

test('the full demo is unchanged: no MVP badge and no Failure Tests tab', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('mvp-badge')).toHaveCount(0);
  await expect(page.locator('nav')).not.toContainText('Failure Tests');
  await expect(page.getByRole('heading', { name: /ORBIT Command Center/ })).toBeVisible();
});

test('Panelist: Catalog opens its four tools, names the closed ones, and the Demo Guide shows only Panelist steps', async ({ page }) => {
  await page.goto(MVP);
  await switchRole(page, 'Panelist');
  await expect(page.locator('nav button')).toHaveCount(4);
  await page.getByRole('button', { name: /Catalog/ }).click();
  await expect(page.getByTestId('catalog-closed')).toContainText('Panelist opens 4 of 8 live tools');
  await expect(page.getByTestId('catalog-closed')).toContainText('HELIOS Command');
  await page.getByText('Panel Workspace', { exact: true }).last().click();
  await expect(page.getByText('Experience Catalog & Architecture')).toHaveCount(0);
  await page.getByRole('button', { name: /Demo Guide/ }).click();
  await expect(page.getByText('A Person Scores the Record')).toBeVisible();
  await expect(page.getByText('Late File After Record Freeze')).toHaveCount(0);
  await expect(page.getByTestId('guide-other-roles')).toContainText('7 more steps');
});

for (const base of [MVP, '/']) {
  test(`all eight lenses open without an error on the first record (${base})`, async ({ page }) => {
    const w = watch(page);
    await page.goto(base);
    await page.locator('nav').getByRole('button', { name: /Panel Workspace/ }).click();
    for (const lens of ['Skills & Competencies', 'Experience & Command', 'Performance (ROPs)', 'Education & PME', 'Predictive & Drivers', 'Narrative & SOI', 'Eligibility & Freshness', 'Overview (4-Panel)']) {
      await page.locator('main').getByRole('button', { name: lens }).click();
      await expect(page.locator('nav button').first()).toBeVisible();
      await expect(page.getByText(/^Lens \d:/)).toBeVisible();
    }
    expect(w.errors).toEqual([]);
  });
}
