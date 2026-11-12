/**
 * Late files: a file that arrives after the record freeze is held at WARN and reaches the
 * record only after the BMO Lead accepts it. Every step is logged and the chain stays valid.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { appReducer, createInitialState } from '../state/reducer';
import { verifyChain } from '../state/delta';
import { lateFiles } from './lateFiles';
import type { AppState, Role } from '../types';

const as = (state: AppState, role: Role): AppState => appReducer(state, { type: 'SET_ROLE', role });
const start = (): AppState => as(appReducer(createInitialState(), { type: 'SET_ROLE', role: 'Panelist' }), 'BMO Lead');

test('a received late file is renamed, held at WARN, and does not touch the record', () => {
  const before = start();
  const record = before.candidates[0];
  const after = appReducer(before, { type: 'RECEIVE_LATE_FILE', candidateId: record.id });
  assert.equal(after.canonicalFiles.length, before.canonicalFiles.length + 1);
  const file = after.canonicalFiles[after.canonicalFiles.length - 1];
  assert.equal(file.checkResult, 'WARN');
  assert.equal(file.committed, false);
  assert.match(file.canonicalName, /^03ROP_\d{8}_[a-z0-9-]+\.pdf$/);
  assert.equal(after.candidates[0].freshness.rops, record.freshness.rops);
  const last = after.ledger[after.ledger.length - 1];
  assert.equal(last.type, 'FILE_ROUTED');
  assert.equal(last.payload.late, true);
  assert.equal(last.payload.candidateId, record.id);
  const rows = lateFiles(after);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].acceptedAt, null);
});

test('only the BMO Lead accepts a late file; acceptance files it and is logged', () => {
  const received = appReducer(start(), { type: 'RECEIVE_LATE_FILE', candidateId: start().candidates[0].id });
  const fileId = lateFiles(received)[0].fileId;

  const recorder = as(received, 'Board Recorder');
  const refused = appReducer(recorder, { type: 'ACCEPT_LATE_FILE', fileId });
  assert.equal(refused, recorder, 'Board Recorder cannot accept');

  const bmo = as(recorder, 'BMO Lead');
  const accepted = appReducer(bmo, { type: 'ACCEPT_LATE_FILE', fileId });
  const file = accepted.canonicalFiles.find(f => f.id === fileId)!;
  assert.equal(file.committed, true);
  assert.equal(file.checkResult, 'WARN', 'the gate result is not rewritten by acceptance');
  assert.notEqual(accepted.candidates[0].freshness.rops, received.candidates[0].freshness.rops);
  const row = lateFiles(accepted)[0];
  assert.ok(row.acceptedAt);
  assert.equal(appReducer(accepted, { type: 'ACCEPT_LATE_FILE', fileId }), accepted, 'accepting twice does nothing');
  assert.equal(verifyChain(accepted.ledger).valid, true);
});

test('the Panelist cannot receive a late file, and the Admin is refused and logged', () => {
  const base = start();
  const id = base.candidates[0].id;
  const panelist = as(base, 'Panelist');
  assert.equal(appReducer(panelist, { type: 'RECEIVE_LATE_FILE', candidateId: id }), panelist);

  const admin = as(base, 'ORBIT Admin');
  const tried = appReducer(admin, { type: 'RECEIVE_LATE_FILE', candidateId: id });
  assert.equal(tried.canonicalFiles.length, admin.canonicalFiles.length);
  const last = tried.ledger[tried.ledger.length - 1];
  assert.equal(last.type, 'ACCESS_DENIED');
  assert.equal(last.payload.reason, 'ADMIN_NO_DECISION');
});
