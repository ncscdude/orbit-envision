import { test } from 'vitest';
import assert from 'node:assert/strict';
import { EXPERIENCES } from './experiences';

test('experience IDs are unique', () => {
  const ids = EXPERIENCES.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
});

test('every live experience names at least one role', () => {
  for (const e of EXPERIENCES.filter(x => x.status === 'Live')) {
    assert.ok(e.roles.length > 0, `${e.id} has no roles`);
  }
});

test('Panelist role is never granted the Career Planner (firewall rule 5)', () => {
  const planner = EXPERIENCES.filter(e => e.viewId === 'VIEW-CareerPlanner');
  assert.ok(planner.length > 0);
  for (const e of planner) assert.ok(!e.roles.includes('Panelist'));
});
