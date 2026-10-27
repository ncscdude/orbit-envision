import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createInitialState } from '../state/reducer';
import { ALL_CANDIDATES_SEED, BILLETS_SEED } from '../data/seed';
import { DEFAULT_WEIGHTS, generateAllCandidateBilletScores, toScoreMatrix } from './match';
import { runGreedyMatching } from './stable';

test('Match Board opens with matches (regression: was 0)', () => {
  const s = createInitialState();
  assert.ok(s.officialMatches.length > 0, 'official proposal should not be empty');
  assert.ok(s.sandboxMatches.length > 0, 'sandbox should not be empty');
});

test('greedy matching never assigns a pair that fails a hard constraint', () => {
  const matrix = generateAllCandidateBilletScores(ALL_CANDIDATES_SEED, BILLETS_SEED, DEFAULT_WEIGHTS);
  const res = runGreedyMatching(ALL_CANDIDATES_SEED, BILLETS_SEED, toScoreMatrix(matrix));
  assert.ok(res.matches.length > 0);
  for (const m of res.matches) {
    assert.equal(matrix[m.billetId][m.candidateId].constraintsPassed, true, `${m.candidateId} -> ${m.billetId}`);
  }
  assert.ok(res.matches.length <= BILLETS_SEED.length);
  assert.equal(new Set(res.matches.map(m => m.billetId)).size, res.matches.length, 'one candidate per billet');
});
