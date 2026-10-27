import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCandidateLossProfile,
  simulateRetentionMitigation,
  calculateCapabilityDegradation,
  computeCohortAverages
} from './lossCalculator';
import { ALL_CANDIDATES_SEED, BILLETS_SEED } from '../data/seed';

test('loss calculator computes realistic replacement costs and risk scores', () => {
  const candidate = ALL_CANDIDATES_SEED[0];
  const profile = calculateCandidateLossProfile(candidate, ALL_CANDIDATES_SEED, BILLETS_SEED);

  assert.ok(profile.costBreakdown.totalEstimatedCost >= 500000, 'Total replacement cost should exceed $500k');
  assert.ok(profile.flightRiskScore >= 0 && profile.flightRiskScore <= 100, 'Flight risk score must be bounded 0-100');
  assert.ok(profile.timeToBackfillMonths >= 6, 'Backfill months should be at least 6');
  assert.ok(profile.cohortRiskRank >= 1 && profile.cohortRiskRank <= ALL_CANDIDATES_SEED.length, 'Cohort rank within pool bounds');
});

test('retention mitigation simulation reduces flight risk and preserves value', () => {
  const candidate = ALL_CANDIDATES_SEED[0];
  const profile = calculateCandidateLossProfile(candidate, ALL_CANDIDATES_SEED, BILLETS_SEED);
  const simulation = simulateRetentionMitigation(profile, ['csrb_bonus', 'soi_slating']);

  assert.ok(simulation.revisedRiskScore < profile.flightRiskScore, 'Mitigation must reduce risk score');
  assert.ok(simulation.preservedValue > 0, 'Preserved value should be positive');
  assert.ok(simulation.mitigationEffectivenessPct > 0, 'Mitigation effectiveness percentage should be positive');
});

test('calculateCapabilityDegradation computes valid degradation and M-601/M-602 scores', () => {
  const candidate = ALL_CANDIDATES_SEED[0];
  const degradation = calculateCapabilityDegradation(candidate, ALL_CANDIDATES_SEED, BILLETS_SEED);

  assert.ok(degradation.overallDegradationPct > 0, 'Degradation pct must be positive');
  assert.ok(degradation.m601RiskScore >= 20 && degradation.m601RiskScore <= 100, 'M-601 risk score in bounds');
  assert.ok(degradation.m602ImpactScore >= 20 && degradation.m602ImpactScore <= 100, 'M-602 impact score in bounds');
  assert.ok(degradation.primaryMissionImpacted.length > 5, 'Primary mission defined');
});

test('computeCohortAverages returns realistic pool averages', () => {
  const averages = computeCohortAverages(ALL_CANDIDATES_SEED, BILLETS_SEED);

  assert.ok(averages.avgFlightRiskScore >= 30 && averages.avgFlightRiskScore <= 100, 'Avg flight risk score realistic');
  assert.ok(averages.avgImpactScore >= 30 && averages.avgImpactScore <= 100, 'Avg impact score realistic');
  assert.ok(averages.avgReplacementCost > 400000, 'Avg replacement cost > $400k');
  assert.ok(averages.totalOfficers === ALL_CANDIDATES_SEED.length, 'Total officers matches seed');
});
