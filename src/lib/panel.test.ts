/**
 * Board President (A-1), panel chat (A-2), full text (A-3), rosters (A-4), fit reveal (A-5),
 * and the panelist access fixes (A-7).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { appReducer, createInitialState } from '../state/reducer';
import { verifyChain } from '../state/delta';
import { allowedRolesForView } from '../auth/RequireRole';
import { lookupRole } from '../auth/roleMap';
import { buildFullRecord } from '../data/fullText';
import { buildRoster, checkRecord, ROSTER_RULES } from './roster';
import { containsPossiblePhi, fitVisible, getMyScore, panelOversight } from './panel';
import type { AppState } from '../types';

const PRESIDENT = { userId: 'DEV-PRES-01', displayName: 'Col Laura Miller (Board President)', role: 'Board President' as const };
const PANELIST = { userId: 'DEV-PANEL-01', displayName: 'Col Marcus Vance (Panelist)', role: 'Panelist' as const };
const BMO = { userId: 'DEV-BMO-01', displayName: 'Col Vance (BMO Lead)', role: 'BMO Lead' as const };
const RECORDER = { userId: 'DEV-REC-01', displayName: 'MSgt Daniel Rivera (Recorder)', role: 'Board Recorder' as const };

function as(identity: typeof PRESIDENT | typeof PANELIST | typeof BMO | typeof RECORDER, base?: AppState): AppState {
  return appReducer(base ?? createInitialState(), { type: 'SET_IDENTITY', identity });
}

const unscored = (s: AppState) => s.candidates.find(c => c.myScore === null && !c.scores.some(x => x.panelistId === 'DEV-PRES-01'))!;

test('A-1: the Board President role is in the role table and lands on the Candidate Queue', () => {
  assert.equal(lookupRole('DEV-PRES-01'), 'Board President');
  const s = as(PRESIDENT);
  assert.equal(s.currentRole, 'Board President');
  assert.equal(s.activeViewId, 'VIEW-CandidateQueue');
});

test('A-1: the Board President votes under their own seat, separate from the panelist seat', () => {
  let s = as(PRESIDENT);
  const c = unscored(s);
  s = appReducer(s, { type: 'SUBMIT_SCORE', candidateId: c.id, score: 8.5 });
  const after = s.candidates.find(x => x.id === c.id)!;
  assert.equal(getMyScore(after, s), 8.5);
  assert.equal(after.myScore, null, 'panelist seat untouched');
  assert.ok(after.scores.some(x => x.panelistId === 'DEV-PRES-01' && x.value === 8.5));
  assert.equal(s.ledger[s.ledger.length - 1].type, 'SCORE_SUBMIT');
  assert.equal(s.ledger[s.ledger.length - 1].role, 'Board President');

  s = as(PANELIST, s);
  assert.equal(getMyScore(s.candidates.find(x => x.id === c.id)!, s), null, 'panelist has not scored it');
});

test('A-1: non-voting roles cannot submit a score', () => {
  const s = as(BMO);
  const c = unscored(s);
  const after = appReducer(s, { type: 'SUBMIT_SCORE', candidateId: c.id, score: 9 });
  assert.equal(after, s);
});

test('A-1: only the Board President can call a re-vote; it flags, posts, and logs', () => {
  const p = as(PANELIST);
  assert.equal(appReducer(p, { type: 'CALL_REVOTE', candidateId: 'PDO-003', reason: 'x' }), p);

  let s = as(PRESIDENT);
  s = appReducer(s, { type: 'CALL_REVOTE', candidateId: 'PDO-003', reason: 'Scores split' });
  const c = s.candidates.find(x => x.id === 'PDO-003')!;
  assert.equal(c.flagged, true);
  assert.equal(s.ledger[s.ledger.length - 1].type, 'REVOTE_CALL');
  assert.ok(s.chat.some(m => m.channel === 'PDO-003' && m.role === 'System' && m.text.includes('Scores split')));
});

test('A-1: oversight lists every voter with progress and divergence', () => {
  const s = as(PRESIDENT);
  const rows = panelOversight(s.candidates, 'DEV-PRES-01', 'Col Laura Miller');
  assert.ok(rows.length >= 8);
  assert.ok(rows.every(r => r.total === s.candidates.length && r.scored <= r.total));
  assert.ok(rows.some(r => r.scored > 0));
});

test('A-2: panelists and the President post; posts are logged and keep the chain valid', () => {
  let s = as(PANELIST);
  s = appReducer(s, { type: 'POST_CHAT', channel: 'PDO-001', text: 'Strong SOI, check the 2024 strat.' });
  s = as(PRESIDENT, s);
  s = appReducer(s, { type: 'POST_CHAT', channel: 'PANEL', text: 'Break at 1400.' });
  const posts = s.chat.filter(m => m.role !== 'System' && m.id !== 'MSG-0001' && m.id !== 'MSG-0002');
  assert.equal(posts.length, 2);
  assert.equal(s.ledger.filter(e => e.type === 'PANEL_MESSAGE').length, 2);
  assert.equal(verifyChain(s.ledger).valid, true);
});

test('A-2: the Recorder reads but cannot post; health information is blocked', () => {
  const r = as(RECORDER);
  assert.equal(appReducer(r, { type: 'POST_CHAT', channel: 'PANEL', text: 'hello' }), r);
  const p = as(PANELIST);
  assert.equal(containsPossiblePhi('He has a medical profile'), true);
  assert.equal(appReducer(p, { type: 'POST_CHAT', channel: 'PANEL', text: 'His diagnosis was in the file' }), p);
});

test('A-2: flagging posts to the record thread; a closed thread takes no posts until flagged again', () => {
  let s = as(PRESIDENT);
  s = appReducer(s, { type: 'CLOSE_THREAD', candidateId: 'PDO-002' });
  assert.ok(s.closedThreads.includes('PDO-002'));
  assert.equal(s.ledger[s.ledger.length - 1].type, 'THREAD_CLOSE');
  const blocked = appReducer(s, { type: 'POST_CHAT', channel: 'PDO-002', text: 'one more thing' });
  assert.equal(blocked, s);
  if (s.candidates.find(c => c.id === 'PDO-002')!.flagged) s = appReducer(s, { type: 'TOGGLE_FLAG', candidateId: 'PDO-002' });
  s = appReducer(s, { type: 'TOGGLE_FLAG', candidateId: 'PDO-002', reason: 'New info' });
  assert.ok(!s.closedThreads.includes('PDO-002'), 'flag reopens the thread');
  assert.ok(s.chat.some(m => m.channel === 'PDO-002' && m.text.includes('flagged this record')));
});

test('A-3: the full record has the SOI, commander comments, and one appraisal per rating year', () => {
  const s = createInitialState();
  const c = s.candidates[0];
  const rec = buildFullRecord(c, s.endorsers);
  assert.equal(rec.soi.source, 'MyVector');
  assert.ok(rec.soi.paragraphs.join(' ').includes(c.soi.text.slice(0, 40)), 'SOI keeps the original wording');
  assert.ok(rec.commander.paragraphs[0].includes(c.soi.endorserQuote));
  assert.equal(rec.appraisals.length, c.performance.length);
  assert.ok(rec.appraisals.every(a => a.source === 'ARMS / myEval'));
  const opened = appReducer(as(PANELIST), { type: 'LOG_RECORD_OPEN', candidateId: c.id, document: 'SOI' });
  assert.equal(opened.ledger[opened.ledger.length - 1].type, 'RECORD_OPEN');
});

test('A-4: each board shows only its own records, checked against its roster rules', () => {
  const s = createInitialState();
  const r1 = buildRoster(s.boards[0], s.candidates);
  assert.equal(r1.records.length, s.candidates.filter(c => c.boardId === 'BRD-001').length);
  assert.equal(r1.included + r1.review + r1.excluded, r1.records.length);
  assert.ok(r1.review >= 1, 'the record with a pending admin inquiry goes to BMO review');
  const r2 = buildRoster(s.boards[1], s.candidates);
  assert.equal(r2.records.length, 0);
  assert.ok(r2.rule, 'every selectable board has rules on file');
  const held = s.candidates.find(c => c.eligibility.adverseActions !== 'None')!;
  assert.equal(checkRecord(ROSTER_RULES[0], held).status, 'BMO review');
});

test('A-5: a voter sees the AI fit value only after scoring; non-voters always see it', () => {
  let s = as(PRESIDENT);
  const c = unscored(s);
  assert.equal(fitVisible(c, s), false);
  s = appReducer(s, { type: 'SUBMIT_SCORE', candidateId: c.id, score: 9 });
  assert.equal(fitVisible(s.candidates.find(x => x.id === c.id)!, s), true);
  const b = as(BMO);
  assert.equal(fitVisible(c, b), true);
});

test('A-7: panelists are kept out of tools that show other panelists’ scores', () => {
  for (const view of ['VIEW-CrossAnalytics', 'VIEW-BoardDetail', 'VIEW-CommandCenter', 'VIEW-ScoringAudit']) {
    assert.ok(!allowedRolesForView(view).includes('Panelist'), `${view} must not allow Panelist`);
  }
  for (const view of ['VIEW-CandidateQueue', 'VIEW-PanelReview', 'VIEW-ScoringAudit', 'VIEW-CrossAnalytics']) {
    assert.ok(allowedRolesForView(view).includes('Board President'), `${view} must allow Board President`);
  }
  assert.ok(!allowedRolesForView('VIEW-CareerPlanner').includes('Board President'), 'Rule 5 applies to the President');
});
