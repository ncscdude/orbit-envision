/**
 * Project ORBIT - Build gate results
 * Shape of the last recorded run of the three gated checks (lint, unit, acceptance).
 * The numbers are written by scripts/gate-results.mjs from the real tool output; nothing
 * here is typed in by hand.
 */

export type GateState = 'passed' | 'failed' | 'not-run';

export interface GateResults {
  recordedAt: string | null; // ISO time of the run, null if never recorded
  branch: string;
  commit: string;
  lint: { state: GateState; errors: number; warnings: number; files: number };
  unit: { state: GateState; passed: number; failed: number; total: number; files: { file: string; passed: number; failed: number }[] };
  acceptance: { state: GateState; passed: number; failed: number; total: number };
}

export type CheckResult = 'PASS' | 'WARN' | 'FAIL';

export function gateResult(state: GateState): CheckResult {
  return state === 'passed' ? 'PASS' : state === 'failed' ? 'FAIL' : 'WARN';
}

/** Metric status colors to the PASS / WARN / FAIL words used by every ORBIT gate. */
export function statusResult(status: 'green' | 'amber' | 'red' | 'neutral'): CheckResult | null {
  if (status === 'green') return 'PASS';
  if (status === 'amber') return 'WARN';
  if (status === 'red') return 'FAIL';
  return null;
}
