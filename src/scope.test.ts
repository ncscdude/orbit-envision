/**
 * MVP scope: the MVP build is the same code with fewer tools, roles, and rows.
 * The scope is a build-time setting, so each test loads the modules under that setting.
 */
import { afterEach, test, vi } from 'vitest';
import assert from 'node:assert/strict';

async function load(scope: 'full' | 'mvp') {
  vi.resetModules();
  vi.stubEnv('VITE_ORBIT_SCOPE', scope === 'mvp' ? 'mvp' : '');
  const scopeMod = await import('./scope');
  const permissions = await import('./auth/permissions');
  const experiences = await import('./registry/experiences');
  const roleMap = await import('./auth/roleMap');
  const reducer = await import('./state/reducer');
  return { scopeMod, permissions, experiences, roleMap, reducer };
}

afterEach(() => vi.unstubAllEnvs());

test('full build keeps all 13 tools and 8 roles, with no MVP-only tool', async () => {
  const { permissions, experiences, scopeMod } = await load('full');
  assert.equal(scopeMod.IS_MVP, false);
  assert.equal(permissions.PERMISSIONS.length, 13);
  assert.equal(permissions.ROLE_ORDER.length, 8);
  assert.ok(!permissions.PERMISSIONS.some(p => p.viewId === 'VIEW-FailureTests'));
  assert.ok(!experiences.EXPERIENCES.some(e => e.viewId === 'VIEW-FailureTests'));
  assert.equal(experiences.BUILT_NEXT_IDS.size, 0);
});

test('MVP build carries only the MVP tools, in board order', async () => {
  const { permissions, experiences, scopeMod } = await load('mvp');
  assert.equal(scopeMod.IS_MVP, true);
  assert.deepEqual(permissions.PERMISSIONS.map(p => p.viewId), [...scopeMod.MVP_VIEW_IDS]);
  const live = experiences.EXPERIENCES.filter(e => e.status === 'Live');
  assert.deepEqual(live.map(e => e.viewId), [...scopeMod.MVP_VIEW_IDS]);
  for (const e of live) assert.ok(e.roles.length > 0, `${e.id} has no roles`);
});

test('MVP build carries only the MVP roles, in the table and in every tool', async () => {
  const { permissions, roleMap, scopeMod } = await load('mvp');
  assert.deepEqual(permissions.ROLE_ORDER, [...scopeMod.MVP_ROLES]);
  assert.equal(roleMap.ROLE_TABLE.length, scopeMod.MVP_ROLES.length);
  for (const p of permissions.PERMISSIONS) {
    for (const role of Object.keys(p.access)) assert.ok((scopeMod.MVP_ROLES as readonly string[]).includes(role), `${p.viewId} grants ${role}`);
  }
  assert.equal(roleMap.lookupRole('DEV-CFM-01'), null);
});

test('MVP build holds built tools for the next increment and never opens talent data (rule 5)', async () => {
  const { permissions, experiences } = await load('mvp');
  assert.equal(experiences.BUILT_NEXT_IDS.size, 6);
  for (const role of permissions.ROLE_ORDER) {
    assert.equal(permissions.canOpen(role, 'VIEW-CareerPlanner'), false);
    assert.equal(permissions.canOpen(role, 'VIEW-MatchLab'), false);
  }
  assert.equal(permissions.canOpen('Panelist', 'VIEW-FailureTests'), false);
  const later = experiences.EXPERIENCES.filter(e => experiences.BUILT_NEXT_IDS.has(e.id));
  for (const e of later) assert.equal(e.status, 'Roadmap');
});

test('MVP build starts on one board with its own saved-state key', async () => {
  const full = await load('full');
  const fullKey = full.reducer.STORAGE_KEY;
  const { reducer, scopeMod } = await load('mvp');
  const state = reducer.createInitialState();
  assert.deepEqual(state.boards.map(b => b.id), [scopeMod.MVP_BOARD_ID]);
  assert.ok(state.candidates.length > 0);
  for (const c of state.candidates) assert.equal(c.boardId, scopeMod.MVP_BOARD_ID);
  for (const m of state.milestones) assert.equal(m.boardId, scopeMod.MVP_BOARD_ID);
  for (const r of state.risks) assert.equal(r.boardId, scopeMod.MVP_BOARD_ID);
  assert.equal(state.activeViewId, 'VIEW-HeliosCommand');
  assert.notEqual(reducer.STORAGE_KEY, fullKey);
  assert.equal(reducer.getDefaultLandingForRole('ORBIT Admin'), 'VIEW-FailureTests');
});
