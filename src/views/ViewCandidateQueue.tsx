import React, { useState, useMemo, useEffect } from 'react';
import { useOrbit } from '../state/context';
import { Candidate } from '../types';
import { MetricPopover } from '../components/MetricPopover';
import {
  Search,
  Shuffle,
  Filter,
  CheckCircle2,
  Clock,
  Flag,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Award,
  Sparkles,
  BarChart3
} from 'lucide-react';

export const ViewCandidateQueue: React.FC = () => {
  const { state, dispatch, useMetric } = useOrbit();
  const [hoveredCandidate, setHoveredCandidate] = useState<Candidate | null>(null);
  const [sortField, setSortField] = useState<'name' | 'grade' | 'dafsc' | 'llmFitScore' | 'status'>('llmFitScore');
  const [sortAsc, setSortAsc] = useState(false);

  // Keyboard shortcut Ctrl+J to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        const searchInput = document.getElementById('candidate-queue-search');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Board selector options
  const selectableBoards = state.boards.slice(0, 4);

  // Compute pool counters
  const pool = state.candidates;
  const scoredCount = pool.filter(c => c.myScore !== null || c.scores.length > 0).length;
  const pendingCount = pool.filter(c => c.myScore === null && c.scores.length === 0).length;
  const flaggedCount = pool.filter(c => c.flagged).length;

  const m401 = useMetric('M-401');
  const m402 = useMetric('M-402');
  const m403 = useMetric('M-403');

  // Filtered & sorted candidates
  const filteredCandidates = useMemo(() => {
    let list = [...state.candidates];

    // Search filter
    if (state.candidateFilterText.trim()) {
      const q = state.candidateFilterText.toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.dodId.includes(q) ||
          c.dafsc.toLowerCase().includes(q) ||
          c.currentUnit.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (state.candidateFilterStatus === 'Scored') {
      list = list.filter(c => c.myScore !== null || c.scores.length > 0);
    } else if (state.candidateFilterStatus === 'Pending') {
      list = list.filter(c => c.myScore === null && c.scores.length === 0);
    } else if (state.candidateFilterStatus === 'Flagged') {
      list = list.filter(c => c.flagged);
    }

    // Min Fit filter
    if (state.candidateFilterMinFit > 0) {
      list = list.filter(c => c.llmFitScore >= state.candidateFilterMinFit);
    }

    // PME filter
    if (state.candidateFilterPme !== 'All') {
      list = list.filter(c => c.pmeStatus === state.candidateFilterPme);
    }

    // Packet readiness filter
    if (state.candidateFilterPacket === 'Complete') {
      list = list.filter(c => c.packetReadiness.complete);
    } else if (state.candidateFilterPacket === 'Exceptions') {
      list = list.filter(c => !c.packetReadiness.complete || c.packetReadiness.exceptions.length > 0);
    }

    // Sort
    list.sort((a, b) => {
      let valA: string | number = a.llmFitScore;
      let valB: string | number = b.llmFitScore;

      if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortField === 'grade') {
        valA = a.grade;
        valB = b.grade;
      } else if (sortField === 'dafsc') {
        valA = a.dafsc;
        valB = b.dafsc;
      } else if (sortField === 'status') {
        valA = a.myScore !== null ? 1 : 0;
        valB = b.myScore !== null ? 1 : 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [
    state.candidates,
    state.candidateFilterText,
    state.candidateFilterStatus,
    state.candidateFilterMinFit,
    state.candidateFilterPme,
    state.candidateFilterPacket,
    sortField,
    sortAsc
  ]);

  const handleSelectCandidate = (cand: Candidate) => {
    dispatch({ type: 'SELECT_CANDIDATE', candidateId: cand.id });
    dispatch({ type: 'SET_VIEW', viewId: 'VIEW-PanelReview' });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Board Selector & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2d45] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-wider font-semibold">
              Active Evaluation Cycle
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={state.selectedBoardId}
              onChange={e => dispatch({ type: 'SET_BOARD', boardId: e.target.value })}
              className="bg-[#0a1020] border border-[#1e2d45] text-white font-semibold text-sm rounded px-3 py-1.5 focus:border-cyan-400 focus:outline-hidden"
            >
              {selectableBoards.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.status})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-BoardDetail' })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-medium text-cyan-300 bg-cyan-950/70 border border-cyan-800 hover:bg-cyan-900 transition-colors"
              title="Drill down to individual board statistics, stage-gates, and role permissions"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Board Statistics & Roles</span>
            </button>
            <span className="font-mono text-xs text-slate-400">
              Board Pool: <strong className="text-white">{pool.length}</strong> (Ref: 449)
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1 bg-[#0a1020] border border-[#1e2d45] rounded text-xs font-mono">
            <span className="text-slate-400">Scored: </span>
            <strong className="text-emerald-400">{scoredCount}</strong>
          </div>
          <div className="px-3 py-1 bg-[#0a1020] border border-[#1e2d45] rounded text-xs font-mono">
            <span className="text-slate-400">Pending: </span>
            <strong className="text-amber-400">{pendingCount}</strong>
          </div>
          <div className="px-3 py-1 bg-[#0a1020] border border-[#1e2d45] rounded text-xs font-mono">
            <span className="text-slate-400">Flagged: </span>
            <strong className="text-red-400">{flaggedCount}</strong>
          </div>
          <div className="px-3 py-1 bg-[#05080f] border border-cyan-800/80 rounded text-xs font-mono text-cyan-300">
            <span>Board Avg: <strong>{m401.formatted}</strong></span>
            <span className="text-slate-600 mx-1">|</span>
            <span>Panel: <strong>{m402.formatted}</strong></span>
            <span className="text-slate-600 mx-1">|</span>
            <span>My Avg: <strong className="text-emerald-400">{m403.formatted}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Shuffle Controls */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Search with Ctrl+J shortcut indicator */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              id="candidate-queue-search"
              type="text"
              placeholder="Search candidate name, DoD ID, DAFSC, unit... (Ctrl+J)"
              value={state.candidateFilterText}
              onChange={e => dispatch({ type: 'SET_FILTER_TEXT', text: e.target.value })}
              className="w-full pl-8 pr-12 py-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-white focus:outline-hidden focus:border-cyan-400"
            />
            <span className="absolute right-2 top-2 font-mono text-[10px] text-slate-500 bg-[#1e2d45] px-1 rounded">
              Ctrl+J
            </span>
          </div>

          {/* Status Filter */}
          <select
            value={state.candidateFilterStatus}
            onChange={e => dispatch({ type: 'SET_FILTER_STATUS', status: e.target.value as any })}
            className="px-2.5 py-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-slate-300 focus:outline-hidden focus:border-cyan-400"
          >
            <option value="All">Status: All</option>
            <option value="Pending">Pending Evaluation</option>
            <option value="Scored">Scored</option>
            <option value="Flagged">Flagged Only</option>
          </select>

          {/* Fit Filter */}
          <select
            value={state.candidateFilterMinFit}
            onChange={e => dispatch({ type: 'SET_FILTER_MIN_FIT', minFit: Number(e.target.value) })}
            className="px-2.5 py-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-slate-300 focus:outline-hidden focus:border-cyan-400"
          >
            <option value="0">LLM Fit: All</option>
            <option value="75">LLM Fit &gt; 75</option>
            <option value="85">LLM Fit &gt; 85</option>
            <option value="90">LLM Fit &gt; 90</option>
          </select>

          {/* Packet Readiness */}
          <select
            value={state.candidateFilterPacket}
            onChange={e => dispatch({ type: 'SET_FILTER_PACKET', packet: e.target.value as any })}
            className="px-2.5 py-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-slate-300 focus:outline-hidden focus:border-cyan-400"
          >
            <option value="All">Packets: All</option>
            <option value="Complete">Complete Only</option>
            <option value="Exceptions">Exceptions / Incomplete</option>
          </select>
        </div>

        {/* Action Buttons: Shuffle & Reset */}
        <div className="flex items-center gap-2">
          {state.lastShuffleSeed && (
            <span className="font-mono text-[10px] text-cyan-400/80 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800">
              Seed: {state.lastShuffleSeed}
            </span>
          )}

          <button
            type="button"
            onClick={() => dispatch({ type: 'RANDOM_SHUFFLE' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 rounded font-semibold text-cyan-300 transition-colors"
            title="Fisher-Yates true random reorder seeded from crypto.getRandomValues (Logged to DELTA)"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random Shuffle</span>
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_FILTERS' })}
            className="px-2.5 py-1.5 bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] rounded text-slate-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Candidate Table */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md overflow-hidden relative shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d45] bg-[#05080f] text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3">PDO ID</th>
                <th
                  onClick={() => {
                    setSortField('name');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Candidate Name
                </th>
                <th
                  onClick={() => {
                    setSortField('grade');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  Grade
                </th>
                <th
                  onClick={() => {
                    setSortField('dafsc');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  DAFSC
                </th>
                <th className="py-2.5 px-3">Current Unit</th>
                <th className="py-2.5 px-3">TIG / TAFCSD</th>
                <th
                  onClick={() => {
                    setSortField('llmFitScore');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  LLM Fit
                </th>
                <th className="py-2.5 px-3">Packet Status</th>
                <th className="py-2.5 px-3">My Score</th>
                <th className="py-2.5 px-3 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]/60">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    No candidates match the selected filters. Click "Clear" to reset.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(cand => {
                  const hasMyScore = cand.myScore !== null;
                  const isFlagged = cand.flagged;

                  return (
                    <tr
                      key={cand.id}
                      onClick={() => handleSelectCandidate(cand)}
                      onMouseEnter={() => setHoveredCandidate(cand)}
                      onMouseLeave={() => setHoveredCandidate(null)}
                      className={`hover:bg-[#0f172a] cursor-pointer transition-colors ${
                        isFlagged ? 'bg-red-950/15' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-cyan-400 font-semibold whitespace-nowrap">
                        {cand.id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isFlagged && <Flag className="w-3.5 h-3.5 text-red-400 shrink-0 fill-red-400/20" />}
                          <span>{cand.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{cand.grade}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{cand.dafsc}</td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[160px]">{cand.currentUnit}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {cand.tig} / {cand.tafcsd}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/80">
                          {cand.llmFitScore}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {cand.packetReadiness.complete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400"
                            title={cand.packetReadiness.exceptions.join('; ')}
                          >
                            <AlertTriangle className="w-3 h-3" /> Exceptions ({cand.packetReadiness.exceptions.length})
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap font-bold">
                        {hasMyScore ? (
                          <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            {cand.myScore?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal italic">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Open</span> <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Hover Mini-Card Overlay */}
        {hoveredCandidate && (
          <div className="absolute right-4 bottom-4 z-30 pointer-events-none hidden md:block w-72 bg-[#05080f] border border-cyan-500/60 rounded-md p-3 shadow-2xl text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1e2d45] pb-1.5">
              <span className="font-semibold text-white">{hoveredCandidate.name}</span>
              <span className="font-mono text-cyan-400">{hoveredCandidate.id}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Top 3 Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {hoveredCandidate.skills.slice(0, 3).map(sk => (
                  <span key={sk.cluster} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2d45] text-slate-200">
                    {sk.cluster} ({sk.proficiency})
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#1e2d45]">
              <span className="text-slate-400">ROP Trend:</span>
              <span className="font-semibold text-emerald-400">{hoveredCandidate.ropTrend}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
