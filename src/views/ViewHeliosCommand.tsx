import React, { useState } from 'react';
import { useOrbit } from '../state/context';
import { Candidate, SourcePipeline } from '../types';
import { MetricPopover } from '../components/MetricPopover';
import {
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Lock,
  UserCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const ViewHeliosCommand: React.FC = () => {
  const { state, dispatch, useMetric } = useOrbit();
  const [activeSubTab, setActiveSubTab] = useState<'A' | 'B' | 'C'>('A');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);

  // Metrics lookup
  const m101 = useMetric('M-101');
  const m102 = useMetric('M-102');
  const m103 = useMetric('M-103');
  const m104 = useMetric('M-104');
  const m105 = useMetric('M-105');
  const m106 = useMetric('M-106');

  const m201 = useMetric('M-201');
  const m202 = useMetric('M-202');
  const m203 = useMetric('M-203');
  const m204 = useMetric('M-204');
  const m205 = useMetric('M-205');

  const m301 = useMetric('M-301');
  const m302 = useMetric('M-302');
  const m303 = useMetric('M-303');
  const m304 = useMetric('M-304');

  const m501 = useMetric('M-501');
  const m502 = useMetric('M-502');
  const m503 = useMetric('M-503');
  const m504 = useMetric('M-504');
  const m505 = useMetric('M-505');

  // Throughput 7-day sparkline data
  const throughputData = [
    { day: 'Day 1', processed: 12 },
    { day: 'Day 2', processed: 15 },
    { day: 'Day 3', processed: 18 },
    { day: 'Day 4', processed: 22 },
    { day: 'Day 5', processed: 25 },
    { day: 'Day 6', processed: 29 },
    { day: 'Day 7', processed: 36 }
  ];

  // Candidates in stuck or failed state (IDEA-001)
  const stuckCandidates = state.candidates.filter(
    c => (c.flow.stage === 'Ingested' && !c.flow.failedIngest) || (c.flow.stage === 'Validated' && c.flow.errors.length > 0)
  );
  const failedCandidates = state.candidates.filter(c => c.flow.failedIngest);

  // Affected candidates for selected source (IDEA-002)
  const getAffectedCandidatesForSource = (sourceId: string | null): Candidate[] => {
    if (!sourceId) return [];
    if (sourceId === 'SURF') {
      return state.candidates.filter(c => c.id === 'PDO-008'); // Red SURF case (>7d)
    }
    if (sourceId === 'ARMS') {
      return state.candidates.filter(c => c.id === 'PDO-007'); // Amber ARMS case (>12h)
    }
    if (sourceId === 'MilPDS') {
      // General amber candidates whose milpds sync is > 24h
      return state.candidates.slice(0, 3);
    }
    return [];
  };

  const handleRetryFailedIngest = (candId: string) => {
    if (state.currentRole !== 'BMO Lead') return;
    dispatch({ type: 'RETRY_INGEST', candidateId: candId });
  };

  const handleLockPopulation = () => {
    if (state.currentRole !== 'BMO Lead') return;
    if (Number(m504.raw) < 95) return;
    dispatch({ type: 'LOCK_POPULATION', boardId: state.selectedBoardId });
  };

  const handleOpenCandidate = (candId: string) => {
    dispatch({ type: 'SELECT_CANDIDATE', candidateId: candId });
    dispatch({ type: 'SET_VIEW', viewId: 'VIEW-PanelReview' });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>HELIOS Command & Pipeline Telemetry</span>
            <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              IDEA-001 · 002 · 003
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingestion funnel, stage-gate health, source freshness monitoring, and portfolio readiness gates.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1 bg-[#0a1020] p-1 rounded-md border border-[#1e2d45] text-xs">
          <button
            onClick={() => setActiveSubTab('A')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSubTab === 'A'
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            A. Pipeline & Funnel (IDEA-001)
          </button>
          <button
            onClick={() => setActiveSubTab('B')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSubTab === 'B'
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            B. Source Freshness (IDEA-002)
          </button>
          <button
            onClick={() => setActiveSubTab('C')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSubTab === 'C'
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            C. Portfolio Readiness (IDEA-003)
          </button>
        </div>
      </div>

      {/* SUB-TAB A: Pipeline Health & Stage Gate Funnel (IDEA-001) */}
      {activeSubTab === 'A' && (
        <div className="space-y-5">
          {/* KPI Strip for M-101 to M-105 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* M-101 */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded p-3">
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase font-mono mb-1">
                <span>Processed Today</span>
                <MetricPopover metricId="M-101" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">{m101.formatted}</div>
            </div>

            {/* M-102 */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded p-3">
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase font-mono mb-1">
                <span>Avg Processing Time</span>
                <MetricPopover metricId="M-102" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">{m102.formatted}</div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Target: &lt;= 5.0 min</span>
            </div>

            {/* M-103 */}
            <div className={`bg-[#0a1020] border rounded p-3 ${Number(m103.raw) > 0 ? 'border-amber-500/60' : 'border-[#1e2d45]'}`}>
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase font-mono mb-1">
                <span>Stuck Records (&gt;24h)</span>
                <MetricPopover metricId="M-103" />
              </div>
              <div className="text-xl font-bold font-mono text-[#ffb800]">{m103.formatted}</div>
              <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">Needs Attention</span>
            </div>

            {/* M-104 */}
            <div className={`bg-[#0a1020] border rounded p-3 ${Number(m104.raw) > 0 ? 'border-red-500/80 bg-red-950/10' : 'border-[#1e2d45]'}`}>
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase font-mono mb-1">
                <span>Failed Ingests</span>
                <MetricPopover metricId="M-104" />
              </div>
              <div className="text-xl font-bold font-mono text-[#ff4757]">{m104.formatted}</div>
              <span className="text-[10px] text-red-400 block mt-0.5 font-medium">Retry Available</span>
            </div>

            {/* M-105 */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded p-3">
              <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase font-mono mb-1">
                <span>On-Track for Lock</span>
                <MetricPopover metricId="M-105" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">{m105.formatted}</div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Lock Date: 2026-11-09</span>
            </div>
          </div>

          {/* Five-Stage Funnel (Ingested -> Validated -> Locked -> Scoring -> Finalized) */}
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Five-Stage Stage Gate Funnel (M-201 to M-205)
              </span>
              <span className="font-mono text-xs text-slate-400">
                Sum: <strong className="text-white">{Number(m201.raw) + Number(m202.raw) + Number(m203.raw) + Number(m204.raw) + Number(m205.raw)}</strong> / {state.candidates.length} pool
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {/* Stage 1: Ingested */}
              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">1. Ingested</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">{m201.formatted}</div>
                <span className="text-[10px] text-slate-400 mt-1">Raw file ingestion</span>
              </div>

              {/* Stage 2: Validated */}
              <div className="p-3 bg-[#05080f] border border-amber-800/80 rounded flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-amber-400 uppercase font-bold">2. Validated</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                    3 Errors
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-300">{m202.formatted}</div>
                <span className="text-[10px] text-slate-400 mt-1">Schema & format check</span>
              </div>

              {/* Stage 3: Locked */}
              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">3. Locked</span>
                  <Lock className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">{m203.formatted}</div>
                <span className="text-[10px] text-slate-400 mt-1">Sealed from sync updates</span>
              </div>

              {/* Stage 4: Scoring */}
              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">4. Scoring</span>
                  <Activity className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">{m204.formatted}</div>
                <span className="text-[10px] text-slate-400 mt-1">Active evaluation window</span>
              </div>

              {/* Stage 5: Finalized */}
              <div className="p-3 bg-[#05080f] border border-emerald-800/80 rounded flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-emerald-400 uppercase font-bold">5. Finalized</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{m205.formatted}</div>
                <span className="text-[10px] text-slate-400 mt-1">Scores audited & closed</span>
              </div>
            </div>
          </div>

          {/* 7-Day Throughput Chart & Slope Arrow (M-106) */}
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> 7-Day Rolling Throughput Trend & Topological Slope
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Slope: {m106.formatted}
                </span>
                <MetricPopover metricId="M-106" />
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughputData}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a1020', borderColor: '#1e2d45', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="processed" stroke="#00d4ff" strokeWidth={2.5} dot={{ r: 4, fill: '#00d4ff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stuck and Failed Records Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stuck Records List (>24h) */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                <span className="font-semibold text-amber-400 text-xs flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5" /> Stuck Records (&gt;24 Hours)
                </span>
                <span className="text-xs font-mono text-slate-400">{stuckCandidates.length} records</span>
              </div>
              <div className="space-y-2">
                {stuckCandidates.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenCandidate(c.id)}
                    className="p-2.5 bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] rounded text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400">{c.id}</span>
                        <span>{c.name}</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">
                        Stage: {c.flow.stage} · {c.flow.errors.length > 0 ? `${c.flow.errors.length} schema errors` : 'Ingestion timeout (>50h)'}
                      </span>
                    </div>
                    <span className="text-[11px] text-cyan-400 flex items-center gap-0.5">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Failed Ingests List (with Retry Button) */}
            <div className="bg-[#0a1020] border border-red-900/60 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                <span className="font-semibold text-red-400 text-xs flex items-center gap-1.5 font-mono">
                  <AlertCircle className="w-3.5 h-3.5" /> Failed Ingests (Hard Socket Errors)
                </span>
                <span className="text-xs font-mono text-slate-400">{failedCandidates.length} records</span>
              </div>

              {failedCandidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No active failed ingests. All pipelines operational.
                </div>
              ) : (
                <div className="space-y-2">
                  {failedCandidates.map(c => (
                    <div key={c.id} className="p-2.5 bg-[#05080f] border border-red-800 rounded text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span className="font-mono text-red-400 font-bold">{c.id}</span>
                            <span>{c.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {c.flow.errors[0] || 'AFPC socket failure'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRetryFailedIngest(c.id)}
                          disabled={state.currentRole !== 'BMO Lead'}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold rounded text-xs flex items-center gap-1 transition-colors shadow-sm"
                          title={state.currentRole !== 'BMO Lead' ? 'Only BMO Lead can trigger pipeline retry' : 'Re-trigger integration ingest'}
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB B: Source Freshness Monitor (IDEA-002) */}
      {activeSubTab === 'B' && (
        <div className="space-y-5">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-white text-sm">Authoritative Source Freshness Monitor</h3>
              <p className="text-xs text-slate-400">
                Latency bars and threshold status across ARMS, MilPDS, MyVector, and SURF. Click any source to inspect affected candidates.
              </p>
            </div>

            {/* Source Pipelines Table */}
            <div className="space-y-3">
              {state.sources.map(src => {
                let ageText = '5.2h';
                let statusColor = 'bg-emerald-500';
                let statusPill = 'FRESH';
                let pillClass = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                let thresholdText = 'Amber > 12h, Red > 24h';
                let barPct = 25;

                if (src.id === 'MilPDS') {
                  ageText = '32.5h';
                  statusColor = 'bg-amber-500';
                  statusPill = 'AMBER STALE';
                  pillClass = 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse';
                  thresholdText = 'Amber > 24h, Red > 48h';
                  barPct = 65;
                } else if (src.id === 'SURF') {
                  ageText = '8.5 days';
                  statusColor = 'bg-red-500';
                  statusPill = 'RED CRITICAL';
                  pillClass = 'bg-red-950 text-red-300 border-red-800 animate-pulse font-bold';
                  thresholdText = 'Amber > 1d, Red > 7d';
                  barPct = 95;
                } else if (src.id === 'MyVector') {
                  ageText = '12 min';
                  barPct = 10;
                  thresholdText = 'Amber > 24h, Red > 72h';
                }

                const isSelected = selectedSourceId === src.id;

                return (
                  <div
                    key={src.id}
                    onClick={() => setSelectedSourceId(isSelected ? null : src.id)}
                    className={`p-3.5 bg-[#05080f] border rounded-md cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-[#0f172a]'
                        : 'border-[#1e2d45] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-[#1e2d45] px-2 py-0.5 rounded">
                          {src.id}
                        </span>
                        <span className="font-medium text-slate-200 text-xs">{src.authoritativeSource}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-300">Sync Age: <strong>{ageText}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${pillClass}`}>
                          {statusPill}
                        </span>
                      </div>
                    </div>

                    {/* Latency Threshold Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-[#0a1020] rounded-full overflow-hidden border border-[#1e2d45] relative">
                        <div className={`h-full rounded-full ${statusColor}`} style={{ width: `${barPct}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Last sync: {src.lastSyncAt}</span>
                        <span>Thresholds: {thresholdText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Affected Candidates List (for Selected Source) */}
          {selectedSourceId && (
            <div className="bg-[#0a1020] border border-cyan-500/50 rounded-md p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Candidates Affected by {selectedSourceId} Latency
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {getAffectedCandidatesForSource(selectedSourceId).length} candidates
                </span>
              </div>

              <div className="space-y-2">
                {getAffectedCandidatesForSource(selectedSourceId).map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenCandidate(c.id)}
                    className="p-2.5 bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] rounded text-xs flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-white mr-2">{c.name}</span>
                      <span className="font-mono text-slate-400 text-[10px]">{c.id} · {c.grade} · {c.currentUnit}</span>
                    </div>
                    <span className="font-mono text-[11px] text-amber-400">
                      Sync age exceeds threshold → Review Record
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB C: Portfolio Readiness & Staffing (IDEA-003) */}
      {activeSubTab === 'C' && (
        <div className="space-y-5">
          {/* Active Cycle Card (BRD-001) */}
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
              <div>
                <span className="font-mono text-xs text-cyan-400 uppercase tracking-wider font-semibold block">
                  Active Cycle Board Execution & Staffing
                </span>
                <h3 className="font-bold text-white text-base">ILE AY 26-27 - Panel 1 (BRD-001)</h3>
                <span className="text-xs text-slate-400 font-mono">Start Date: 2026-11-02 · Scheduled Lock: 2026-11-09</span>
              </div>

              {/* Lock Population Button (BMO Lead, disabled unless M-504 >= 95%) */}
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleLockPopulation}
                  disabled={state.currentRole !== 'BMO Lead' || Number(m504.raw) < 95}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-black font-bold rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Population</span>
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  {Number(m504.raw) >= 95
                    ? 'Gate cleared: Packet Completeness >= 95%'
                    : 'Blocked: Packet Completeness < 95%'}
                </span>
              </div>
            </div>

            {/* Gauges & Readiness Gate Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                  <span>Portfolio Readiness (M-501)</span>
                  <MetricPopover metricId="M-501" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{m501.formatted}</div>
                <span className="text-[10px] text-slate-400 mt-1 block">Target: 100% prior to start</span>
              </div>

              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                  <span>At-Risk Packages (M-502)</span>
                  <MetricPopover metricId="M-502" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{m502.formatted}</div>
                <span className="text-[10px] text-slate-400 mt-1 block">Target: 0% missing documents</span>
              </div>

              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                  <span>Packet Completeness (M-504)</span>
                  <MetricPopover metricId="M-504" />
                </div>
                <div className="text-2xl font-bold font-mono text-purple-300">{m504.formatted}</div>
                <span className="text-[10px] text-purple-300 mt-1 block font-medium">
                  {Number(m504.raw) >= 95 ? 'Passed 95% lock gate' : 'Under 95% threshold'}
                </span>
              </div>
            </div>

            {/* Staffing Block */}
            <div className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5 font-mono">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Messaging Flow & Staffing Allocation (M-505)
                </span>
                <span className="font-mono text-cyan-400 font-bold">{m505.formatted}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-[#0a1020] border border-[#1e2d45] rounded">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Board President</span>
                  <span className="font-semibold text-emerald-400">Assigned: Maj Gen Hayes</span>
                </div>
                <div className="p-2 bg-[#0a1020] border border-[#1e2d45] rounded">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Panelist Quorum</span>
                  <span className="font-semibold text-cyan-300">12 of 14 Slots Filled</span>
                </div>
                <div className="p-2 bg-[#0a1020] border border-[#1e2d45] rounded">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Board Scribes</span>
                  <span className="font-semibold text-emerald-400">2 Assigned (MSgt Rivera, TSgt Foster)</span>
                </div>
              </div>
            </div>

            {/* Commander Actions (with 2 overdue in amber) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Commander Endorsement Actions (M-503)
                </span>
                <span className="font-mono text-amber-400 text-xs font-bold">2 Overdue Actions</span>
              </div>

              <div className="space-y-2">
                {state.commanderActions.map(act => {
                  const isOverdue = act.status === 'Pending' && new Date(act.due) < new Date('2026-10-26');

                  return (
                    <div
                      key={act.id}
                      className={`p-2.5 bg-[#05080f] border rounded text-xs flex justify-between items-center ${
                        isOverdue ? 'border-amber-500/80 bg-amber-950/10' : 'border-[#1e2d45]'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-white">{act.commander}</span>
                        <span className="text-slate-400 text-[10px] font-mono block">
                          Target Candidate: {act.candidateId} · Due: {act.due}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                            OVERDUE
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          act.status === 'Done' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {act.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
