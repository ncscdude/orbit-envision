/**
 * INTENT-001 AC-7 and AC-8 (unit): identity adapter contract, fictional dev users,
 * and fail-closed handling of unknown identities and unmapped roles.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createDevIdentityProvider, devIdentityProvider, envisionIdentityProvider, DEV_USER_STORAGE_KEY } from './identity';
import { ROLE_TABLE, lookupRole } from './roleMap';
import { DEV_USERS_SEED } from '../data/seed';
import { appReducer, createInitialState } from '../state/reducer';
import { verifyChain } from '../state/delta';
import type { Role } from '../types';

const ALL_ROLES: Role[] = ['ORBIT Admin', 'Board President', 'Panelist', 'Board Recorder', 'BMO Lead', 'Assignments Officer', 'HQ Strategic Viewer', 'CFM / Career Planner'];

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; }
  };
}

test('AC-7: IdentityProvider returns exactly { userId, displayName, role }', () => {
  const identity = createDevIdentityProvider(memoryStorage()).getIdentity();
  assert.ok(identity);
  assert.deepEqual(Object.keys(identity).sort(), ['displayName', 'role', 'userId']);
  assert.equal(typeof identity.userId, 'string');
  assert.equal(typeof identity.displayName, 'string');
  assert.ok(identity.role && ALL_ROLES.includes(identity.role));
});

test('AC-7: devIdentityProvider is exported and returns a fictional seed user', () => {
  assert.equal(devIdentityProvider.kind, 'dev');
  const identity = devIdentityProvider.getIdentity();
  assert.ok(identity);
  const seedUser = DEV_USERS_SEED.find(u => u.userId === identity.userId);
  assert.ok(seedUser, 'dev identity must come from the fictional seed');
  assert.equal(identity.displayName, seedUser.displayName);
  assert.match(identity.userId, /^DEV-/);
});

test('AC-7: dev adapter switches between fictional users and takes the role from the role table', () => {
  const provider = createDevIdentityProvider(memoryStorage());
  provider.selectUser('DEV-PANEL-01');
  assert.equal(provider.getIdentity()?.role, 'Panelist');
  provider.selectUser('DEV-CFM-01');
  assert.equal(provider.getIdentity()?.role, 'CFM / Career Planner');
});

test('AC-7: every ORBIT role has a fictional dev user, and the role table only uses existing roles', () => {
  for (const entry of ROLE_TABLE) assert.ok(ALL_ROLES.includes(entry.role), `${entry.userId} maps to unknown role`);
  for (const role of ALL_ROLES) {
    assert.ok(DEV_USERS_SEED.some(u => lookupRole(u.userId) === role), `no dev user for ${role}`);
  }
});

test('AC-8: an identity not in the directory resolves to null (unknown identity)', () => {
  const provider = createDevIdentityProvider(memoryStorage({ [DEV_USER_STORAGE_KEY]: 'DEV-NOT-A-USER' }));
  assert.equal(provider.getIdentity(), null);
});

test('AC-8: a known identity with no role table entry resolves with role null (unmapped role)', () => {
  const provider = createDevIdentityProvider(memoryStorage({ [DEV_USER_STORAGE_KEY]: 'DEV-NOROLE-01' }));
  const identity = provider.getIdentity();
  assert.ok(identity);
  assert.equal(identity.role, null);
  assert.equal(lookupRole('DEV-NOROLE-01'), null);
});

test('AC-8: unknown identity sets the No access state and logs ACCESS_DENIED', () => {
  const next = appReducer(createInitialState(), { type: 'SET_IDENTITY', identity: null });
  assert.equal(next.accessDenial, 'UNKNOWN_IDENTITY');
  const last = next.ledger[next.ledger.length - 1];
  assert.equal(last.type, 'ACCESS_DENIED');
  assert.equal(last.role, 'Unmapped');
  assert.equal(last.payload.reason, 'UNKNOWN_IDENTITY');
  assert.ok(last.actor.length > 0);
  assert.ok(last.timestamp);
  assert.equal(verifyChain(next.ledger).valid, true);
});

test('AC-8: unmapped role sets the No access state and logs ACCESS_DENIED naming the user', () => {
  const identity = { userId: 'DEV-NOROLE-01', displayName: 'Capt Avery Quinn (Unmapped)', role: null };
  const next = appReducer(createInitialState(), { type: 'SET_IDENTITY', identity });
  assert.equal(next.accessDenial, 'UNMAPPED_ROLE');
  const last = next.ledger[next.ledger.length - 1];
  assert.equal(last.type, 'ACCESS_DENIED');
  assert.equal(last.actor, identity.displayName);
  assert.equal(last.payload.userId, identity.userId);
  assert.equal(last.payload.reason, 'UNMAPPED_ROLE');
});

test('AC-8: a mapped identity clears a prior denial', () => {
  const denied = appReducer(createInitialState(), { type: 'SET_IDENTITY', identity: null });
  const granted = appReducer(denied, { type: 'SET_IDENTITY', identity: { userId: 'DEV-BMO-01', displayName: 'Col Vance (BMO Lead)', role: 'BMO Lead' } });
  assert.equal(granted.accessDenial, null);
  assert.equal(granted.currentRole, 'BMO Lead');
});

test('Envision adapter fails closed until the platform identity contract is confirmed', () => {
  assert.equal(envisionIdentityProvider.kind, 'envision');
  assert.equal(envisionIdentityProvider.getIdentity(), null);
});
