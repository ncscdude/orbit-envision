import React, { useState, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { MetricPopover } from '../components/MetricPopover';
import {
  Calendar,
  AlertTriangle,
  Printer,
  Search,
  ExternalLink,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu
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
    { num: 1, name: 'Cycle Stand-Up', scope: 'Confirm billets and population, name the board president, open the cycle.', count: 0, health: 'green' },
    { num: 2, name: 'Solicitation & Planning', scope: 'Release the PSDM, open the SOI window, set the cycle schedule.', count: 0, health: 'green' },
    { num: 3, name: 'Roster Intake', scope: 'Run PIPE-Ingest-Roster, auto-flag limitation codes, confirm who is in.', count: state.candidates.filter(c => c.flow.stage === 'Ingested' || c.flow.stage === 'Validated').length, health: 'amber' },
    { num: 4, name: 'Record Prep & Freeze', scope: 'Pull SOI, ROP, ARMS, and SURF data, close packet gaps, freeze records.', count: state.candidates.filter(c => c.flow.stage === 'Locked').length, health: 'green' },
    { num: 5, name: 'Record Scoring', scope: 'Panel scores records; Heartburn Review checks outliers (Req 150).', count: state.candidates.filter(c => c.flow.stage === 'Scoring').length, health: 'green' },
    { num: 6, name: 'Order of Merit', scope: 'Build and certify the Order of Merit from verified scores.', count: state.candidates.filter(c => c.flow.stage === 'Finalized').length, health: 'green' },
    { num: 7, name: 'Matching & Placement', scope: 'Run PIPE-Match-Run (Req 149), review exceptions, adjudicate waivers.', count: 0, health: 'green' },
    { num: 8, name: 'Results Release & AAR', scope: 'Publish the results PSDM, close the audit package, draft the AAR.', count: 0, health: 'green' }
  ];

  // Cycle status donut data
  const statusCount = (s: string) => state.boards.filter(b => b.status === s).length;
  const boardStatusData = [
    { name: 'On Track', value: statusCount('On Track'), color: '#00ff88' },
    { name: 'At Risk', value: statusCount('At Risk'), color: '#ffb800' },
    { name: 'Delayed', value: statusCount('Delayed'), color: '#ff4757' },
    { name: 'Complete', value: statusCount('Complete'), color: '#2E86AB' }
  ];

  // Schedule adherence, computed from the milestone log
  const pctOnTrack = (list: { status: string }[]) =>
    list.length === 0 ? 0 : Math.round((100 * list.filter(m => m.status === 'Done' || m.status === 'On Track').length) / list.length);
  const scheduleOnTrackPct = pctOnTrack(state.milestones);
  const scheduleByGroup = [
    { label: 'Planning', pct: pctOnTrack(state.milestones.filter(m => m.phase <= 2)) },
    { label: 'Roster Intake', pct: pctOnTrack(state.milestones.filter(m => m.phase === 3)) },
    { label: 'Record Prep', pct: pctOnTrack(state.milestones.filter(m => m.phase === 4)) },
    { label: 'Scoring', pct: pctOnTrack(state.milestones.filter(m => m.phase === 5)) }
  ].map(g => ({ ...g, color: g.pct >= 90 ? 'bg-[#00ff88]' : 'bg-[#ffb800]' }));
  const recordPrepPct = scheduleByGroup[2].pct;

  // Item age buckets, computed from the risk and issue log against the seed reference date
  const AGE_REFERENCE_DATE = Date.parse('2026-10-26T00:00:00Z');
  const openItems = state.risks.filter(r => r.status === 'Open');
  const ageDays = (d: string) => Math.floor((AGE_REFERENCE_DATE - Date.parse(`${d}T00:00:00Z`)) / 86400000);
  const ageUnder30 = openItems.filter(r => ageDays(r.opened) < 30).length;
  const age30to60 = openItems.filter(r => ageDays(r.opened) >= 30 && ageDays(r.opened) <= 60).length;
  const ageOver60 = openItems.filter(r => ageDays(r.opened) > 60).length;
  const itemsNeedingAction = age30to60 + ageOver60;
  const agePct = (n: number) => (openItems.length === 0 ? 0 : Math.round((100 * n) / openItems.length));

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
        (selectedPhase === 1 && k.phase.includes('Planning')) ||
        (selectedPhase === 2 && k.phase.includes('Planning')) ||
        (selectedPhase === 3 && k.phase.includes('Roster Intake')) ||
        (selectedPhase === 4 && k.phase.includes('Record Prep')) ||
        (selectedPhase === 5 && k.phase.includes('Record Scoring')) ||
        (selectedPhase === 6 && k.phase.includes('Order of Merit')) ||
        (selectedPhase === 7 && k.phase.includes('Matching')) ||
        (selectedPhase === 8 && k.phase.includes('Results Release'));

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
          <span>ORBIT Command Center</span>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
            EXECUTIVE COMMAND
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Cycle status, stage-gate flow, readiness, and open items across every board cycle.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="p-3 bg-[#0a1020] border-l-4 border-l-cyan-400 border border-[#1e2d45] rounded-r-md text-xs text-slate-300 flex items-start justify-between gap-3 shadow-md">
        <div>
          <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px] mr-2">
            Demo data:
          </span>
          All records are fictional. BMO Lead can edit KPI text. Numbers are computed from seed data and are not real performance.
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
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#2E86AB] rounded-md p-4 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
          title="Drill down to individual board statistics, stage-gates, and role permissions"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Active Boards</span>
            <span className="text-[10px] font-mono text-cyan-400">{`BRD-001..${String(state.boards.length).padStart(3, '0')}`}</span>
          </div>
          <div className="text-3xl font-bold font-mono text-white mt-1">{state.boards.length}</div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1 font-medium">
            <span>Drill to Board Statistics</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* Schedule On Track */}
        <div
          onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#00ff88] rounded-md p-4 hover:border-emerald-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Schedule On Track</span>
            <span className="text-[10px] font-mono text-emerald-400">~200 TASKS</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#00ff88] mt-1">{scheduleOnTrackPct}%</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{`Across all ${state.boards.length} board cycles`}</span>
            <ArrowRight className="w-3 h-3 text-emerald-400" />
          </div>
        </div>

        {/* Packet Completeness */}
        <div
          onClick={() => handleDrillToCandidates('Exceptions')}
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#a855f7] rounded-md p-4 hover:border-purple-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Packet Completeness</span>
            <MetricPopover metricId="M-504" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#c084fc] mt-1">97%</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Click to review 4 exceptions</span>
            <ArrowRight className="w-3 h-3 text-purple-400" />
          </div>
        </div>

        {/* Items Needing Action */}
        <div
          onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
          className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#ffb800] rounded-md p-4 hover:border-amber-500/50 cursor-pointer transition-all hover:bg-[#0f172a]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
            <span>Items Needing Action</span>
            <span className="text-[10px] font-mono text-amber-400">&gt;30 DAYS</span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#ffb800] mt-1">{itemsNeedingAction}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{`${age30to60} aged 30-60d · ${ageOver60} aged over 60d`}</span>
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
                    ? 'bg-[#2E86AB]/15 border-[#2E86AB]/50 hover:border-cyan-400'
                    : 'bg-[#6B4FA0]/15 border-[#6B4FA0]/50 hover:border-purple-400'
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
                <Calendar className="w-3.5 h-3.5" /> Schedule & Milestones
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Open Log <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Next milestones by cycle with planned and actual dates, owner, and status.
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
                <AlertTriangle className="w-3.5 h-3.5" /> Risk & Issue Log
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-OpsRegisters' })}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                Open Log <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Open risks and issues with suspense date, owner, and escalation flag.
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
            <Layers className="w-3.5 h-3.5" /> ORBIT Data Logs (Clickable)
          </span>
          <span className="text-slate-400 text-[11px]">Direct integration to VIEW-OpsRegisters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {[
            { name: 'Cycle Log', sub: 'All BRD cycles' },
            { name: 'Milestone Log', sub: 'Planned vs Actual' },
            { name: 'Packet Check', sub: 'SOI, ROP, ARMS, SURF' },
            { name: 'Action Items', sub: 'Overdue Nudges' },
            { name: 'Risk & Issue Log', sub: 'Age & Escalation' },
            { name: 'Results & Placement', sub: 'OoM & PSDM' }
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
            <span className="font-mono text-slate-400 font-semibold uppercase">Data Flow:</span>
            <span className="text-slate-300">PIPE ingest · PDO objects · DELTA ledger</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300">
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Stage Gate</span>
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Freshness</span>
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Readiness</span>
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Item Age</span>
          </div>
        </div>
      </div>

      {/* Four Visuals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visual 1: Cycle Status Donut */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <span>{`Cycle Status (${state.boards.length} Cycles)`}</span>
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
              <span className="text-xl font-bold font-mono text-white">{state.boards.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Cycles</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono mt-2">
            <span className="text-[#00ff88]">● {statusCount('On Track')} On Track</span>
            <span className="text-[#ffb800]">● {statusCount('At Risk')} At Risk</span>
            <span className="text-[#ff4757]">● {statusCount('Delayed')} Delayed</span>
            <span className="text-[#2E86AB]">● {statusCount('Complete')} Complete</span>
          </div>
        </div>

        {/* Visual 2: Schedule Adherence Bar Gauges */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <span>Schedule Adherence</span>
            <span className="text-[10px] text-slate-400 font-mono">{`ALL ${scheduleOnTrackPct}%`}</span>
          </div>
          <div className="space-y-3 my-auto">
            {scheduleByGroup.map(item => (
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
          <p className="text-[10px] text-slate-400 mt-2">{`Record Prep at ${recordPrepPct}% reflects delayed ARMS feeds.`}</p>
        </div>

        {/* Visual 3: Packet Check Bars */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider mb-2">
            <span>Packet Check</span>
            <MetricPopover metricId="M-504" />
          </div>
          <div className="space-y-3 my-auto">
            {[
              { label: 'Eligibility Confirmed', pct: 99, color: 'bg-[#00ff88]' },
              { label: 'Records Pulled', pct: 94, color: 'bg-[#00ff88]' },
              { label: 'Lock Gate (M-504)', pct: 97, color: 'bg-[#a855f7]' },
              { label: 'Open Exceptions', pct: 9, color: 'bg-[#ffb800]' }
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
          <p className="text-[10px] text-slate-400 mt-2">Lock gate met: 97% against the 95% rule.</p>
        </div>

        {/* Visual 4: Item Age Bar */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <span>{`Item Age (${openItems.length} Open)`}</span>
            <span className="text-[10px] text-amber-400 font-mono">{`${itemsNeedingAction} NEED ACTION`}</span>
          </div>

          <div className="my-auto space-y-3">
            <div className="flex h-5 w-full rounded overflow-hidden border border-[#1e2d45]">
              <div style={{ width: `${agePct(ageUnder30)}%` }} className="bg-emerald-600 flex items-center justify-center text-[10px] font-mono text-white" title="Items under 30 days">
                {ageUnder30}
              </div>
              <div style={{ width: `${agePct(age30to60)}%` }} className="bg-amber-500 flex items-center justify-center text-[10px] font-mono text-black font-bold" title="Items 30 to 60 days">
                {age30to60}
              </div>
              <div style={{ width: `${agePct(ageOver60)}%` }} className="bg-red-500 flex items-center justify-center text-[10px] font-mono text-white font-bold" title="Items over 60 days">
                {ageOver60}
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-slate-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500"></span> &lt; 30 days:</span>
                <span className="font-bold">{ageUnder30} items</span>
              </div>
              <div className="flex items-center justify-between text-amber-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500"></span> 30 to 60 days:</span>
                <span className="font-bold">{age30to60} items</span>
              </div>
              <div className="flex items-center justify-between text-red-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-red-500"></span> &gt; 60 days:</span>
                <span className="font-bold">{ageOver60} items</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2">Rule: items open 30 days or more need action.</p>
        </div>
      </div>

      {/* KPI Catalog */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>KPI Catalog and Owners</span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">
                (K-01 through K-11)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Definitions, owners, values, and drill-down links. BMO Lead can click cells to edit text.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by KPI, phase, owner, or source"
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
              <option value="All">All phases</option>
              <option value="Planning">Solicitation & Planning</option>
              <option value="Roster Intake">Roster Intake</option>
              <option value="Record Prep">Record Prep & Freeze</option>
              <option value="Record Scoring">Record Scoring</option>
              <option value="Order of Merit">Order of Merit</option>
              <option value="Matching">Matching & Placement</option>
              <option value="All Phases">All Phases</option>
              <option value="Results Release">Results Release & AAR</option>
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
