import React, { useState, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { computeBoardStatistics, getBoardRolePermissions, getAllBoardRolePermissions, canExecuteBoardAction } from '../lib/boardStats';
import {
  ShieldAlert,
  Lock,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  FileCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { RequireRole } from '../auth/RequireRole';

const ViewBoardDetailContent: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const [activeTab, setActiveTab] = useState<'overview' | 'scoring' | 'docket' | 'milestones' | 'governance'>('overview');
  const [docketFilter, setDocketFilter] = useState<'All' | 'Pending' | 'Scored' | 'Exceptions'>('All');

  const selectedBoard = useMemo(() => {
    return state.boards.find(b => b.id === state.selectedBoardId) || state.boards[0];
  }, [state.boards, state.selectedBoardId]);

  const boardStats = useMemo(() => {
    return computeBoardStatistics(selectedBoard.id, state);
  }, [selectedBoard.id, state]);

  const rolePerm = useMemo(() => {
    return getBoardRolePermissions(state.currentRole);
  }, [state.currentRole]);

  const allRolePerms = useMemo(() => {
    return getAllBoardRolePermissions();
  }, []);

  // Filter candidates belonging to this board
  const boardCandidates = useMemo(() => {
    return state.candidates.filter(c => c.boardId === selectedBoard.id);
  }, [state.candidates, selectedBoard.id]);

  const filteredCandidates = useMemo(() => {
    return boardCandidates.filter(c => {
      if (docketFilter === 'Pending') return c.scores.length === 0;
      if (docketFilter === 'Scored') return c.scores.length > 0;
      if (docketFilter === 'Exceptions') return c.packetReadiness.exceptions.length > 0;
      return true;
    });
  }, [boardCandidates, docketFilter]);

  // Action permissions
  const lockPermission = canExecuteBoardAction(state.currentRole, 'LOCK_POPULATION', boardStats);
  const certifyPermission = canExecuteBoardAction(state.currentRole, 'CERTIFY_OOM', boardStats);
  const clearExceptionsPermission = canExecuteBoardAction(state.currentRole, 'CLEAR_EXCEPTIONS', boardStats);

  // Score distribution for chart
  const scoreDistributionData = useMemo(() => {
    const bins: Record<string, number> = {
      '6.0-6.5': 0,
      '7.0-7.5': 0,
      '8.0-8.5': 0,
      '9.0-9.5': 0,
      '10.0': 0
    };
    boardCandidates.forEach(c => {
      c.scores.forEach(s => {
        if (s.value < 7.0) bins['6.0-6.5']++;
        else if (s.value < 8.0) bins['7.0-7.5']++;
        else if (s.value < 9.0) bins['8.0-8.5']++;
        else if (s.value < 10.0) bins['9.0-9.5']++;
        else bins['10.0']++;
      });
    });
    return Object.entries(bins).map(([bin, count]) => ({ bin, count }));
  }, [boardCandidates]);

  const handleSelectBoard = (boardId: string) => {
    dispatch({ type: 'SET_BOARD', boardId });
  };

  const handleInspectCandidate = (candidateId: string) => {
    dispatch({ type: 'SELECT_CANDIDATE', candidateId });
    dispatch({ type: 'SET_VIEW', viewId: 'VIEW-PanelReview' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Board Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2d45] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{selectedBoard.name}</span>
            </h1>
            <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              {selectedBoard.id}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                selectedBoard.status === 'On Track'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                  : selectedBoard.status === 'At Risk'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                  : selectedBoard.status === 'Delayed'
                  ? 'bg-red-950/80 text-red-300 border border-red-700 animate-pulse'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-700'
              }`}
            >
              {selectedBoard.status}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
            <span>Start: <strong className="text-slate-200">{selectedBoard.startDate}</strong></span>
            <span>·</span>
            <span>Lock Gate: <strong className="text-slate-200">{selectedBoard.lockDate}</strong></span>
            <span>·</span>
            <span>Release: <strong className="text-slate-200">{selectedBoard.releaseDate}</strong></span>
            <span>·</span>
            <span>Owner: <strong className="text-slate-200">{selectedBoard.ownerId}</strong></span>
            <span>·</span>
            <span>Population: <strong className="text-cyan-400">{boardStats.totalCandidates} Candidates</strong></span>
          </p>
        </div>

        {/* Board Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 shrink-0">Switch Board:</label>
          <select
            value={selectedBoard.id}
            onChange={e => handleSelectBoard(e.target.value)}
            className="bg-[#0a1020] text-xs font-mono text-cyan-300 border border-[#1e2d45] rounded px-3 py-1.5 focus:border-cyan-500 focus:outline-none"
          >
            {state.boards.map(b => (
              <option key={b.id} value={b.id}>
                {b.id} - {b.name} ({b.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Permission & Security Banner */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 relative overflow-hidden shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Active Perspective:
              </span>
              <span className="font-bold text-white text-sm">{state.currentRole}</span>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded border font-semibold"
                style={{
                  backgroundColor: `${rolePerm.badgeColor}20`,
                  color: rolePerm.badgeColor,
                  borderColor: `${rolePerm.badgeColor}60`
                }}
              >
                {rolePerm.accessLevel}
              </span>
            </div>
            <p className="text-xs text-slate-300">{rolePerm.description}</p>
          </div>

          {/* Quick Action Buttons Gated by Role Permissions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Lock Population Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => dispatch({ type: 'LOCK_POPULATION', boardId: selectedBoard.id })}
                disabled={!lockPermission.allowed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium font-mono transition-colors border ${
                  lockPermission.allowed
                    ? 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-700 cursor-pointer'
                    : 'bg-[#05080f] text-slate-500 border-[#1e2d45] cursor-not-allowed opacity-60'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Population</span>
              </button>
              {!lockPermission.allowed && lockPermission.reason && (
                <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-[#05080f] border border-[#1e2d45] rounded text-[11px] text-amber-300 shadow-xl z-30 hidden group-hover:block pointer-events-none">
                  {lockPermission.reason}
                </div>
              )}
            </div>

            {/* Certify OOM Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => dispatch({ type: 'CERTIFY_OOM', boardId: selectedBoard.id })}
                disabled={!certifyPermission.allowed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium font-mono transition-colors border ${
                  certifyPermission.allowed
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-700 cursor-pointer'
                    : 'bg-[#05080f] text-slate-500 border-[#1e2d45] cursor-not-allowed opacity-60'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certify OOM</span>
              </button>
              {!certifyPermission.allowed && certifyPermission.reason && (
                <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-[#05080f] border border-[#1e2d45] rounded text-[11px] text-amber-300 shadow-xl z-30 hidden group-hover:block pointer-events-none">
                  {certifyPermission.reason}
                </div>
              )}
            </div>

            {/* Clear Exceptions Button */}
            {clearExceptionsPermission.allowed && boardStats.packetReadiness.exceptionsCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'CLEAR_BOARD_EXCEPTIONS', boardId: selectedBoard.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium font-mono bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700 cursor-pointer transition-colors"
                title="Resolve and clear packet schema exceptions for this candidate roster"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Clear Exceptions</span>
              </button>
            )}

            {/* Navigate to Candidate Queue */}
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'SET_BOARD', boardId: selectedBoard.id });
                dispatch({ type: 'SET_VIEW', viewId: 'VIEW-CandidateQueue' });
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-slate-200 bg-[#05080f] border border-[#1e2d45] hover:border-cyan-500/60 transition-colors"
            >
              <span>View Docket</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Firewall Rule 5 Alert for Panelists */}
        {rolePerm.firewallActive && (
          <div className="mt-3 pt-3 border-t border-[#1e2d45] flex items-center gap-2 text-xs text-amber-300 bg-amber-950/20 px-3 py-2 rounded border border-amber-900/60">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-amber-200">Rule 5 Firewall Enforced:</span> Post-board talent data, peer panelist unfinalized ballots, and Order of Merit ranks are strictly redacted from your perspective.
            </div>
          </div>
        )}
      </div>

      {/* 4 Core Board Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Population & Funnel */}
        <div className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-cyan-500 rounded-md p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase font-mono">
            <span>Population & Stage</span>
            <span className="text-cyan-400">{boardStats.totalCandidates} Total</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {boardStats.stageCounts.finalized} / {boardStats.totalCandidates}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
            <span>Finalized: {boardStats.stagePercentages.finalized}%</span>
            <span>Scoring: {boardStats.stagePercentages.scoring}%</span>
          </div>
          {/* Progress Mini Bar */}
          <div className="w-full h-1.5 bg-[#05080f] rounded-full overflow-hidden flex">
            <div style={{ width: `${boardStats.stagePercentages.finalized}%` }} className="bg-blue-500" title="Finalized" />
            <div style={{ width: `${boardStats.stagePercentages.scoring}%` }} className="bg-cyan-500" title="Scoring" />
            <div style={{ width: `${boardStats.stagePercentages.locked}%` }} className="bg-emerald-500" title="Locked" />
            <div style={{ width: `${boardStats.stagePercentages.validated}%` }} className="bg-amber-500" title="Validated" />
            <div style={{ width: `${boardStats.stagePercentages.ingested}%` }} className="bg-purple-500" title="Ingested" />
          </div>
        </div>

        {/* Card 2: Scoring Completion & Pace */}
        <div className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-emerald-500 rounded-md p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase font-mono">
            <span>Scoring Progress</span>
            <span className="text-emerald-400">{boardStats.scoring.completionRate}% Done</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {boardStats.scoring.scoredCount} / {boardStats.totalCandidates}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
            <span>Pool Avg: <strong className="text-white">{boardStats.scoring.poolAvgScore}</strong></span>
            <span>Est: ~{boardStats.scoring.estimatedHoursRemaining}h remaining</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Heartburn cases: <strong className={boardStats.scoring.heartburnCount > 0 ? 'text-amber-400' : 'text-slate-300'}>{boardStats.scoring.heartburnCount}</strong>
          </div>
        </div>

        {/* Card 3: Packet Check & Gate */}
        <div className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-purple-500 rounded-md p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase font-mono">
            <span>Packet Completeness</span>
            <span className={`font-bold ${boardStats.packetReadiness.readyToLock ? 'text-emerald-400' : 'text-amber-400'}`}>
              {boardStats.packetReadiness.completenessRate}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {boardStats.packetReadiness.completenessRate}%
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
            <span>Lock Gate: ≥95% (M-504)</span>
            <span className={boardStats.packetReadiness.readyToLock ? 'text-emerald-400' : 'text-amber-400'}>
              {boardStats.packetReadiness.readyToLock ? 'PASSED' : 'BLOCKED'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Schema exceptions: <strong className={boardStats.packetReadiness.exceptionsCount > 0 ? 'text-amber-400' : 'text-slate-300'}>{boardStats.packetReadiness.exceptionsCount}</strong>
          </div>
        </div>

        {/* Card 4: Milestones & Critical Slippage */}
        <div className="bg-[#0a1020] border border-[#1e2d45] border-t-4 border-t-[#2E86AB] rounded-md p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase font-mono">
            <span>Phase & Milestones</span>
            <span className="text-blue-400">Phase {boardStats.milestones.currentPhase} / 8</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {boardStats.milestones.doneCount} / {boardStats.milestones.totalCount}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
            <span>On Track: {boardStats.milestones.completionRate}%</span>
            <span>Critical Path:</span>
          </div>
          <div className="text-[10px] font-mono">
            {boardStats.milestones.criticalPathSlippageDays > 0 ? (
              <span className="text-red-400 font-semibold">+{boardStats.milestones.criticalPathSlippageDays}d slippage</span>
            ) : (
              <span className="text-emerald-400">Zero delay on critical path</span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="border-b border-[#1e2d45] flex items-center gap-2 overflow-x-auto text-xs font-medium">
        {[
          { id: 'overview', label: 'Overview & Stage-Gate Funnel' },
          { id: 'scoring', label: 'Scoring & Evaluator Analytics' },
          { id: 'docket', label: `Candidate Docket (${boardCandidates.length})` },
          { id: 'milestones', label: `Milestones & Risks (${boardStats.milestones.totalCount})` },
          { id: 'governance', label: 'Board Governance & Role Permissions' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & FUNNEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 5-Stage Funnel */}
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              <span>Five-Stage Board Processing Funnel</span>
              <span className="text-slate-400 text-[11px]">Counts & Stage Velocity</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[
                { stage: 'Ingested', count: boardStats.stageCounts.ingested, pct: boardStats.stagePercentages.ingested, color: 'text-purple-400', desc: 'Raw records queued from eBOSS' },
                { stage: 'Validated', count: boardStats.stageCounts.validated, pct: boardStats.stagePercentages.validated, color: 'text-amber-400', desc: 'Schema checked; exceptions identified' },
                { stage: 'Locked', count: boardStats.stageCounts.locked, pct: boardStats.stagePercentages.locked, color: 'text-emerald-400', desc: 'Population sealed; updates frozen' },
                { stage: 'Scoring', count: boardStats.stageCounts.scoring, pct: boardStats.stagePercentages.scoring, color: 'text-cyan-400', desc: 'Active panel evaluation underway' },
                { stage: 'Finalized', count: boardStats.stageCounts.finalized, pct: boardStats.stagePercentages.finalized, color: 'text-blue-400', desc: 'Ballots certified; OOM generated' }
              ].map(stg => (
                <div key={stg.stage} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{stg.stage}</span>
                    <span className="font-bold text-white">{stg.count}</span>
                  </div>
                  <div className={`text-xl font-bold font-mono ${stg.color}`}>
                    {stg.pct}%
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">{stg.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Source Freshness & Staffing Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Freshness for this board */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                <span>Authoritative Source Freshness</span>
                <span className="text-[11px] text-slate-400">Board Docket Refresh</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'ARMS (Aviation Resource Mgmt)', age: `${boardStats.sourceFreshness.arms.lastSyncHoursAgo}h ago`, status: boardStats.sourceFreshness.arms.status, rule: 'amber >12h, red >24h' },
                  { name: 'MilPDS (Personnel Data System)', age: `${boardStats.sourceFreshness.milpds.lastSyncHoursAgo}h ago`, status: boardStats.sourceFreshness.milpds.status, rule: 'amber >24h, red >48h' },
                  { name: 'MyVector (Talent Marketplace)', age: `${boardStats.sourceFreshness.myvector.lastSyncHoursAgo}h ago`, status: boardStats.sourceFreshness.myvector.status, rule: 'amber >24h, red >72h' },
                  { name: 'SURF (Single Unified Record File)', age: `${boardStats.sourceFreshness.surf.lastSyncDaysAgo}d ago`, status: boardStats.sourceFreshness.surf.status, rule: 'amber >1d, red >7d' }
                ].map(src => (
                  <div key={src.name} className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200 block">{src.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Sync: {src.age} · Threshold: {src.rule}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      src.status === 'green' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      src.status === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                    }`}>
                      {src.status === 'green' ? 'Fresh' : src.status === 'amber' ? 'Stale (Warn)' : 'Expired (Red)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Board Staffing Quorum */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                <span>Board Staffing & Panel Quorum</span>
                <span className="text-[11px] text-slate-400">M-505</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">Board President</span>
                    <span className="text-[10px] text-slate-400">Senior flag officer governance role</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Assigned & Confirmed
                  </span>
                </div>

                <div className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">Evaluation Panelists</span>
                    <span className="text-[10px] text-slate-400">Assigned scoring members: 6 primaries + alternates</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {boardStats.staffing.panelistSlots} Slots Filled
                  </span>
                </div>

                <div className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">Board Recorders & Scribes</span>
                    <span className="text-[10px] text-slate-400">Operational recording and quorum verification</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    2 Scribes Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCORING & EVALUATOR ANALYTICS */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score Distribution Histogram */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                <span>Score Distribution Histogram (6.0 - 10.0)</span>
                <span className="text-[11px] text-slate-400">StdDev: ±{boardStats.scoring.scoreSpread.stdDev}</span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0a1020', borderColor: '#1e2d45', fontSize: '11px' }}
                      formatter={(val?: number | string | readonly (number | string)[]) => [`${val} Scores`, 'Count']}
                    />
                    <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]}>
                      {scoreDistributionData.map((_, index) => (
                        <Cell key={`bar-${index}`} fill={index > 2 ? '#00d4ff' : '#2E86AB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1 border-t border-[#1e2d45]">
                <span>Min Score: <strong>{boardStats.scoring.scoreSpread.min}</strong></span>
                <span>Pool Avg: <strong className="text-cyan-300">{boardStats.scoring.poolAvgScore}</strong></span>
                <span>Max Score: <strong>{boardStats.scoring.scoreSpread.max}</strong></span>
              </div>
            </div>

            {/* Evaluator Heartburn & Divergence Monitor */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Evaluator Heartburn / Divergence Monitor
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Gap ≥ 1.5 pts</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Candidates where an evaluator score diverges from panel consensus by ≥ 1.5 points. Requires adjudication or upholding in the Scoring Audit chamber.
                </p>

                <div className="space-y-2 text-xs">
                  {boardCandidates
                    .filter(c => {
                      if (c.myScore === null || c.scores.length === 0) return false;
                      const avg = c.scores.reduce((sum, s) => sum + s.value, 0) / c.scores.length;
                      return Math.abs(c.myScore - avg) >= 1.5;
                    })
                    .slice(0, 3)
                    .map(c => {
                      const avg = c.scores.reduce((sum, s) => sum + s.value, 0) / c.scores.length;
                      const gap = Math.abs((c.myScore || 0) - avg);
                      return (
                        <div key={c.id} className="p-2.5 bg-[#05080f] border border-amber-900/60 rounded flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-white block">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              My Score: {c.myScore?.toFixed(1)} · Panel Avg: {avg.toFixed(1)} · Gap: {gap.toFixed(1)} pts
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-ScoringAudit' })}
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <span>Adjudicate</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  {boardStats.scoring.heartburnCount === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 bg-[#05080f] border border-[#1e2d45] rounded">
                      No evaluator heartburn outliers identified. Panelist scoring remains within consensus tolerance (&lt;1.5 pts).
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e2d45] flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Scoring Pace: 14.5 records/hr</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-ScoringAudit' })}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Open Scoring Audit Chamber →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATE DOCKET */}
      {activeTab === 'docket' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1020] p-3 rounded-md border border-[#1e2d45]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Filter Docket:</span>
              {(['All', 'Pending', 'Scored', 'Exceptions'] as const).map(flt => (
                <button
                  key={flt}
                  type="button"
                  onClick={() => setDocketFilter(flt)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    docketFilter === flt
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'bg-[#05080f] text-slate-400 border border-[#1e2d45] hover:text-white'
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredCandidates.length}</strong> of {boardCandidates.length} candidates
            </div>
          </div>

          <div className="overflow-x-auto bg-[#0a1020] border border-[#1e2d45] rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-[11px] font-mono text-slate-400 uppercase bg-[#05080f]">
                  <th className="py-2.5 px-3">Candidate ID</th>
                  <th className="py-2.5 px-3">Officer Name</th>
                  <th className="py-2.5 px-3">Grade / DAFSC</th>
                  <th className="py-2.5 px-3">Look Status</th>
                  <th className="py-2.5 px-3">Stage Gate</th>
                  <th className="py-2.5 px-3">Scores (Pool / My)</th>
                  <th className="py-2.5 px-3">Packet Check</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60 font-mono">
                {filteredCandidates.map(c => {
                  const poolAvg = c.scores.length > 0
                    ? (c.scores.reduce((sum, s) => sum + s.value, 0) / c.scores.length).toFixed(1)
                    : '—';
                  const hasExceptions = c.packetReadiness.exceptions.length > 0;

                  return (
                    <tr key={c.id} className="hover:bg-[#0f172a] transition-colors">
                      <td className="py-2.5 px-3 text-cyan-400 font-bold">{c.id}</td>
                      <td className="py-2.5 px-3 text-white font-sans font-medium">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.grade} · {c.dafsc}</td>
                      <td className="py-2.5 px-3 text-slate-400">{c.lookStatus}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          c.flow.stage === 'Finalized' ? 'bg-blue-950 text-blue-300' :
                          c.flow.stage === 'Scoring' ? 'bg-cyan-950 text-cyan-300' :
                          c.flow.stage === 'Locked' ? 'bg-emerald-950 text-emerald-300' :
                          'bg-amber-950 text-amber-300'
                        }`}>
                          {c.flow.stage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span>{poolAvg}</span>
                        {c.myScore !== null && (
                          <span className="text-cyan-300 ml-1.5">(My: {c.myScore.toFixed(1)})</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {hasExceptions ? (
                          <span className="text-amber-400 flex items-center gap-1 text-[11px]" title={c.packetReadiness.exceptions.join('; ')}>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{c.packetReadiness.exceptions.length} Exception</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Complete</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleInspectCandidate(c.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans font-medium"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-sans text-xs">
                      No candidates match the selected docket filter ({docketFilter}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MILESTONES & RISKS */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              <span>Planned vs Actual Milestones (16 Milestones across 8 Phases)</span>
              <span className="text-slate-400 text-[11px]">Board ID: {selectedBoard.id}</span>
            </div>

            <div className="space-y-2 text-xs">
              {state.milestones
                .filter(m => m.boardId === selectedBoard.id)
                .map(m => (
                  <div key={m.id} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                          Phase {m.phase}
                        </span>
                        <span className="font-semibold text-white">{m.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Planned: <strong className="text-slate-300">{m.planned}</strong> · Actual: <strong className={m.actual ? 'text-emerald-400' : 'text-slate-500'}>{m.actual || 'Pending'}</strong> · Owner: {m.owner}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase self-start sm:self-center ${
                      m.status === 'Done' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      m.status === 'On Track' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                      m.status === 'At Risk' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Risks for this board */}
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
              <span>Active Risks & Issues for this Board</span>
              <span className="text-slate-400 text-[11px]">Suspense Tracking</span>
            </div>

            <div className="space-y-2 text-xs">
              {state.risks.filter(r => r.boardId === selectedBoard.id).map(r => (
                <div key={r.id} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        r.type === 'Issue' ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                      }`}>
                        {r.type}
                      </span>
                      <span className="font-semibold text-white">{r.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Suspense: {r.suspense}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    <strong className="text-slate-400">Mitigation: </strong>{r.mitigation}
                  </p>
                </div>
              ))}
              {state.risks.filter(r => r.boardId === selectedBoard.id).length === 0 && (
                <div className="text-xs text-slate-400 p-3 text-center bg-[#05080f] rounded border border-[#1e2d45]">
                  No open risks or issues logged for this board cycle.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOVERNANCE & ROLE PERMISSIONS MATRIX */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Board Governance & Multi-Role Permission Matrix</span>
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  RULE 5 GOVERNANCE
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Defines explicit capability boundaries, firewall constraints, and administrative powers for each of the six enterprise roles across this board cycle.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1e2d45] text-[11px] font-mono text-slate-400 uppercase bg-[#05080f]">
                    <th className="py-2.5 px-3">Role & Perspective</th>
                    <th className="py-2.5 px-3">Access Level</th>
                    <th className="py-2.5 px-3 text-center">Population Lock</th>
                    <th className="py-2.5 px-3 text-center">Score Docket</th>
                    <th className="py-2.5 px-3 text-center">Certify OOM</th>
                    <th className="py-2.5 px-3 text-center">Edit Milestones</th>
                    <th className="py-2.5 px-3 text-center">Rule 5 Firewall</th>
                    <th className="py-2.5 px-3">Key Permitted Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d45]/60 text-xs">
                  {allRolePerms.map(p => {
                    const isCurrent = p.role === state.currentRole;
                    return (
                      <tr
                        key={p.role}
                        className={`transition-colors ${
                          isCurrent ? 'bg-cyan-950/30' : 'hover:bg-[#0f172a]'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{p.role}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-700">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">{p.title}</span>
                        </td>

                        <td className="py-3 px-3 font-mono">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded border font-semibold inline-block"
                            style={{
                              backgroundColor: `${p.badgeColor}20`,
                              color: p.badgeColor,
                              borderColor: `${p.badgeColor}60`
                            }}
                          >
                            {p.accessLevel}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {p.canLockPopulation ? (
                            <span className="text-emerald-400 font-mono font-bold">YES</span>
                          ) : (
                            <span className="text-slate-600 font-mono">NO</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {p.canScoreCandidates ? (
                            <span className="text-emerald-400 font-mono font-bold">YES</span>
                          ) : (
                            <span className="text-slate-600 font-mono">NO</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {p.canCertifyOom ? (
                            <span className="text-emerald-400 font-mono font-bold">YES</span>
                          ) : (
                            <span className="text-slate-600 font-mono">NO</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {p.canEditMilestones ? (
                            <span className="text-emerald-400 font-mono font-bold">YES</span>
                          ) : (
                            <span className="text-slate-600 font-mono">NO</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {p.firewallActive ? (
                            <span className="text-amber-400 font-mono font-bold flex items-center justify-center gap-1" title="Firewall Rule 5 is strictly active">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                              <span>ACTIVE</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">EXEMPT</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <ul className="text-[10px] text-slate-300 space-y-0.5 list-disc list-inside">
                            {p.allowedActions.slice(0, 3).map((act, i) => (
                              <li key={i}>{act}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ViewBoardDetail: React.FC = () => (
  <RequireRole viewId="VIEW-BoardDetail">
    <ViewBoardDetailContent />
  </RequireRole>
);
