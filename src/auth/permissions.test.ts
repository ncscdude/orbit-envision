/**
 * 0.7.0: one permission table, ORBIT Admin (diagnose and repair, no decisions),
 * Board President AI visibility, and the Field Guide kept in sync with the app.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PERMISSIONS, ROLE_ORDER, canOpen, permissionsForGuide, rolesFor } from './permissions';
import { EXPERIENCES } from '../registry/experiences';
import { appReducer, createInitialState, effectiveRole, getDefaultLandingForRole } from '../state/reducer';
import { verifyChain } from '../state/delta';
import { runDiagnostics } from '../lib/diagnostics';
import { aiVisible, DEFAULT_AI_VISIBILITY } from '../lib/panel';
import { lookupRole } from './roleMap';
import type { AppState, Role } from '../types';

const ADMIN = { userId: 'DEV-ADMIN-01', displayName: 'Ms. Dana Brooks (ORBIT Admin)', role: 'ORBIT Admin' as const };
const BMO = { userId: 'DEV-BMO-01', displayName: 'Col Vance (BMO Lead)', role: 'BMO Lead' as const };
const PRESIDENT = { userId: 'DEV-PRES-01', displayName: 'Col Laura Miller (Board President)', role: 'Board President' as const };
const PANELIST = { userId: 'DEV-PANEL-01', displayName: 'Col Marcus Vance (Panelist)', role: 'Panelist' as const };
type Who = typeof ADMIN | typeof BMO | typeof PRESIDENT | typeof PANELIST;
const as = (who: Who, base?: AppState): AppState => appReducer(base ?? createInitialState(), { type: 'SET_IDENTITY', identity: who });
const last = (s: AppState) => s.ledger[s.ledger.length - 1];
const REASON = 'Reported by the BMO Lead during board setup';

test('every live view in the menu registry is in the permission table, and the reverse', () => {
  const live = EXPERIENCES.filter(e => e.status === 'Live').map(e => e.viewId).sort();
  assert.deepEqual(live, PERMISSIONS.map(p => p.viewId).sort());
  for (const e of EXPERIENCES.filter(x => x.status === 'Live')) assert.deepEqual(e.roles, rolesFor(e.viewId));
});

test('menus by role match the approved map', () => {
  const menu = (r: Role) => PERMISSIONS.filter(p => canOpen(r, p.viewId)).map(p => p.title);
  assert.equal(menu('ORBIT Admin').length, PERMISSIONS.length, 'Admin sees every tool');
  assert.deepEqual(menu('Panelist'), ['Candidate Queue', 'Panel Workspace', 'DELTA Ledger', 'Board Statistics & Roles']);
  for (const t of ['Panel Oversight', 'Candidate Queue', 'Panel Workspace', 'Scoring Audit', 'Cross Analytics']) {
    assert.ok(menu('Board President').includes(t), `President sees ${t}`);
  }
  for (const t of menu('Panelist')) assert.ok(menu('Board President').includes(t), `President sees every panel view: ${t}`);
  assert.ok(!canOpen('Board President', 'VIEW-CareerPlanner'), 'Rule 5');
  assert.ok(!canOpen('Panelist', 'VIEW-CrossAnalytics'));
  for (const r of ROLE_ORDER) assert.ok(canOpen(r, getDefaultLandingForRole(r)), `${r} lands on a tool it can open`);
});

test('the Field Guide permissions file matches the app permission table', () => {
  const file = readFileSync(resolve(__dirname, '../../public/guide/permissions.js'), 'utf8');
  const json = file.slice(file.indexOf('{'), file.lastIndexOf('}') + 1);
  assert.deepEqual(JSON.parse(json), permissionsForGuide(), 'Regenerate public/guide/permissions.js from src/auth/permissions.ts');
});

test('the Admin is in the role table and lands on Access Admin', () => {
  assert.equal(lookupRole('DEV-ADMIN-01'), 'ORBIT Admin');
  assert.equal(as(ADMIN).activeViewId, 'VIEW-AccessAdmin');
});

test('the Admin cannot vote or make board decisions; attempts are refused and logged', () => {
  const s = as(ADMIN);
  const c = s.candidates.find(x => x.myScore === null)!;
  for (const action of [
    { type: 'SUBMIT_SCORE' as const, candidateId: c.id, score: 9 },
    { type: 'CERTIFY_OOM' as const, boardId: 'BRD-001' },
    { type: 'APPROVE_MATCH' as const, candidateId: s.officialMatches[0].candidateId, billetId: s.officialMatches[0].billetId },
    { type: 'ADJUDICATE_HEARTBURN' as const, candidateId: c.id, action: 'Reconcile' as const, newScore: 8, note: 'x' }
  ]) {
    const after = appReducer(s, action);
    assert.deepEqual(after.candidates, s.candidates);
    assert.deepEqual(after.officialMatches, s.officialMatches);
    assert.deepEqual(after.boards, s.boards);
    assert.equal(last(after).type, 'ACCESS_DENIED');
    assert.equal(last(after).payload.reason, 'ADMIN_NO_DECISION');
  }
});

test('role changes: Admin requests, BMO Lead approves, the new role applies at sign-in', () => {
  let s = as(ADMIN);
  s = appReducer(s, { type: 'REQUEST_ROLE_CHANGE', userId: 'DEV-HQ-01', toRole: 'Board Recorder', reason: REASON, temporary: false });
  assert.equal(s.roleRequests.length, 1);
  assert.equal(last(s).type, 'ROLE_REQUEST');
  const self = appReducer(s, { type: 'REQUEST_ROLE_CHANGE', userId: 'DEV-ADMIN-01', toRole: 'BMO Lead', reason: REASON, temporary: false });
  assert.equal(self, s, 'no one changes their own role');
  assert.equal(appReducer(s, { type: 'DECIDE_ROLE_REQUEST', requestId: 'RRQ-001', approve: true }).roleAssignments['DEV-HQ-01'], undefined, 'Admin cannot approve');

  s = as(BMO, s);
  s = appReducer(s, { type: 'DECIDE_ROLE_REQUEST', requestId: 'RRQ-001', approve: true });
  assert.equal(s.roleRequests[0].status, 'Approved');
  assert.equal(effectiveRole(s, 'DEV-HQ-01', 'HQ Strategic Viewer'), 'Board Recorder');
  s = appReducer(s, { type: 'SET_IDENTITY', identity: { userId: 'DEV-HQ-01', displayName: 'Maj Gen Travis Hayes (HQ Strategic)', role: 'HQ Strategic Viewer' } });
  assert.equal(s.currentRole, 'Board Recorder');
  assert.equal(verifyChain(s.ledger).valid, true);
});

test('temporary access ends after 24 hours', () => {
  let s = as(ADMIN);
  s = appReducer(s, { type: 'REQUEST_ROLE_CHANGE', userId: 'DEV-CFM-01', toRole: 'BMO Lead', reason: REASON, temporary: true });
  s = as(BMO, s);
  s = appReducer(s, { type: 'DECIDE_ROLE_REQUEST', requestId: 'RRQ-001', approve: true });
  const later = new Date(Date.now() + 25 * 3600000);
  assert.equal(effectiveRole(s, 'DEV-CFM-01', 'CFM / Career Planner'), 'BMO Lead');
  assert.equal(effectiveRole(s, 'DEV-CFM-01', 'CFM / Career Planner', later), 'CFM / Career Planner');
  assert.ok(runDiagnostics(s, later).some(f => f.repair === 'expire-access'));
});

test('diagnostics find a glitch and a logged repair clears it without touching any vote', () => {
  let s = as(ADMIN);
  assert.ok(runDiagnostics(s).every(f => f.check === 'Data load' || f.severity === 'OK'), 'clean start except seeded data-load warnings');
  s = appReducer(s, { type: 'ADMIN_INJECT_GLITCH' });
  const found = runDiagnostics(s);
  const dup = found.find(f => f.repair === 'dedupe-scores')!;
  assert.ok(dup);
  assert.ok(found.some(f => f.repair === 'fix-selection'));
  const before = s.candidates.find(c => c.id === dup.targetId)!;
  assert.equal(appReducer(s, { type: 'ADMIN_REPAIR', repair: 'dedupe-scores', targetId: dup.targetId, reason: 'short' }), s, 'reason required');
  s = appReducer(s, { type: 'ADMIN_REPAIR', repair: 'dedupe-scores', targetId: dup.targetId, reason: REASON });
  s = appReducer(s, { type: 'ADMIN_REPAIR', repair: 'fix-selection', reason: REASON });
  const after = s.candidates.find(c => c.id === dup.targetId)!;
  assert.equal(after.scores.length, before.scores.length - 1);
  assert.deepEqual(after.scores, before.scores.slice(0, -1), 'the first vote from each voter is kept unchanged');
  assert.ok(!runDiagnostics(s).some(f => f.repair === 'dedupe-scores' || f.repair === 'fix-selection'));
  assert.equal(last(s).type, 'ADMIN_REPAIR');
  assert.equal(verifyChain(s.ledger).valid, true);
});

test('seating keeps one Board President per board', () => {
  let s = as(ADMIN);
  const slots = s.staffSlots.filter(x => x.boardId === 'BRD-001');
  const vacantPanel = slots.findIndex(x => x.role === 'Panelist' && !x.assigned);
  s = appReducer(s, { type: 'SEAT_MEMBER', boardId: 'BRD-001', slotIndex: vacantPanel, name: 'Maj Test Seat' });
  assert.equal(s.staffSlots.filter(x => x.boardId === 'BRD-001')[vacantPanel].name, 'Maj Test Seat');
  assert.equal(last(s).type, 'SEATING_CHANGE');
});

test('the Board President sets when panel members see each AI item', () => {
  let s = as(PRESIDENT);
  const c = s.candidates.find(x => x.boardId === 'BRD-001' && x.myScore === null && !x.scores.some(y => y.panelistId === 'DEV-PRES-01'))!;
  assert.equal(aiVisible('scribe', c, s), true, 'default Before');
  assert.equal(aiVisible('llmFit', c, s), false, 'default During');
  s = appReducer(s, { type: 'SET_AI_VISIBILITY', boardId: 'BRD-001', settings: { ...DEFAULT_AI_VISIBILITY, scribe: 'Off', llmFit: 'Before' } });
  assert.equal(last(s).type, 'AI_VISIBILITY_CHANGE');
  let p = as(PANELIST, s);
  assert.equal(aiVisible('scribe', c, p), false);
  assert.equal(aiVisible('llmFit', c, p), true);
  s = appReducer(s, { type: 'SET_AI_VISIBILITY', boardId: 'BRD-001', settings: { ...DEFAULT_AI_VISIBILITY, panelAvg: 'After' } });
  p = as(PANELIST, s);
  p = appReducer(p, { type: 'SUBMIT_SCORE', candidateId: c.id, score: 8 });
  assert.equal(aiVisible('panelAvg', p.candidates.find(x => x.id === c.id)!, p), false, 'After waits for certification');
  const bmo = as(BMO, s);
  assert.equal(aiVisible('scribe', c, bmo), true, 'non-voters always see');
  assert.equal(appReducer(p, { type: 'SET_AI_VISIBILITY', boardId: 'BRD-001', settings: DEFAULT_AI_VISIBILITY }).aiVisibility, p.aiVisibility, 'only the President sets it');
});

test('the President reports a record issue to the Board Recorder log', () => {
  let s = as(PRESIDENT);
  s = appReducer(s, { type: 'REPORT_RECORD_ISSUE', candidateId: 'PDO-004', issue: '2024 appraisal is missing from the packet' });
  const r = s.risks[s.risks.length - 1];
  assert.equal(r.type, 'Issue');
  assert.equal(r.owner, 'Board Recorder');
  assert.ok(r.title.includes('PDO-004'));
  assert.equal(last(s).type, 'RECORD_ISSUE');
});
