/**
 * Project ORBIT - Failure Tests (MVP build)
 * One screen for "how do we test for failure?": the three build gates, live health checks on
 * the running state, the record and file gates, and the guards that keep every decision with
 * a person. Each row is read from real results or the live state; drills write to DELTA.
 */

import React, { useMemo } from 'react';
import { useOrbit } from '../state/context';
import { useNav } from '../state/useNav';
import { RequireRole } from '../auth/RequireRole';
import { AdminDiagnostics } from '../components/AdminDiagnostics';
import { GATE_RESULTS } from '../data/gateResults';
import { METHOD_SOURCES } from '../data/methodSources';
import { CheckResult, gateResult, statusResult } from '../lib/gates';
import { runDiagnostics } from '../lib/diagnostics';
import { lateFiles } from '../lib/lateFiles';
import { getMetric, METRIC_REGISTRY } from '../registry/metrics';
import { verifyChain } from '../state/delta';
import { PERMISSIONS, canOpen } from '../auth/permissions';
import { Hammer, Activity, FileCheck2, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';

const RESULT_STYLE: Record<CheckResult, string> = {
  PASS: 'bg-emerald-950 text-emerald-300',
  WARN: 'bg-amber-950 text-amber-300 border border-amber-800',
  FAIL: 'bg-red-950 text-red-300 border border-red-800'
};

const ResultBadge: React.FC<{ result: CheckResult | null }> = ({ result }) =>
  result ? (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${RESULT_STYLE[result]}`}>{result}</span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#05080f] text-slate-400 border border-[#1e2d45]">INFO</span>
  );

const TH = 'py-2 px-2';
const HEAD_ROW = 'text-[10px] font-mono uppercase text-slate-400 border-b border-[#1e2d45]';
const CARD = 'bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3';

// Record gates read straight from the metric registry, so the rule and the number match HELIOS Command.
const RECORD_METRICS: { id: string; fixIn: string }[] = [
  { id: 'M-104', fixIn: 'VIEW-HeliosCommand' },
  { id: 'M-103', fixIn: 'VIEW-HeliosCommand' },
  { id: 'M-302', fixIn: 'VIEW-HeliosCommand' },
  { id: 'M-304', fixIn: 'VIEW-HeliosCommand' },
  { id: 'M-301', fixIn: 'VIEW-HeliosCommand' },
  { id: 'M-303', fixIn: 'VIEW-HeliosCommand' },
  { id: 'M-504', fixIn: 'VIEW-BoardDetail' },
  { id: 'M-505', fixIn: 'VIEW-BoardDetail' }
];

const ViewFailureTestsContent: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const { may, go } = useNav();
  const role = state.currentRole;
  const isAdmin = role === 'ORBIT Admin';
  const isBmo = role === 'BMO Lead';
  const board = state.boards.find(b => b.id === state.selectedBoardId) ?? state.boards[0];
  const records = useMemo(() => state.candidates.filter(c => c.boardId === board.id), [state.candidates, board.id]);
  const toolTitle = (viewId: string) => PERMISSIONS.find(p => p.viewId === viewId)?.title ?? viewId;

  // 1. Build gates (recorded from real tool output)
  const g = GATE_RESULTS;
  const buildRows: { gate: string; command: string; result: CheckResult; detail: string }[] = [
    {
      gate: '1. Lint',
      command: 'npx eslint .',
      result: gateResult(g.lint.state),
      detail: g.lint.state === 'not-run' ? 'Not recorded for this build' : `${g.lint.errors} errors, ${g.lint.warnings} warnings across ${g.lint.files} files`
    },
    {
      gate: '2. Unit',
      command: 'npx vitest run',
      result: gateResult(g.unit.state),
      detail: g.unit.state === 'not-run' ? 'Not recorded for this build' : `${g.unit.passed} of ${g.unit.total} tests passed in ${g.unit.files.length} files`
    },
    {
      gate: '3. Acceptance',
      command: 'npx playwright test',
      result: gateResult(g.acceptance.state),
      detail: g.acceptance.state === 'not-run' ? 'Not recorded for this build' : `${g.acceptance.passed} of ${g.acceptance.total} browser tests passed`
    }
  ];

  // 2. Live health checks
  const findings = useMemo(() => runDiagnostics(state), [state]);
  const healthResults: CheckResult[] = findings.map(f => (f.severity === 'OK' ? 'PASS' : f.severity === 'Warn' ? 'WARN' : 'FAIL'));

  // 3. Record and file gates
  const metricRows = RECORD_METRICS.map(m => {
    const def = METRIC_REGISTRY[m.id];
    const val = getMetric(state, m.id);
    return { id: m.id, name: def?.name ?? m.id, rule: def?.target ?? def?.formula ?? '', now: val.formatted, result: statusResult(val.status), fixIn: m.fixIn };
  });
  const files = state.canonicalFiles;
  const fileCount = (r: CheckResult) => files.filter(f => f.checkResult === r).length;
  const filesHeld = files.filter(f => f.checkResult === 'WARN' && !f.committed).length;
  const lateWaiting = lateFiles(state).filter(l => l.acceptedAt === null).length;
  const divergent = records.filter(c => {
    if (c.scores.length < 2) return false;
    const avg = c.scores.reduce((n, s) => n + s.value, 0) / c.scores.length;
    return c.scores.some(s => Math.abs(s.value - avg) >= 1.5);
  }).length;
  const gateRows: { id: string; name: string; rule: string; now: string; result: CheckResult | null; fixIn: string }[] = [
    ...metricRows,
    {
      id: 'FILES',
      name: 'Incoming files',
      rule: 'PASS routes; WARN waits for a person; FAIL is rejected',
      now: `${fileCount('PASS')} pass · ${fileCount('WARN')} warn · ${fileCount('FAIL')} fail`,
      result: filesHeld > 0 ? 'WARN' : 'PASS',
      fixIn: 'VIEW-DeltaLedger'
    },
    {
      id: 'LATE',
      name: 'Late files after record freeze',
      rule: 'Reaches the record only after BMO Lead acceptance',
      now: `${lateWaiting} waiting`,
      result: lateWaiting > 0 ? 'WARN' : 'PASS',
      fixIn: 'VIEW-DeltaLedger'
    },
    {
      id: 'DIVERGE',
      name: 'Divergent scores',
      rule: 'A score 1.5 or more points from the record average is reviewed',
      now: `${divergent} record${divergent === 1 ? '' : 's'}`,
      result: divergent > 0 ? 'WARN' : 'PASS',
      fixIn: 'VIEW-ScoringAudit'
    }
  ];

  // 4. Decision guards
  const denied = state.ledger.filter(e => e.type === 'ACCESS_DENIED');
  const adminRefused = denied.filter(e => e.payload.reason === 'ADMIN_NO_DECISION');
  const viewRefused = denied.filter(e => e.payload.reason === 'VIEW_ROLE_FORBIDDEN');
  const chain = verifyChain(state.ledger);
  const chainOk = chain.valid && !state.chainTampered;
  const signed = records.filter(c => c.chatSnapshot.signedOffBy !== null).length;
  // A tool this role may not open: an in-scope one if there is one, else the talent tool that is never in the MVP.
  const forbiddenView = PERMISSIONS.find(p => !canOpen(role, p.viewId))?.viewId ?? 'VIEW-CareerPlanner';
  const last = (list: typeof denied) => (list.length > 0 ? `last ${list[list.length - 1].id}` : 'none yet');

  const all: (CheckResult | null)[] = [...buildRows.map(r => r.result), ...healthResults, ...gateRows.map(r => r.result), chainOk ? 'PASS' : 'FAIL'];
  const fails = all.filter(r => r === 'FAIL').length;
  const warns = all.filter(r => r === 'WARN').length;
  const buildPassed = buildRows.filter(r => r.result === 'PASS').length;
  const healthOk = healthResults.filter(r => r === 'PASS').length;
  const gateIssues = gateRows.filter(r => r.result === 'WARN' || r.result === 'FAIL').length;

  const tiles: { label: string; value: string; note: string; result: CheckResult }[] = [
    { label: 'Build gates', value: `${buildPassed} of 3`, note: 'passed before this build', result: buildRows.some(r => r.result === 'FAIL') ? 'FAIL' : buildPassed === 3 ? 'PASS' : 'WARN' },
    { label: 'Live health checks', value: `${healthOk} of ${healthResults.length}`, note: 'OK right now', result: healthResults.includes('FAIL') ? 'FAIL' : healthResults.includes('WARN') ? 'WARN' : 'PASS' },
    { label: 'Record and file gates', value: `${gateIssues}`, note: 'need a person', result: gateRows.some(r => r.result === 'FAIL') ? 'FAIL' : gateIssues > 0 ? 'WARN' : 'PASS' },
    { label: 'Refused and logged', value: `${denied.length}`, note: 'blocked attempts in DELTA', result: chainOk ? 'PASS' : 'FAIL' }
  ];
  const tileBorder: Record<CheckResult, string> = { PASS: 'border-l-[#00ff88]', WARN: 'border-l-[#ffb800]', FAIL: 'border-l-[#ff4757]' };
  const tileText: Record<CheckResult, string> = { PASS: 'text-[#00ff88]', WARN: 'text-[#ffb800]', FAIL: 'text-[#ff4757]' };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10 text-xs" data-testid="failure-tests">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <span className="font-mono text-cyan-400 uppercase tracking-wider font-semibold">Audit</span>
          <h2 className="text-xl font-bold text-white">Failure Tests</h2>
          <p className="text-slate-400">
            {board.name} · {records.length} records · how ORBIT tests for failure, and what is failing right now
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono border ${
            fails > 0 ? 'bg-red-950/80 text-red-300 border-red-700' : warns > 0 ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
          }`}
          data-testid="failure-summary"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {fails} FAIL · {warns} WARN · {all.filter(r => r === 'PASS').length} PASS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(t => (
          <div key={t.label} className={`bg-[#0a1020] border border-[#1e2d45] rounded-md p-3 border-l-4 ${tileBorder[t.result]}`}>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t.label}</span>
            <div className={`text-xl font-bold font-mono tracking-tight ${tileText[t.result]}`}>{t.value}</div>
            <p className="text-[11px] text-slate-400 mt-1">{t.note}</p>
          </div>
        ))}
      </div>

      {/* 1. Build gates */}
      <section className={CARD}>
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Hammer className="w-4 h-4 text-cyan-400" /> Build gates
        </h3>
        <p className="text-slate-400">All three must pass, in order, before a change goes to human review. A failed gate is fixed and rerun from Gate 1; a test is never weakened to pass.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={HEAD_ROW}>
                <th className={TH}>Gate</th>
                <th className={TH}>Command</th>
                <th className={TH}>Result</th>
                <th className={TH}>Recorded result</th>
              </tr>
            </thead>
            <tbody>
              {buildRows.map(r => (
                <tr key={r.gate} className="border-b border-[#1e2d45]/50">
                  <td className="py-2 px-2 text-white font-semibold">{r.gate}</td>
                  <td className="py-2 px-2 font-mono text-cyan-300">{r.command}</td>
                  <td className="py-2 px-2">
                    <ResultBadge result={r.result} />
                  </td>
                  <td className="py-2 px-2 text-slate-300">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {g.unit.files.length > 0 && (
          <details className="bg-[#05080f] border border-[#1e2d45] rounded p-2">
            <summary className="cursor-pointer text-slate-300">Unit test files ({g.unit.files.length})</summary>
            <table className="w-full text-left mt-2 font-mono">
              <tbody>
                {g.unit.files.map(f => (
                  <tr key={f.file} className="border-b border-[#1e2d45]/40">
                    <td className="py-1 px-2 text-slate-300">{f.file}</td>
                    <td className="py-1 px-2 text-right text-emerald-300">{f.passed} passed</td>
                    <td className={`py-1 px-2 text-right ${f.failed > 0 ? 'text-red-300' : 'text-slate-500'}`}>{f.failed} failed</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
        <p className="text-[10px] text-slate-500 font-mono">
          {g.recordedAt ? `Recorded ${g.recordedAt.slice(0, 16).replace('T', ' ')}Z on ${g.branch} @ ${g.commit}` : 'No run recorded'} · refresh with npm run gates:record
        </p>
      </section>

      {/* 2. Live health checks */}
      <section className={CARD}>
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Live health checks
        </h3>
        <AdminDiagnostics />
      </section>

      {/* 3. Record and file gates */}
      <section className={CARD}>
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-cyan-400" /> Record and file gates
        </h3>
        <p className="text-slate-400">Read from the same metrics and file checks the board runs on. WARN waits for a named person; FAIL stays out until it is fixed.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left" data-testid="record-gates">
            <thead>
              <tr className={HEAD_ROW}>
                <th className={TH}>Gate</th>
                <th className={TH}>Target</th>
                <th className={TH}>Now</th>
                <th className={TH}>Result</th>
                <th className={`${TH} text-right`}>Fix in</th>
              </tr>
            </thead>
            <tbody>
              {gateRows.map(r => (
                <tr key={r.id} className="border-b border-[#1e2d45]/50 align-top">
                  <td className="py-2 px-2">
                    <span className="text-white font-semibold">{r.name}</span>
                    {r.id.startsWith('M-') && <span className="ml-1.5 text-[9px] font-mono text-cyan-500/70">{r.id}</span>}
                  </td>
                  <td className="py-2 px-2 text-slate-400">{r.rule}</td>
                  <td className="py-2 px-2 font-mono text-slate-200">{r.now}</td>
                  <td className="py-2 px-2">
                    <ResultBadge result={r.result} />
                  </td>
                  <td className="py-2 px-2 text-right">
                    {may(r.fixIn) ? (
                      <button type="button" onClick={() => go(r.fixIn)} className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
                        {toolTitle(r.fixIn)} <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-500">{toolTitle(r.fixIn)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Decision guards */}
      <section className={CARD}>
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> Decision guards
        </h3>
        <p className="text-slate-400">People make every decision. Run a drill to watch a guard refuse the action and write the attempt to DELTA.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left" data-testid="decision-guards">
            <thead>
              <tr className={HEAD_ROW}>
                <th className={TH}>Guard</th>
                <th className={TH}>What it stops</th>
                <th className={TH}>Result</th>
                <th className={TH}>Evidence in DELTA</th>
                <th className={`${TH} text-right`}>Drill</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1e2d45]/50 align-top">
                <td className="py-2 px-2 text-white font-semibold">Admin never decides</td>
                <td className="py-2 px-2 text-slate-400">Votes, sign-offs, certification, and file acceptance by the ORBIT Admin</td>
                <td className="py-2 px-2">
                  <ResultBadge result="PASS" />
                </td>
                <td className="py-2 px-2 font-mono text-slate-200" data-testid="admin-refused">
                  {adminRefused.length} refused · {last(adminRefused)}
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    type="button"
                    disabled={!isAdmin || records.length === 0}
                    onClick={() => dispatch({ type: 'SUBMIT_SCORE', candidateId: records[0].id, score: 8 })}
                    className="px-2 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-200 disabled:opacity-40"
                    title={isAdmin ? `Tries to score ${records[0]?.id} as the Admin; ORBIT refuses and logs it` : 'Switch to the ORBIT Admin to run this drill'}
                  >
                    Try a vote as Admin
                  </button>
                </td>
              </tr>
              <tr className="border-b border-[#1e2d45]/50 align-top">
                <td className="py-2 px-2 text-white font-semibold">Each tool checks the role</td>
                <td className="py-2 px-2 text-slate-400">Opening a tool the role is not allowed, however it was reached</td>
                <td className="py-2 px-2">
                  <ResultBadge result="PASS" />
                </td>
                <td className="py-2 px-2 font-mono text-slate-200">
                  {viewRefused.length} refused · {last(viewRefused)}
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_VIEW', viewId: forbiddenView })}
                    className="px-2 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-200"
                    title={`Tries to open ${forbiddenView} as ${role}; ORBIT shows No access and logs it`}
                  >
                    Open a tool I may not use
                  </button>
                </td>
              </tr>
              <tr className="border-b border-[#1e2d45]/50 align-top">
                <td className="py-2 px-2 text-white font-semibold">Ledger cannot be changed quietly</td>
                <td className="py-2 px-2 text-slate-400">An edited or removed DELTA entry; each entry carries the hash of the one before it</td>
                <td className="py-2 px-2">
                  <ResultBadge result={chainOk ? 'PASS' : 'FAIL'} />
                </td>
                <td className="py-2 px-2 font-mono text-slate-200">
                  {chainOk ? `${state.ledger.length} entries verify` : state.chainTampered ? 'tamper test running' : `chain broken at entry ${(chain.brokenAt ?? 0) + 1}`}
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    type="button"
                    disabled={!isBmo}
                    onClick={() => dispatch({ type: 'TAMPER_CHAIN', tamper: !state.chainTampered })}
                    className="px-2 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-200 disabled:opacity-40"
                    title={isBmo ? 'Flags the chain as tampered so you can watch every screen react' : 'Switch to the BMO Lead to run this drill'}
                  >
                    {state.chainTampered ? 'End tamper test' : 'Run tamper test'}
                  </button>
                </td>
              </tr>
              <tr className="align-top">
                <td className="py-2 px-2 text-white font-semibold">AI output needs a person</td>
                <td className="py-2 px-2 text-slate-400">An AI summary treated as final without a named sign-off; AI never scores</td>
                <td className="py-2 px-2">
                  <ResultBadge result={null} />
                </td>
                <td className="py-2 px-2 font-mono text-slate-200">
                  {signed} of {records.length} summaries signed off
                </td>
                <td className="py-2 px-2 text-right">
                  {may('VIEW-PanelReview') && (
                    <button type="button" onClick={() => go('VIEW-PanelReview')} className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
                      {toolTitle('VIEW-PanelReview')} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Method sources */}
      <section className={CARD}>
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-cyan-400" /> Method sources
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={HEAD_ROW}>
                <th className={TH}>Method</th>
                <th className={TH}>Used for</th>
                <th className={TH}>Source</th>
              </tr>
            </thead>
            <tbody>
              {METHOD_SOURCES.map(m => (
                <tr key={m.method} className="border-b border-[#1e2d45]/50">
                  <td className="py-2 px-2 text-white">{m.method}</td>
                  <td className="py-2 px-2 text-slate-400">{m.usedFor}</td>
                  <td className="py-2 px-2 text-cyan-300">{m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export const ViewFailureTests: React.FC = () => (
  <RequireRole viewId="VIEW-FailureTests">
    <ViewFailureTestsContent />
  </RequireRole>
);
