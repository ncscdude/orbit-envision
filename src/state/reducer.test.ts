/**
 * INTENT-001 AC-10: role changes log ROLE_CHANGE with old role, new role, and actor.
 * Also covers view denials (ACCESS_DENIED) raised by RequireRole.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { appReducer, createInitialState } from './reducer';
import { verifyChain } from './delta';
import type { AppState } from '../types';

const BMO = { userId: 'DEV-BMO-01', displayName: 'Col Vance (BMO Lead)', role: 'BMO Lead' as const };
const PANELIST = { userId: 'DEV-PANEL-01', displayName: 'Col Marcus Vance (Chair)', role: 'Panelist' as const };

function signedIn(): AppState {
  return appReducer(createInitialState(), { type: 'SET_IDENTITY', identity: BMO });
}

test('AC-10: switching identity to a new role logs ROLE_CHANGE with old role, new role, and actor', () => {
  const before = signedIn();
  const after = appReducer(before, { type: 'SET_IDENTITY', identity: PANELIST });
  assert.equal(after.ledger.length, before.ledger.length + 1);
  const last = after.ledger[after.ledger.length - 1];
  assert.equal(last.type, 'ROLE_CHANGE');
  assert.equal(last.actor, PANELIST.displayName);
  assert.equal(last.role, 'Panelist');
  assert.equal(last.payload.oldRole, 'BMO Lead');
  assert.equal(last.payload.newRole, 'Panelist');
  assert.equal(last.payload.userId, PANELIST.userId);
  assert.equal(last.payload.previousActor, BMO.displayName);
  assert.equal(after.currentRole, 'Panelist');
  assert.equal(after.actorName, PANELIST.displayName);
  assert.equal(verifyChain(after.ledger).valid, true);
});

test('AC-10: SET_ROLE also logs ROLE_CHANGE', () => {
  const before = signedIn();
  const after = appReducer(before, { type: 'SET_ROLE', role: 'Board Recorder', actorName: 'MSgt Daniel Rivera (Recorder)' });
  const last = after.ledger[after.ledger.length - 1];
  assert.equal(last.type, 'ROLE_CHANGE');
  assert.equal(last.payload.oldRole, 'BMO Lead');
  assert.equal(last.payload.newRole, 'Board Recorder');
  assert.equal(last.actor, 'MSgt Daniel Rivera (Recorder)');
});

test('AC-10: first sign-in records the assigned role with no old role', () => {
  const state = signedIn();
  const last = state.ledger[state.ledger.length - 1];
  assert.equal(last.type, 'ROLE_CHANGE');
  assert.equal(last.payload.oldRole, null);
  assert.equal(last.payload.newRole, 'BMO Lead');
});

test('AC-10: re-reading the same identity does not log a role change or move the view', () => {
  const before = { ...signedIn(), activeViewId: 'VIEW-DeltaLedger' };
  const after = appReducer(before, { type: 'SET_IDENTITY', identity: BMO });
  assert.equal(after.ledger.length, before.ledger.length);
  assert.equal(after.activeViewId, 'VIEW-DeltaLedger');
});

test('view denial logs ACCESS_DENIED with actor, role, and target view', () => {
  const panelist = appReducer(signedIn(), { type: 'SET_IDENTITY', identity: PANELIST });
  const after = appReducer(panelist, { type: 'LOG_ACCESS_DENIED', viewId: 'VIEW-CareerPlanner', allowedRoles: ['CFM / Career Planner', 'Assignments Officer'] });
  const last = after.ledger[after.ledger.length - 1];
  assert.equal(last.type, 'ACCESS_DENIED');
  assert.equal(last.actor, PANELIST.displayName);
  assert.equal(last.role, 'Panelist');
  assert.equal(last.targetId, 'VIEW-CareerPlanner');
  assert.equal(last.payload.reason, 'VIEW_ROLE_FORBIDDEN');
});

test('RESET_DEMO keeps the role that came from the identity adapter', () => {
  const panelist = appReducer(signedIn(), { type: 'SET_IDENTITY', identity: PANELIST });
  const reset = appReducer(panelist, { type: 'RESET_DEMO' });
  assert.equal(reset.currentRole, 'Panelist');
  assert.equal(reset.actorName, PANELIST.displayName);
  assert.equal(reset.userId, PANELIST.userId);
  assert.equal(reset.activeViewId, 'VIEW-CandidateQueue');
});
