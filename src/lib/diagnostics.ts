/**
 * Project ORBIT - System diagnostics (ORBIT Admin)
 * Health checks the Admin runs when a board has a problem or a glitch. Each finding names the
 * repair that clears it. Repairs fix the system, never a decision: they do not change a vote,
 * a match approval, or an Order of Merit, and every repair is logged with a reason.
 */

import { AppState } from '../types';
import { verifyChain } from '../state/delta';

export type RepairKind =
  | 'dedupe-scores'
  | 'retry-ingest'
  | 'drop-orphan-matches'
  | 'fix-selection'
  | 'clear-tamper-flag'
  | 'expire-access';

export interface Finding {
  id: string;
  check: string;
  severity: 'OK' | 'Warn' | 'Fault';
  detail: string;
  repair?: RepairKind;
  targetId?: string;
}

export const REPAIR_LABELS: Record<RepairKind, string> = {
  'dedupe-scores': 'Remove the duplicate score entry (keeps the first one each voter cast)',
  'retry-ingest': 'Retry the data load for this record',
  'drop-orphan-matches': 'Remove matches that point to a missing record or billet',
  'fix-selection': 'Reset a screen selection that points to something missing',
  'clear-tamper-flag': 'Clear the tamper-test flag left on by a demo test',
  'expire-access': 'End temporary access that has passed its 24-hour limit'
};

const MIN_SCORE = 6;
const MAX_SCORE = 10;

export function runDiagnostics(state: AppState, now: Date = new Date()): Finding[] {
  const out: Finding[] = [];
  const add = (f: Omit<Finding, 'id'>) => out.push({ id: `DX-${(out.length + 1).toString().padStart(2, '0')}`, ...f });

  // 1. Ledger chain
  const chain = verifyChain(state.ledger);
  if (state.chainTampered) {
    add({ check: 'Ledger chain', severity: 'Fault', detail: 'The tamper-test flag is on, so the chain shows as broken.', repair: 'clear-tamper-flag' });
  } else if (!chain.valid) {
    add({
      check: 'Ledger chain',
      severity: 'Fault',
      detail: 'A hash does not match. Do not edit the ledger: export it and escalate to the BMO Lead and system owner.'
    });
  } else {
    add({ check: 'Ledger chain', severity: 'OK', detail: `${state.ledger.length} entries verify.` });
  }

  // 2. Duplicate or out-of-range scores
  let scoreFaults = 0;
  state.candidates.forEach(c => {
    const seen = new Set<string>();
    const dup = c.scores.some(s => (seen.has(s.panelistId) ? true : (seen.add(s.panelistId), false)));
    if (dup) {
      scoreFaults++;
      add({ check: 'Duplicate score', severity: 'Fault', detail: `${c.id} has two scores from the same voter.`, repair: 'dedupe-scores', targetId: c.id });
    }
    const bad = c.scores.filter(s => s.value < MIN_SCORE || s.value > MAX_SCORE || (s.value * 2) % 1 !== 0);
    if (bad.length > 0) {
      scoreFaults++;
      add({
        check: 'Score out of range',
        severity: 'Fault',
        detail: `${c.id} has ${bad.length} score(s) outside 6.0 to 10.0 in half steps. Escalate to the Board President; the Admin does not change scores.`,
        targetId: c.id
      });
    }
  });
  if (scoreFaults === 0) add({ check: 'Scores', severity: 'OK', detail: 'No duplicate or out-of-range scores.' });

  // 3. Failed data loads
  const failed = state.candidates.filter(c => c.flow.failedIngest || (c.flow.errors?.length ?? 0) > 0);
  failed.forEach(c =>
    add({ check: 'Data load', severity: 'Warn', detail: `${c.id}: ${(c.flow.errors ?? []).join('; ') || 'load failed'}.`, repair: 'retry-ingest', targetId: c.id })
  );
  if (failed.length === 0) add({ check: 'Data load', severity: 'OK', detail: 'Every record loaded.' });

  // 4. Records on a board that does not exist
  const boardIds = new Set(state.boards.map(b => b.id));
  const lost = state.candidates.filter(c => !boardIds.has(c.boardId));
  if (lost.length > 0) add({ check: 'Board link', severity: 'Fault', detail: `${lost.length} record(s) point to a missing board. Escalate to the BMO Lead.` });
  else add({ check: 'Board link', severity: 'OK', detail: 'Every record belongs to a board.' });

  // 5. Matches pointing to missing records or billets
  const candIds = new Set(state.candidates.map(c => c.id));
  const billetIds = new Set(state.billets.map(b => b.id));
  const orphan = [...state.officialMatches, ...state.sandboxMatches].filter(m => !candIds.has(m.candidateId) || !billetIds.has(m.billetId));
  if (orphan.length > 0) add({ check: 'Match links', severity: 'Fault', detail: `${orphan.length} match(es) point to a missing record or billet.`, repair: 'drop-orphan-matches' });
  else add({ check: 'Match links', severity: 'OK', detail: 'Every match points to a real record and billet.' });

  // 6. Screen selections
  const badSel =
    (state.selectedCandidateId !== null && !candIds.has(state.selectedCandidateId)) ||
    !boardIds.has(state.selectedBoardId) ||
    (state.replayIndex !== null && state.replayIndex > state.ledger.length);
  if (badSel) add({ check: 'Screen state', severity: 'Warn', detail: 'A saved selection points to something missing; screens may show blank.', repair: 'fix-selection' });
  else add({ check: 'Screen state', severity: 'OK', detail: 'Selections are valid.' });

  // 7. Seating: one President per board
  const presByBoard = new Map<string, number>();
  state.staffSlots.filter(s => s.role === 'Board President' && s.assigned).forEach(s => presByBoard.set(s.boardId, (presByBoard.get(s.boardId) ?? 0) + 1));
  const multi = [...presByBoard.entries()].filter(([, n]) => n > 1);
  if (multi.length > 0) add({ check: 'Seating', severity: 'Fault', detail: `More than one President seated on ${multi.map(([b]) => b).join(', ')}. Fix in Board seating.` });
  else add({ check: 'Seating', severity: 'OK', detail: 'At most one President per board.' });

  // 8. Temporary access past its limit
  const expired = Object.entries(state.roleAssignments).filter(([, a]) => a.expiresAt && new Date(a.expiresAt) <= now);
  if (expired.length > 0) add({ check: 'Temporary access', severity: 'Warn', detail: `${expired.length} temporary role(s) past 24 hours.`, repair: 'expire-access' });
  else add({ check: 'Temporary access', severity: 'OK', detail: 'No expired temporary access.' });

  return out;
}
