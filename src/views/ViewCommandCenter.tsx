import React, { useState, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { MetricPopover } from '../components/MetricPopover';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Printer,
  Search,
  ExternalLink,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export const ViewCommandCenter: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [kpiSearch, setKpiSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('All');
  const [editingCell, setEditingCell] = useState<{ kpiId: string; field: 'kpi' | 'numerator' | 'denominator' | 'accountableDataOwner' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // 8 Phases definition
  const phases = [
    { num: 1, name: 'Board Initiation', scope: 'Establish board cycle, population, governance, owner, and initial schedule.', count: 0, health: 'green' },
    { num: 2, name: 'Preparation', scope: 'Plan milestones, coordinate requirements, and prepare board execution.', count: 0, health: 'green' },
    { num: 3, name: 'Ingestion & Eligibility', scope: 'Ingest submissions, validate candidate information, and determine eligibility.', count: state.candidates.filter(c => c.flow.stage === 'Ingested' || c.flow.stage === 'Validated').length, health: 'amber' },
    { num: 4, name: 'Document Assembly / eBOSS Setup', scope: 'Retrieve documents, validate packets, and prepare records for review.', count: state.candidates.filter(c => c.flow.stage === 'Locked').length, health: 'green' },
    { num: 5, name: 'Scoring & Board Execution', scope: 'Review, score, assess, and capture board decisions and rationale.', count: state.candidates.filter(c => c.flow.stage === 'Scoring').length, health: 'green' },
    { num: 6, name: 'OOM / Results Finalization', scope: 'Finalize Order of Merit outputs, validate results, and prepare release.', count: state.candidates.filter(c => c.flow.stage === 'Finalized').length, health: 'green' },
    { num: 7, name: 'Post-Board Matching & Activations', scope: 'Complete handoffs, matching, activations, declinations, and deferments.', count: 0, health: 'green' },
    { num: 8, name: 'Closeout, Lessons Learned & KPI Reporting', scope: 'Resolve issues, capture improvement actions, and report performance.', count: 0, health: 'green' }
  ];

  // Board Status Donut Data
  const boardStatusData = [
    { name: 'On Track', value: 6, color: '#00ff88' },
    { name: 'At Risk', value: 2, color: '#ffb800' },
    { name: 'Delayed', value: 1, color: '#ff4757' },
    { name: 'Complete', value: 3, color: '#2B6CB0' }
  ];

  // Filtered KPIs
  const filteredKpis = useMemo(() => {
    return state.kpis.filter(k => {
      const matchesSearch =
        k.kpi.toLowerCase().includes(kpiSearch.toLowerCase()) ||
        k.phase.toLowerCase().includes(kpiSearch.toLowerCase()) ||
        k.accountableDataOwner.toLowerCase().includes(kpiSearch.toLowerCase()) ||
        k.likelyDataSource.toLowerCase().includes(kpiSearch.toLowerCase());

      const matchesPhaseSelect =
        selectedPhase === null ||
        (selectedPhase === 1 && k.phase.includes('Preparation')) ||
        (selectedPhase === 2 && k.phase.includes('Preparation')) ||
        (selectedPhase === 3 && k.phase.includes('Ingestion')) ||
        (selectedPhase === 4 && k.phase.includes('Document')) ||
        (selectedPhase === 5 && k.phase.includes('Execution')) ||
        (selectedPhase === 6 && k.phase.includes('Results')) ||
        (selectedPhase === 7 && k.phase.includes('Post-Board')) ||
        (selectedPhase === 8 && k.phase.includes('Closeout'));

      const matchesDropdown =
        phaseFilter === 'All' || k.phase.toLowerCase().includes(phaseFilter.toLowerCase());

      return matchesSearch && matchesPhaseSelect && matchesDropdown;
    });
  }, [state.kpis, kpiSearch, selectedPhase, phaseFilter]);

  const handleKpiCellClick = (kpiId: string, field: 'kpi' | 'numerator' | 'denominator' | 'accountableDataOwner', currentVal: string) => {
    if (state.currentRole !== 'BMO Lead') return;
    setEditingCell({ kpiId, field });
    setEditValue(currentVal);
  };

  const handleSaveKpiCell = () => {
    if (editingCell) {
      dispatch({
        type: 'EDIT_KPI',
        kpiId: editingCell.kpiId,
        field: editingCell.field,
        value: editValue
      });
      setEditingCell(null);
    }
  };

  const handleDrillToCandidates = (drillFilter?: string) => {
    if (drillFilter === 'Exceptions') {
      dispatch({ type: 'SET_FILTER_PACKET', packet: 'Exceptions' });
    } else if (drillFilter === 'Scored') {
      dispatch({ type: 'SET_FILTER_STATUS', status: 'Scored' });
    }
    dispatch({ type: 'SET_VIEW', viewId: 'VIEW-CandidateQueue' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>ETM Boards Workflow and KPI Dashboard</span>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
            EXECUTIVE COMMAND
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Active model for workflow visibility, performance measurement, risk management, and leadership decision support.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="p-3 bg-[#0a1020] border-l-4 border-l-cyan-400 border border-[#1e2d45] rounded-r-md text-xs text-slate-300 flex items-start justify-between gap-3 shadow-md">
        <div>
          <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px] mr-2">
            Editable demonstration model:
          </span>
          Click any KPI-table cell to update text (BMO Lead role). Dashboard visuals use illustrative reference values and should be replaced with validated reporting data before operational use.
        </div>
        <span className="font-mono text-[10px] text-slate-400 shrink-0 bg-[#05080f] px-2 py-0.5 rounded border border-[#1e2d45]">
          USSF S1/ETM
        </span>
      </div>

      {/* Executive Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Boards */}
        <div
          onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-BoardDetail' })}
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#2B6CB0] rounded-md p-4 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
          title="Drill down to individual board statistics, stage-gates, and role permissions"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Active Boards</span>
            <span className="text-[10px] font-mono text-cyan-400">BRD-001..012</span>
          </div>
          <div className="text-3xl font-bold font-mono text-white mt-1">12</div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1 font-medium">
            <span>Drill to Board Statistics</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* Milestones On Track */}
        <div
          onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#00ff88] rounded-md p-4 hover:border-emerald-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Milestones On Track</span>
            <span className="text-[10px] font-mono text-emerald-400">~200 TASKS</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#00ff88] mt-1">94%</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Across all 12 board cycles</span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
          </div>
        </div>

        {/* Packet Readiness */}
        <div
          onClick={() => handleDrillToCandidates('Exceptions')}
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#a855f7] rounded-md p-4 hover:border-purple-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Packet Readiness</span>
            <MetricPopover metricId="M-504" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#c084fc] mt-1">96%</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Click to review 4 exceptions</span>
            <ArrowRight className="w-3 h-3 text-purple-400" />
          </div>
        </div>

        {/* Open Issues Requiring Attention */}
        <div
          onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#ffb800] rounded-md p-4 hover:border-amber-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Issues Requiring Attention</span>
            <span className="text-[10px] font-mono text-amber-400">&gt;30 DAYS</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#ffb800] mt-1">3</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>2 aged 30-60d · 1 aged &gt;60d</span>
            <ArrowRight className="w-3 h-3 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Production Reference Strip */}
      <div className="bg-[#05080f] border border-[#1e2d45] rounded-md px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap text-slate-300">
          <span>Scored <strong className="text-white">112/449</strong></span>
          <span className="text-slate-600">·</span>
          <span>Pending <strong className="text-amber-400">337</strong></span>
          <span className="text-slate-600">·</span>
          <span>Flagged <strong className="text-red-400">12</strong></span>
          <span className="text-slate-600">·</span>
          <span>Board Avg <strong className="text-cyan-400">7.8</strong></span>
          <span className="text-slate-600">·</span>
          <span>Panel Avg <strong className="text-cyan-400">8.1</strong></span>
          <span className="text-slate-600">·</span>
          <span>My Avg <strong className="text-emerald-400">8.4</strong></span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
          Production pool reference benchmark
        </span>
      </div>

      {/* 8-Phase Workflow Bar */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              8-Phase Workflow Progression Model
            </span>
            {selectedPhase && (
              <span className="text-xs text-amber-400 font-mono">
                [Filtered to Phase {selectedPhase}]
              </span>
            )}
          </div>
          {selectedPhase && (
            <button
              onClick={() => setSelectedPhase(null)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear Filter
            </button>
          )}
        </div>

        {/* The 8 Phase Nodes */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {phases.map(p => {
            const isBlue = p.num <= 4;
            const isSelected = selectedPhase === p.num;

            return (
              <div
                key={p.num}
                onClick={() => setSelectedPhase(selectedPhase === p.num ? null : p.num)}
                className={`p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 border-cyan-400 bg-[#0f172a]'
                    : isBlue
                    ? 'bg-[#2B6CB0]/15 border-[#2B6CB0]/50 hover:border-cyan-400'
                    : 'bg-[#5B4282]/15 border-[#5B4282]/50 hover:border-purple-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      PHASE {p.num}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.health === 'green' ? 'bg-[#00ff88]' : 'bg-[#ffb800]'
                      }`}
                    ></span>
                  </div>
                  <h4 className="font-semibold text-xs text-white leading-tight mb-1">
                    {p.name}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <span>In Phase:</span>
                  <strong className={p.count > 0 ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                    {p.count} rec
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Supporting Panels under the Workflow Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supporting Panel 1: Milestones, Dates, and Completion Status */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Milestones, Dates & Completion Status
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Open Register <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Track milestones, suspense dates, dependencies, and completion; compare planned vs actual timelines; identify delays and accountable owners across all 12 board cycles.
            </p>

            <div className="space-y-2">
              {state.milestones.slice(0, 3).map(m => (
                <div key={m.id} className="p-2 bg-[#05080f] border border-[#1e2d45] rounded text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">{m.name}</span>
                    <span className="block text-[10px] text-slate-400">Planned: {m.planned} · Owner: {m.owner}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    m.status === 'Done' ? 'bg-emerald-950 text-emerald-300' :
                    m.status === 'At Risk' ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supporting Panel 2: Risks, Issues, and Change Requests */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Risks, Issues & Change Requests
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Open Register <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Log operational risks and changes; track mitigation, resolution suspense dates, and escalation; use aging buckets to focus leadership on overdue items.
            </p>

            <div className="space-y-2">
              {state.risks.filter(r => r.status === 'Open').slice(0, 3).map(r => (
                <div key={r.id} className="p-2 bg-[#05080f] border border-[#1e2d45] rounded text-xs flex items-center justify-between">
                  <div className="max-w-[75%]">
                    <span className="font-semibold text-slate-200 truncate block">{r.title}</span>
                    <span className="block text-[10px] text-slate-400">Suspense: {r.suspense} · {r.owner}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    r.escalate ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300'
                  }`}>
                    {r.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clickable Data Architecture Strip */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Six Standardized Operational Registers (Clickable)
          </span>
          <span className="text-slate-400 text-[11px]">Direct integration to VIEW-OpsRegisters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {[
            { name: 'Board Register', sub: 'BRD-001..012' },
            { name: 'Milestone Register', sub: 'Planned vs Actual' },
            { name: 'Readiness Register', sub: '4 Documents Gate' },
            { name: 'Action Register', sub: 'Overdue Nudges' },
            { name: 'Risk / Issue Register', sub: 'Aging & Escalation' },
            { name: 'Results Register', sub: 'OOM & Handoff' }
          ].map(reg => (
            <button
              key={reg.name}
              type="button"
              onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
              className="p-2.5 bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] hover:border-cyan-500/60 rounded text-left transition-colors"
            >
              <div className="font-semibold text-white text-xs">{reg.name}</div>
              <div className="text-[10px] font-mono text-cyan-400/80">{reg.sub}</div>
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-[#1e2d45]/70 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 font-semibold uppercase">Data Layer:</span>
            <span className="text-slate-300">Standardized Schema · Consistent Workflow Tables · Automated Validation</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300">
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Status</span>
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Performance</span>
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Readiness</span>
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Issue Aging</span>
          </div>
        </div>
      </div>

      {/* Four Visuals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visual 1: Board Status Donut */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <span>Board Status (12 Boards)</span>
            <MetricPopover metricId="M-501" />
          </div>
          <div className="h-40 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={boardStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {boardStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0a1020', borderColor: '#1e2d45', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xl font-bold font-mono text-white">12</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Boards</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono mt-2">
            <span className="text-[#00ff88]">● 6 On Track</span>
            <span className="text-[#ffb800]">● 2 At Risk</span>
            <span className="text-[#ff4757]">● 1 Delayed</span>
            <span className="text-[#2B6CB0]">● 3 Complete</span>
          </div>
        </div>

        {/* Visual 2: Milestone Timeliness Bar Gauges */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <span>Milestone Timeliness</span>
            <span className="text-[10px] text-slate-400 font-mono">AVG 94%</span>
          </div>
          <div className="space-y-3 my-auto">
            {[
              { label: 'Preparation', pct: 94, color: 'bg-[#00ff88]' },
              { label: 'Eligibility', pct: 92, color: 'bg-[#00ff88]' },
              { label: 'Documents', pct: 88, color: 'bg-[#ffb800]' },
              { label: 'Execution', pct: 97, color: 'bg-[#00ff88]' }
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono text-white">{item.pct}%</span>
                </div>
                <div className="w-full h-2 bg-[#05080f] rounded-full overflow-hidden border border-[#1e2d45]">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Documents timeliness (88%) reflects delayed ARMS feeds.</p>
        </div>

        {/* Visual 3: Packet Readiness Segmented Bars */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider mb-2">
            <span>Packet Readiness</span>
            <MetricPopover metricId="M-504" />
          </div>
          <div className="space-y-3 my-auto">
            {[
              { label: 'Eligibility Verified', pct: 98, color: 'bg-[#00ff88]' },
              { label: 'Documents Assembled', pct: 93, color: 'bg-[#00ff88]' },
              { label: 'Completeness Gate', pct: 96, color: 'bg-[#a855f7]' },
              { label: 'Exceptions Rate', pct: 12, color: 'bg-[#ffb800]' }
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px] font-medium text-slate-300 mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono text-white">{item.pct}%</span>
                </div>
                <div className="w-full h-2 bg-[#05080f] rounded-full overflow-hidden border border-[#1e2d45]">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Lock gate satisfied (Completeness 96% &gt;= 95% target).</p>
        </div>

        {/* Visual 4: Open Issue Aging Segmented Bar */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>Open Issue Aging (6 Total)</span>
            <span className="text-[10px] text-amber-400 font-mono">3 OVERDUE</span>
          </div>

          <div className="my-auto space-y-3">
            <div className="flex h-5 w-full rounded overflow-hidden border border-[#1e2d45]">
              <div style={{ width: '50%' }} className="bg-emerald-600 flex items-center justify-center text-[10px] font-mono text-white" title="3 items < 30 days">
                3
              </div>
              <div style={{ width: '33%' }} className="bg-amber-500 flex items-center justify-center text-[10px] font-mono text-black font-bold" title="2 items 30-60 days">
                2
              </div>
              <div style={{ width: '17%' }} className="bg-red-500 flex items-center justify-center text-[10px] font-mono text-white font-bold" title="1 item > 60 days">
                1
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-slate-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500"></span> &lt; 30 days:</span>
                <span className="font-bold">3 items</span>
              </div>
              <div className="flex items-center justify-between text-amber-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500"></span> 30 to 60 days:</span>
                <span className="font-bold">2 items</span>
              </div>
              <div className="flex items-center justify-between text-red-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-500"></span> &gt; 60 days:</span>
                <span className="font-bold">1 item</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2">Rule: Items &gt;= 30 days require executive attention.</p>
        </div>
      </div>

      {/* KPI Catalog and Accountability Model */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>KPI Catalog and Accountability Model</span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">
                (K-01 through K-11)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Accountability definitions, computed live values, and drill-down links. BMO Lead can click cells to edit text.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search KPI, owner, source, timeframe, or phase..."
                value={kpiSearch}
                onChange={e => setKpiSearch(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[#05080f] border border-[#1e2d45] rounded text-xs text-white focus:outline-hidden focus:border-cyan-400 w-64"
              />
            </div>

            <select
              value={phaseFilter}
              onChange={e => setPhaseFilter(e.target.value)}
              className="px-2.5 py-1 bg-[#05080f] border border-[#1e2d45] rounded text-xs text-slate-300 focus:outline-hidden focus:border-cyan-400"
            >
              <option value="All">All workflow phases</option>
              <option value="Preparation">Preparation</option>
              <option value="Ingestion">Ingestion & Eligibility</option>
              <option value="Document">Document Assembly</option>
              <option value="Execution">Execution</option>
              <option value="Results">Results Finalization</option>
              <option value="Post-Board">Post-Board</option>
              <option value="Cross-Cutting">Cross-Cutting</option>
              <option value="Closeout">Closeout / Improvement</option>
            </select>

            <button
              onClick={() => {
                setKpiSearch('');
                setPhaseFilter('All');
                setSelectedPhase(null);
              }}
              className="px-2.5 py-1 text-xs text-slate-300 bg-[#05080f] border border-[#1e2d45] rounded hover:text-white"
            >
              Reset Filters
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/70 border border-cyan-800 rounded hover:bg-cyan-900 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d45] text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-2 px-3">Phase</th>
                <th className="py-2 px-3">KPI Name</th>
                <th className="py-2 px-3">Live Value</th>
                <th className="py-2 px-3">Numerator</th>
                <th className="py-2 px-3">Denominator</th>
                <th className="py-2 px-3">Timeframe</th>
                <th className="py-2 px-3">Likely Data Source</th>
                <th className="py-2 px-3">Accountable Owner</th>
                <th className="py-2 px-3 text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]/60">
              {filteredKpis.map(item => (
                <tr key={item.id} className="hover:bg-[#0f172a] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-300">{item.phase}</td>

                  {/* KPI Name (Editable) */}
                  <td
                    onClick={() => handleKpiCellClick(item.id, 'kpi', item.kpi)}
                    className="py-2.5 px-3 font-medium text-white cursor-pointer hover:underline"
                    title={state.currentRole === 'BMO Lead' ? 'Click to edit' : undefined}
                  >
                    {editingCell?.kpiId === item.id && editingCell.field === 'kpi' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={handleSaveKpiCell}
                        onKeyDown={e => e.key === 'Enter' && handleSaveKpiCell()}
                        autoFocus
                        className="bg-black text-cyan-300 px-1 py-0.5 border border-cyan-400 rounded w-full"
                      />
                    ) : (
                      item.kpi
                    )}
                  </td>

                  {/* Live Value */}
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-300 whitespace-nowrap">
                    {item.computedValue}
                  </td>

                  {/* Numerator */}
                  <td
                    onClick={() => handleKpiCellClick(item.id, 'numerator', item.numerator)}
                    className="py-2.5 px-3 text-slate-400 max-w-xs cursor-pointer hover:text-slate-200"
                  >
                    {editingCell?.kpiId === item.id && editingCell.field === 'numerator' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={handleSaveKpiCell}
                        onKeyDown={e => e.key === 'Enter' && handleSaveKpiCell()}
                        autoFocus
                        className="bg-black text-cyan-300 px-1 py-0.5 border border-cyan-400 rounded w-full"
                      />
                    ) : (
                      item.numerator
                    )}
                  </td>

                  {/* Denominator */}
                  <td
                    onClick={() => handleKpiCellClick(item.id, 'denominator', item.denominator)}
                    className="py-2.5 px-3 text-slate-400 max-w-xs cursor-pointer hover:text-slate-200"
                  >
                    {editingCell?.kpiId === item.id && editingCell.field === 'denominator' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={handleSaveKpiCell}
                        onKeyDown={e => e.key === 'Enter' && handleSaveKpiCell()}
                        autoFocus
                        className="bg-black text-cyan-300 px-1 py-0.5 border border-cyan-400 rounded w-full"
                      />
                    ) : (
                      item.denominator
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{item.timeframe}</td>
                  <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate italic">{item.likelyDataSource}</td>

                  {/* Accountable Owner */}
                  <td
                    onClick={() => handleKpiCellClick(item.id, 'accountableDataOwner', item.accountableDataOwner)}
                    className="py-2.5 px-3 text-slate-300 whitespace-nowrap font-medium cursor-pointer hover:text-white"
                  >
                    {editingCell?.kpiId === item.id && editingCell.field === 'accountableDataOwner' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={handleSaveKpiCell}
                        onKeyDown={e => e.key === 'Enter' && handleSaveKpiCell()}
                        autoFocus
                        className="bg-black text-cyan-300 px-1 py-0.5 border border-cyan-400 rounded w-full"
                      />
                    ) : (
                      item.accountableDataOwner
                    )}
                  </td>

                  {/* Drilldown Action */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDrillToCandidates(item.drillFilter)}
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      <span>Drill</span> <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipelines & Agents Summary Row */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Pipelines and Automated Agent Gateway (HELIOS Summary)
          </span>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-HeliosCommand' })}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Open HELIOS Command <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex items-center justify-between">
            <div>
              <span className="font-mono text-slate-400 text-[10px]">PIPE-Ingest-Roster</span>
              <div className="font-bold text-white text-sm">99.4% Ingest Success</div>
              <span className="text-[10px] text-emerald-400 font-mono">Synced 5m ago</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>

          <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex items-center justify-between">
            <div>
              <span className="font-mono text-slate-400 text-[10px]">PIPE-MyVector-SOI</span>
              <div className="font-bold text-white text-sm">Real-time Stream</div>
              <span className="text-[10px] text-emerald-400 font-mono">Ticking: 12m sync</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>

          <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex items-center justify-between">
            <div>
              <span className="font-mono text-slate-400 text-[10px]">PIPE-Ingest-ROPE</span>
              <div className="font-bold text-white text-sm">98.1% Validated</div>
              <span className="text-[10px] text-emerald-400 font-mono">Batch 14 complete</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>

          <div className="p-3 bg-[#05080f] border border-amber-800/80 rounded flex items-center justify-between">
            <div>
              <span className="font-mono text-amber-400 text-[10px]">AGENT-Validator</span>
              <div className="font-bold text-amber-300 text-sm">Degraded Latency</div>
              <span className="text-[10px] text-amber-400 font-mono">1 retry available</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* Board Health Forecast (Linear Projection Model) */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Board Health Forecast & Milestone Slippage Projection
          </span>
          <span className="text-xs text-slate-400 font-mono">Linear Slippage Algorithm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {state.boards.slice(0, 3).map(b => {
            const isDelayed = b.status === 'Delayed';
            const isAtRisk = b.status === 'At Risk';
            const projectedDate = isDelayed ? '2026-11-12 (+6d late)' : isAtRisk ? '2026-12-04 (Tight)' : '2026-11-18 (On Schedule)';

            return (
              <div
                key={b.id}
                onClick={() => {
                  dispatch({ type: 'SET_BOARD', boardId: b.id });
                  dispatch({ type: 'SET_VIEW', viewId: 'VIEW-BoardDetail' });
                }}
                className={`p-3 bg-[#05080f] border rounded cursor-pointer transition-all hover:border-cyan-500/70 hover:bg-[#0f172a] ${
                  isDelayed
                    ? 'border-red-800/80 bg-red-950/15'
                    : isAtRisk
                    ? 'border-amber-800/80 bg-amber-950/15'
                    : 'border-[#1e2d45]'
                }`}
                title={`Click to drill down into ${b.name} (${b.id}) statistics and role permissions`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">{b.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isDelayed ? 'bg-red-950 text-red-300' : isAtRisk ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-0.5 mb-2 font-mono">
                  <div>Required Release: <strong className="text-white">{b.releaseDate}</strong></div>
                  <div>Projected Finish: <strong className={isDelayed ? 'text-red-400' : 'text-emerald-400'}>{projectedDate}</strong></div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-[#1e2d45] pt-1.5 flex items-center justify-between">
                  <div className="truncate max-w-[70%]">
                    <span className="font-semibold text-slate-300">Top Driving: </span>
                    {isDelayed ? 'ARMS Socket pull timeout' : 'eBOSS Roster Schema confirmation'}
                  </div>
                  <span className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-medium shrink-0">
                    Stats & Roles <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
