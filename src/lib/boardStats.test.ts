import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  computeBoardStatistics,
  getBoardRolePermissions,
  getAllBoardRolePermissions,
  canExecuteBoardAction
} from './boardStats';
import { createInitialState } from '../state/reducer';

test('computeBoardStatistics calculates valid metrics for BRD-001', () => {
  const state = createInitialState();
  const stats = computeBoardStatistics('BRD-001', state);

  assert.equal(stats.boardId, 'BRD-001');
  assert.equal(stats.totalCandidates, 36);
  assert.ok(stats.scoring.completionRate >= 0 && stats.scoring.completionRate <= 100);
  assert.ok(stats.packetReadiness.completenessRate >= 0 && stats.packetReadiness.completenessRate <= 100);
  assert.ok(stats.scoring.poolAvgScore >= 6.0 && stats.scoring.poolAvgScore <= 10.0);
  assert.ok(stats.milestones.totalCount > 0);
  assert.ok(stats.stagePercentages.ingested + stats.stagePercentages.validated + stats.stagePercentages.locked + stats.stagePercentages.scoring + stats.stagePercentages.finalized >= 98);
});

test('computeBoardStatistics handles portfolio boards deterministically', () => {
  const state = createInitialState();
  const delayedStats = computeBoardStatistics('BRD-003', state); // DARPA SCFP Selection (Delayed)
  const completeStats = computeBoardStatistics('BRD-004', state); // Space Test Course Selection (Complete)

  assert.equal(delayedStats.status, 'Delayed');
  assert.ok(delayedStats.milestones.criticalPathSlippageDays > 0, 'Delayed board should reflect slippage');
  assert.equal(completeStats.status, 'Complete');
  assert.equal(completeStats.scoring.pendingCount, 0, 'Complete board should have 0 pending');
});

test('getBoardRolePermissions returns accurate permission profile for all 6 roles', () => {
  const allPerms = getAllBoardRolePermissions();
  assert.equal(allPerms.length, 6, 'Should define exactly 6 roles');

  const bmo = getBoardRolePermissions('BMO Lead');
  assert.equal(bmo.accessLevel, 'FULL_ADMIN');
  assert.equal(bmo.canLockPopulation, true);
  assert.equal(bmo.firewallActive, false);

  const panelist = getBoardRolePermissions('Panelist');
  assert.equal(panelist.accessLevel, 'EVALUATOR_FIREWALLED');
  assert.equal(panelist.canScoreCandidates, true);
  assert.equal(panelist.canLockPopulation, false);
  assert.equal(panelist.firewallActive, true, 'Panelist must have Rule 5 firewall active');

  const assignments = getBoardRolePermissions('Assignments Officer');
  assert.equal(assignments.accessLevel, 'SLATING_ASSIGNMENTS');
  assert.equal(assignments.canViewTalentLossData, true);

  const recorder = getBoardRolePermissions('Board Recorder');
  assert.equal(recorder.accessLevel, 'OPERATIONS_AUDIT');
  assert.equal(recorder.canEditMilestones, true);
  assert.equal(recorder.canCertifyOom, false);
});

test('canExecuteBoardAction gates permissions accurately', () => {
  const state = createInitialState();
  const stats = computeBoardStatistics('BRD-001', state);

  // BMO Lead locking population
  const bmoLock = canExecuteBoardAction('BMO Lead', 'LOCK_POPULATION', stats);
  if (stats.packetReadiness.completenessRate >= 95) {
    assert.equal(bmoLock.allowed, true);
  } else {
    assert.equal(bmoLock.allowed, false);
    assert.match(bmoLock.reason || '', /95%/);
  }

  // Panelist attempting to lock population (must fail)
  const panelistLock = canExecuteBoardAction('Panelist', 'LOCK_POPULATION', stats);
  assert.equal(panelistLock.allowed, false);
  assert.match(panelistLock.reason || '', /BMO Lead/);

  // Panelist scoring candidate (must succeed)
  const panelistScore = canExecuteBoardAction('Panelist', 'SCORE_CANDIDATE', stats);
  assert.equal(panelistScore.allowed, true);

  // Board Recorder clearing exceptions (must succeed)
  const recorderClear = canExecuteBoardAction('Board Recorder', 'CLEAR_EXCEPTIONS', stats);
  assert.equal(recorderClear.allowed, true);
});
