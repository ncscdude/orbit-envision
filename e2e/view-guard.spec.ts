import { test, expect, type Page } from '@playwright/test';
import { EXPERIENCES } from '../src/registry/experiences';

// INTENT-001 AC-9: each view checks the role itself. Opening a forbidden view by
// state change (not through the nav) shows the denial screen and logs ACCESS_DENIED.
const STATE_KEY = 'orbit_demo_state_v6';
const ROLES = ['ORBIT Admin', 'Board President', 'Panelist', 'Board Recorder', 'BMO Lead', 'Assignments Officer', 'HQ Strategic Viewer', 'CFM / Career Planner'] as const;
const LIVE = EXPERIENCES.filter(e => e.status === 'Live');

async function switchRole(page: Page, role: string) {
  await page.getByRole('button', { name: 'Select user role' }).click();
  await page.getByRole('button', { name: new RegExp(`^${role.replace('/', '\\/')}`) }).click();
}

async function lastLedgerEntry(page: Page) {
  return page.evaluate(k => {
    const ledger = JSON.parse(localStorage.getItem(k) || '{}').ledger ?? [];
    return ledger[ledger.length - 1] ?? null;
  }, STATE_KEY);
}

const forbidden = ROLES.flatMap(role =>
  LIVE.filter(e => !e.roles.includes(role)).map(e => ({ role, viewId: e.viewId }))
);

test('there are forbidden role and view pairs to check', () => {
  expect(forbidden.length).toBeGreaterThan(0);
});

for (const { role, viewId } of forbidden) {
  test(`${role} opening ${viewId} by state change is denied and logged`, async ({ page }) => {
    await page.goto('/');
    await switchRole(page, role);
    await page.evaluate(([k, v]) => {
      const s = JSON.parse(localStorage.getItem(k)!);
      s.activeViewId = v;
      localStorage.setItem(k, JSON.stringify(s));
    }, [STATE_KEY, viewId]);
    await page.reload();
    await expect(page.locator('main').getByRole('heading', { name: 'No access' })).toBeVisible();
    await expect.poll(async () => (await lastLedgerEntry(page))?.type).toBe('ACCESS_DENIED');
    const entry = await lastLedgerEntry(page);
    expect(entry.targetId).toBe(viewId);
    expect(entry.role).toBe(role);
    expect(entry.actor.length).toBeGreaterThan(0);
  });
}

test('the Experience Catalog lists only the tools a Panelist may open', async ({ page }) => {
  await page.goto('/');
  await switchRole(page, 'Panelist');
  await page.getByRole('button', { name: 'Catalog' }).click();
  await expect(page.getByText('VIEW-CareerPlanner', { exact: true })).toHaveCount(0);
  await expect(page.getByText('VIEW-CandidateQueue', { exact: true })).toBeVisible();
});

for (const role of ROLES) {
  test(`${role} is not denied on any of its own nav tabs`, async ({ page }) => {
    await page.goto('/');
    await switchRole(page, role);
    const tabs = page.locator('nav button');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await expect(page.getByRole('heading', { name: 'No access' })).toHaveCount(0);
    }
  });
}
