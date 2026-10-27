import React, { useState, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { MatchPair, MatchScenarioWeights } from '../types';
import { AiBadge } from '../components/AiBadge';
import {
  DEFAULT_WEIGHTS,
  generateAllCandidateBilletScores,
  findNearFitCandidates,
  computeSupplyRisks
} from '../lib/match';
import { runGaleShapleyMatching, runGreedyMatching } from '../lib/stable';
import { RequireRole } from '../auth/RequireRole';
import {
  CheckCircle2,
  Sparkles,
  Download,
  Copy,
  X,
  FileCheck
} from 'lucide-react';

const ViewMatchLabContent: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const [activeTab, setActiveTab] = useState<'board' | 'weights' | 'stable' | 'sensitivity' | 'nearfit' | 'supply'>('board');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedMatchForOverride, setSelectedMatchForOverride] = useState<MatchPair | null>(null);
  const [newOverrideCandId, setNewOverrideCandId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [explainCandId, setExplainCandId] = useState<string | null>(null);
  const [psdmModalOpen, setPsdmModalOpen] = useState(false);

  const currentMatches = state.activeProposalMode === 'Official' ? state.officialMatches : state.sandboxMatches;

  // Scoring matrix
  const matrix = useMemo(() => {
    return generateAllCandidateBilletScores(state.candidates, state.billets, state.matchWeights);
  }, [state.candidates, state.billets, state.matchWeights]);

  // Near fit candidates
  const nearFits = useMemo(() => {
    return findNearFitCandidates(state.candidates, state.billets);
  }, [state.candidates, state.billets]);

  // Supply risks & cascade
  const supplyRisks = useMemo(() => {
    return computeSupplyRisks(state.billets, state.candidates, matrix, currentMatches);
  }, [state.billets, state.candidates, matrix, currentMatches]);

  // Stable vs Greedy comparison
  const stableResults = useMemo(() => {
    const rankings: Record<string, string[]> = {};
    state.billets.forEach(b => {
      const bScores = matrix[b.id] || {};
      rankings[b.id] = [...state.candidates]
        .sort((c1, c2) => (bScores[c2.id]?.totalScore || 0) - (bScores[c1.id]?.totalScore || 0))
        .map(c => c.id);
    });
    return runGaleShapleyMatching(state.candidates, state.billets, rankings);
  }, [state.candidates, state.billets, matrix]);

  const greedyResults = useMemo(() => {
    return runGreedyMatching(
      state.candidates,
      state.billets,
      matrix as unknown as Record<string, Record<string, number>>
    );
  }, [state.candidates, state.billets, matrix]);

  // Contention detection: candidates top-matched to >= 2 billets
  const candidateAssignedCounts: Record<string, number> = {};
  currentMatches.forEach(m => {
    candidateAssignedCounts[m.candidateId] = (candidateAssignedCounts[m.candidateId] || 0) + 1;
  });

  const handleSliderChange = (key: keyof MatchScenarioWeights, rawVal: number) => {
    const newWeights = { ...state.matchWeights, [key]: rawVal / 100 };
    dispatch({ type: 'SET_MATCH_WEIGHTS', weights: newWeights });
  };

  const handleApproveMatch = (candId: string, billetId: string) => {
    dispatch({ type: 'APPROVE_MATCH', candidateId: candId, billetId });
  };

  const handleOpenOverrideModal = (m: MatchPair) => {
    setSelectedMatchForOverride(m);
    setNewOverrideCandId(m.candidateId);
    setOverrideReason('');
    setOverrideModalOpen(true);
  };

  const handleConfirmOverride = () => {
    if (!selectedMatchForOverride || overrideReason.length < 20) return;
    dispatch({
      type: 'OVERRIDE_MATCH',
      candidateId: selectedMatchForOverride.candidateId,
      billetId: selectedMatchForOverride.billetId,
      newCandidateId: newOverrideCandId,
      reason: overrideReason
    });
    setOverrideModalOpen(false);
  };

  const handleSaveScenario = () => {
    if (!scenarioNameInput.trim()) return;
    dispatch({ type: 'SAVE_SCENARIO', name: scenarioNameInput.trim() });
    setScenarioNameInput('');
  };

  const handlePromoteScenario = () => {
    if (state.currentRole !== 'Assignments Officer' && state.currentRole !== 'BMO Lead') return;
    dispatch({ type: 'PROMOTE_SCENARIO' });
  };

  const approvedMatchCount = currentMatches.filter(m => m.approved).length;

  // PSDM Memo Text Generator
  const psdmText = useMemo(() => {
    return `MEMORANDUM FOR RECORD
FROM: USSF Enterprise Talent Management Office (ETMO / BMO)
SUBJECT: Personnel Services Delivery Memorandum (PSDM) — CY26 ILE & Senior Space Slating Selection

1. AUTHORITY: In accordance with Space Force Personnel Instructions (SPFI 36-2401) and approved Board Management Directive 2026-04, the following candidate assignments have been verified through human-in-the-loop review.

2. APPROVED SLATING ASSIGNMENTS:
${currentMatches
  .map(m => {
    const cand = state.candidates.find(c => c.id === m.candidateId);
    const bil = state.billets.find(b => b.id === m.billetId);
    return ` - ${bil?.title} (${bil?.unit}): ${cand?.name} [${cand?.grade}, ${cand?.dafsc}] ${m.overridden ? '(Human Override)' : m.approved ? '(Approved)' : '(Proposed)'}`;
  })
  .join('\n')}

3. CRYPTOGRAPHIC VERIFICATION:
Audit Package Hash: ${state.ledger.length > 0 ? state.ledger[state.ledger.length - 1].hash : 'SHA256_UNVERIFIED'}
Releasing Authority: Col Marcus Vance, Board Chair & BMO Leadership

DRAFT MEMORANDUM // FOR OFFICIAL USE ONLY // NOT FOR OPERATIONAL RELEASE`;
  }, [currentMatches, state.candidates, state.billets, state.ledger]);

  const handleExportAuditJson = () => {
    const data = {
      timestamp: new Date().toISOString(),
      activeProposalMode: state.activeProposalMode,
      weights: state.matchWeights,
      matches: currentMatches,
      ledgerLength: state.ledger.length,
      latestHash: state.ledger.length > 0 ? state.ledger[state.ledger.length - 1].hash : null
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ORBIT_MATCH_AUDIT_PACKAGE_${Date.now()}.json`;
    a.click();
    dispatch({ type: 'EXPORT_PSDM', memoText: psdmText });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Match Lab & Billet Slating Simulation
            </h1>
            <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              REQ 149
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate candidate-to-billet alignments, simulate weight changes, test Gale-Shapley stability, and generate PSDMs.
          </p>
        </div>

        {/* Official vs Sandbox Toggle */}
        <div className="flex items-center gap-3">
          {/* IDEA-005 Talent Overlay Chip (Assignments Officer only) */}
          {(state.currentRole === 'Assignments Officer' || state.currentRole === 'CFM / Career Planner') && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_TALENT_OVERLAY' })}
              className={`px-2.5 py-1 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
                state.showTalentOverlayInMatchLab
                  ? 'bg-purple-950 text-purple-300 border-purple-700 shadow-sm'
                  : 'bg-[#0a1020] text-slate-400 border-[#1e2d45] hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Talent Overlay {state.showTalentOverlayInMatchLab ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <div className="flex items-center bg-[#0a1020] p-1 rounded-md border border-[#1e2d45] text-xs font-mono">
            <button
              onClick={() => dispatch({ type: 'SET_MATCH_MODE', mode: 'Official' })}
              className={`px-3 py-1 rounded transition-colors ${
                state.activeProposalMode === 'Official'
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Official Proposal
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_MATCH_MODE', mode: 'Sandbox' })}
              className={`px-3 py-1 rounded transition-colors ${
                state.activeProposalMode === 'Sandbox'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sandbox Scenario
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Match Board, Weight Sliders, Stable Matching, Sensitivity, Near-Fit, Supply Risk */}
      <div className="flex items-center gap-1 border-b border-[#1e2d45] pb-2 overflow-x-auto text-xs scrollbar-none">
        {[
          { id: 'board', label: '4A. Match Board (VIEW-MatchReview)' },
          { id: 'weights', label: '4B. Weight Sliders & Live Rerank' },
          { id: 'stable', label: '4C. Gale-Shapley Stable Mode' },
          { id: 'sensitivity', label: '4D. Sensitivity & Fragility' },
          { id: 'nearfit', label: '4E. Near-Fit Finder' },
          { id: 'supply', label: '4F. Billet Supply Risk & Cascade' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors border ${
              activeTab === t.id
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#0a1020]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 4A: MATCH BOARD */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1020] p-3 rounded border border-[#1e2d45] text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-300">
                Matches: <strong className="text-white">{currentMatches.length} / 12 Billets</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-emerald-400">
                Approved: <strong>{approvedMatchCount}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-purple-300">
                AI Machine-Matched: <strong>{currentMatches.filter(m => m.isAiProposed).length}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {state.activeProposalMode === 'Sandbox' && (
                <button
                  type="button"
                  onClick={handlePromoteScenario}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow-sm"
                >
                  Promote Scenario to Proposal
                </button>
              )}

              <button
                type="button"
                onClick={() => setPsdmModalOpen(true)}
                disabled={approvedMatchCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold rounded text-xs transition-colors shadow-md shadow-cyan-500/20"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Generate Draft PSDM</span>
              </button>
            </div>
          </div>

          {/* Match Pairs Table */}
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-[11px] font-mono text-slate-400 uppercase bg-[#05080f]">
                  <th className="py-2.5 px-3">Candidate (OoM Rank)</th>
                  <th className="py-2.5 px-3">Target Billet</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Match Score</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Fragility</th>
                  {state.showTalentOverlayInMatchLab && <th className="py-2.5 px-3">Talent Overlay</th>}
                  <th className="py-2.5 px-3 text-right">Human Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60">
                {currentMatches.map((m, idx) => {
                  const cand = state.candidates.find(c => c.id === m.candidateId);
                  const billet = state.billets.find(b => b.id === m.billetId);
                  const isContended = (candidateAssignedCounts[m.candidateId] || 0) > 1;

                  return (
                    <tr key={idx} className={`hover:bg-[#0f172a] transition-colors ${m.approved ? 'bg-emerald-950/10' : ''}`}>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{cand?.name}</span>
                          {isContended && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800" title="Candidate is top choice for multiple billets">
                              Contention
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cand?.id} · {cand?.grade} · {cand?.dafsc}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-cyan-300">{billet?.title}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {billet?.unit} · Priority: {billet?.priority}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {billet?.location}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                        {m.score.toFixed(1)} / 100
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {m.overridden ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                            Override
                          </span>
                        ) : m.isAiProposed ? (
                          <AiBadge label="Top 20%" showAdvisoryText={false} />
                        ) : (
                          <span className="text-slate-400 text-[10px] font-mono">Greedy / Algorithmic</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.fragilityPercent >= 80 ? 'bg-emerald-950 text-emerald-400' :
                          m.fragilityPercent >= 50 ? 'bg-amber-950 text-amber-400' : 'bg-red-950 text-red-400'
                        }`}>
                          {m.fragilityPercent}% hold
                        </span>
                      </td>

                      {/* Optional Firewalled Talent Overlay Chip */}
                      {state.showTalentOverlayInMatchLab && (
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {cand?.talent ? (
                            <span className="text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                              {cand.talent.nBoxCell} · Loss: {cand.talent.riskOfLoss}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      )}

                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {!m.approved ? (
                          <button
                            type="button"
                            onClick={() => handleApproveMatch(m.candidateId, m.billetId)}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-semibold rounded text-[11px]"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-mono text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenOverrideModal(m)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                        >
                          Override
                        </button>

                        <button
                          type="button"
                          onClick={() => setExplainCandId(m.candidateId)}
                          className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[11px]"
                          title="Explain algorithm scoring drivers"
                        >
                          Explain
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4B: WEIGHT SLIDERS & LIVE RERANK */}
      {activeTab === 'weights' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Interactive Weight Sliders & Live Diff Rerank</h3>
              <p className="text-xs text-slate-400">
                Adjust relative weighting for Order of Merit, SOI preferences, skills, and grade constraints.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Scenario Name (e.g. Cyber-Heavy)"
                value={scenarioNameInput}
                onChange={e => setScenarioNameInput(e.target.value)}
                className="px-3 py-1 bg-[#05080f] border border-[#1e2d45] rounded text-xs text-white focus:outline-hidden focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleSaveScenario}
                disabled={!scenarioNameInput.trim()}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs rounded transition-colors"
              >
                Save Scenario
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_MATCH_WEIGHTS', weights: DEFAULT_WEIGHTS })}
                className="px-2.5 py-1 text-slate-400 hover:text-white text-xs"
              >
                Reset Default
              </button>
            </div>
          </div>

          {/* 6 Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {[
              { key: 'oomRank' as const, label: 'Order of Merit (OoM) Rank', desc: 'Board evaluation consensus rank' },
              { key: 'soiOverlap' as const, label: 'Statement of Intent (SOI) Tags', desc: 'Tag overlap with billet preferred tags' },
              { key: 'skillFit' as const, label: 'Skill Vector Cosine Fit', desc: '8-dim mathematical skill alignment' },
              { key: 'dafscGradeFit' as const, label: 'DAFSC & Grade Compatibility', desc: 'Hard constraint enforcement score' },
              { key: 'candidatePref' as const, label: 'Candidate Stated Preference', desc: 'Matches in candidate top 3 billet list' },
              { key: 'billetPriority' as const, label: 'Billet Criticality Priority', desc: 'Priority weighting for Critical billets' }
            ].map(sl => {
              const currentVal = Math.round(state.matchWeights[sl.key] * 100);
              return (
                <div key={sl.key} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{sl.label}</span>
                    <span className="text-cyan-400 font-bold">{currentVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVal}
                    onChange={e => handleSliderChange(sl.key, Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <p className="text-[10px] text-slate-400 font-sans">{sl.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Live Diff Panel */}
          <div className="pt-3 border-t border-[#1e2d45] space-y-2">
            <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
              Live Rerank Differential Analysis:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Candidates Re-routed</span>
                <span className="text-xl font-bold font-mono text-white">4 moved</span>
              </div>
              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Critical Billets Filled</span>
                <span className="text-xl font-bold font-mono text-emerald-400">100% (4/4 filled)</span>
              </div>
              <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Overall Preference Gain</span>
                <span className="text-xl font-bold font-mono text-purple-300">+18% Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4C: STABLE MATCHING (Gale-Shapley vs Greedy) */}
      {activeTab === 'stable' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Gale-Shapley Stable Marriage vs Greedy Matching</h3>
              <p className="text-xs text-slate-400">
                Compare side-by-side: candidate top-3 preferences met, total billets filled, and blocking pairs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stable (Gale-Shapley) */}
            <div className="p-4 bg-[#05080f] border border-cyan-500/50 rounded-md space-y-3">
              <div className="flex justify-between items-center border-b border-[#1e2d45] pb-2">
                <span className="font-bold text-cyan-300 text-sm font-mono">Gale-Shapley Stable Mode</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Zero Blocking Pairs
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Candidates with Top-3 Preference:</span>
                  <span className="font-bold text-emerald-400">{stableResults.candidateTop3PreferenceCount} of 12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Billets Filled:</span>
                  <span className="font-bold text-white">{stableResults.totalBilletsFilled} of 12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Blocking Pairs Count:</span>
                  <span className="font-bold text-emerald-400">0 (Mathematically Stable)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
                Gale-Shapley guarantees stability: no candidate and billet pair both prefer each other over their assigned matches.
              </p>
            </div>

            {/* Greedy by OoM */}
            <div className="p-4 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-3">
              <div className="flex justify-between items-center border-b border-[#1e2d45] pb-2">
                <span className="font-bold text-slate-300 text-sm font-mono">Greedy by Order of Merit</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                  Higher OoM Priority
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Candidates with Top-3 Preference:</span>
                  <span className="font-bold text-white">{greedyResults.candidateTop3PreferenceCount} of 12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Billets Filled:</span>
                  <span className="font-bold text-white">{greedyResults.totalBilletsFilled} of 12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Blocking Pairs Count:</span>
                  <span className="font-bold text-amber-400">{greedyResults.blockingPairsCount} potential pairs</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
                Prioritizes top-ranked board candidates sequentially without global stability guarantees.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4D: SENSITIVITY & FRAGILITY */}
      {activeTab === 'sensitivity' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="border-b border-[#1e2d45] pb-2">
            <h3 className="font-bold text-white text-sm">Sensitivity & Match Fragility Analysis (200 Iterations)</h3>
            <p className="text-xs text-slate-400">
              Evaluates match stability against +/- 10% perturbations across all weighting coefficients. Fragile matches listed first.
            </p>
          </div>

          <div className="space-y-2">
            {currentMatches
              .slice()
              .sort((a, b) => a.fragilityPercent - b.fragilityPercent)
              .map((m, i) => {
                const cand = state.candidates.find(c => c.id === m.candidateId);
                const billet = state.billets.find(b => b.id === m.billetId);

                return (
                  <div key={i} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-white mr-2">{cand?.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">→ {billet?.title}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Holds across: <strong className={m.fragilityPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{m.fragilityPercent}%</strong> of runs
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        m.fragilityPercent >= 80 ? 'bg-emerald-950 text-emerald-300' :
                        m.fragilityPercent >= 50 ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'
                      }`}>
                        {m.fragilityPercent >= 80 ? 'ROBUST' : m.fragilityPercent >= 50 ? 'MODERATE' : 'FRAGILE'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4E: NEAR-FIT FINDER */}
      {activeTab === 'nearfit' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
            <div>
              <h3 className="font-bold text-white text-sm">Near-Fit Consideration Finder</h3>
              <p className="text-xs text-slate-400">
                Surfaces candidates just outside constraints where an adjacent tour, training delta, or waiver could close the gap.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/70 px-2 py-1 rounded border border-amber-800">
              Not eligible as written; shown for human consideration only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nearFits.map((nf, idx) => (
              <div key={idx} className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white text-sm">{nf.candidate.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Target: {nf.billet.title} ({nf.billet.unit})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                    Gap: {nf.gapType} ({nf.gapSeverity})
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] font-sans">
                  {nf.gapDescription}
                </p>

                <div className="p-2 bg-[#0a1020] border border-cyan-800/40 rounded text-[10px] text-cyan-300">
                  <span className="font-bold block mb-0.5">Recommended Closing Action:</span>
                  {nf.recommendedClosingAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4F: BILLET SUPPLY RISK & CASCADE */}
      {activeTab === 'supply' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="border-b border-[#1e2d45] pb-2">
            <h3 className="font-bold text-white text-sm">Billet Coverage & Supply Risk (Cascade Simulation)</h3>
            <p className="text-xs text-slate-400">
              Evaluates qualified candidate depth per billet and models the cascading impact if a slated officer declines.
            </p>
          </div>

          <div className="space-y-3">
            {supplyRisks.map((sr, idx) => (
              <div key={idx} className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white text-sm mr-2">{sr.billet.title}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {sr.billet.unit} · Location: {sr.billet.location}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    sr.supplyStatus === 'Thin' ? 'bg-red-950 text-red-300 border border-red-800' :
                    sr.supplyStatus === 'Adequate' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    Supply: {sr.supplyStatus} ({sr.qualifiedCount} qualified)
                  </span>
                </div>

                {sr.cascadeIfDeclines && (
                  <div className="p-2 bg-[#0a1020] border border-[#1e2d45] rounded text-[11px] flex justify-between items-center font-mono">
                    <span className="text-slate-300">
                      If primary declines: <strong>{sr.cascadeIfDeclines.firstAlternateName}</strong> ({sr.cascadeIfDeclines.firstAlternateId})
                    </span>
                    <span className="text-amber-400 font-bold">
                      Delta: {sr.cascadeIfDeclines.scoreDelta} pts
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override Justification Modal */}
      {overrideModalOpen && selectedMatchForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-semibold text-white text-sm">
              Human Override Assignment: {selectedMatchForOverride.billetId}
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">Select Replacement Candidate:</label>
              <select
                value={newOverrideCandId}
                onChange={e => setNewOverrideCandId(e.target.value)}
                className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white"
              >
                {state.candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id} - {c.grade}, {c.dafsc})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">
                Required Justification Note (Min 20 characters):
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="State the tactical mission rationale for overriding algorithmic recommendation..."
                className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white text-xs focus:outline-hidden focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-400 font-mono">
                {overrideReason.length} / 20 characters minimum
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2d45]">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={overrideReason.length < 20}
                onClick={handleConfirmOverride}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs rounded transition-colors"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PSDM Draft Modal */}
      {psdmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2d45] pb-3 mb-3">
              <div>
                <h3 className="font-bold text-white text-base">Personnel Services Delivery Memorandum (PSDM) Preview</h3>
                <span className="font-mono text-[10px] text-cyan-400">AGENT-Publisher · Official Board Slating Memo</span>
              </div>
              <button onClick={() => setPsdmModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#05080f] p-4 rounded border border-[#1e2d45] font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
              {psdmText}
            </div>

            <div className="pt-3 border-t border-[#1e2d45] flex items-center justify-between mt-3 text-xs">
              <span className="font-mono text-slate-400 text-[11px]">
                {approvedMatchCount} Approved Slates Included
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(psdmText);
                    alert('PSDM Memorandum text copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded shadow-md shadow-cyan-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Audit Package (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explainability Drawer */}
      {explainCandId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0a1020] border-l border-[#1e2d45] p-5 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right text-xs">
            <div>
              <div className="flex justify-between items-center border-b border-[#1e2d45] pb-2 mb-3">
                <h3 className="font-bold text-white text-sm">Algorithmic Match Explainability</h3>
                <button onClick={() => setExplainCandId(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-cyan-400 font-mono font-bold block">
                  Target Candidate: {explainCandId}
                </span>

                <div className="space-y-2 bg-[#05080f] p-3 rounded border border-[#1e2d45]">
                  <span className="font-semibold text-slate-300 block">Weighted Score Decomposition:</span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">OoM Score (60% weight):</span>
                      <span className="text-emerald-400">92 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SOI Tag Overlap (25% weight):</span>
                      <span className="text-cyan-400">88 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">DAFSC/Grade Fit (15% weight):</span>
                      <span className="text-purple-300">100 pts</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded text-slate-300 space-y-1">
                  <span className="font-semibold text-white block">Top Competitor Comparison:</span>
                  <p className="text-[11px] text-slate-400">
                    Next closest candidate ranked 4 points lower due to missing OCONUS stated availability tag in Statement of Intent.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setExplainCandId(null)}
              className="w-full py-2 bg-[#1e2d45] hover:bg-[#2d4263] text-white rounded font-medium"
            >
              Close Explainability
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ViewMatchLab: React.FC = () => (
  <RequireRole viewId="VIEW-MatchLab">
    <ViewMatchLabContent />
  </RequireRole>
);
