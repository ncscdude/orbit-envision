import React, { useState } from 'react';
import { useOrbit } from '../state/context';
import { Candidate } from '../types';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  FileText,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

export const ViewScoringAudit: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [adjudicationAction, setAdjudicationAction] = useState<'Reconcile' | 'Uphold' | 'Escalate'>('Reconcile');
  const [newScoreVal, setNewScoreVal] = useState<number>(8.0);
  const [actionNote, setActionNote] = useState('');

  // Parity Breach Rollback Playbook state
  const [rollbackStep, setRollbackStep] = useState<number>(1);
  const [rollbackConfirmInput, setRollbackConfirmInput] = useState('');
  const [rollbackExecuted, setRollbackExecuted] = useState(false);

  // Computed heartburn candidates: |myScore - panelAvg| >= 1.5
  const heartburnCandidates = state.candidates
    .filter(c => {
      if (c.myScore === null) return false;
      const scores = c.scores.map(s => s.value);
      if (scores.length === 0) return false;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return Math.abs(c.myScore - avg) >= 1.5;
    })
    .map(c => {
      const scores = c.scores.map(s => s.value);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const gap = Number((c.myScore! - avg).toFixed(1));
      return {
        candidate: c,
        myScore: c.myScore!,
        panelAvg: Number(avg.toFixed(1)),
        modelScore: Number((c.mScore / 10).toFixed(1)),
        gap
      };
    });

  const handleOpenAdjudicateModal = (cand: Candidate, defaultAct: 'Reconcile' | 'Uphold' | 'Escalate') => {
    setSelectedCandidate(cand);
    setAdjudicationAction(defaultAct);
    setNewScoreVal(cand.myScore || 8.0);
    setActionNote('');
  };

  const handleConfirmAdjudication = () => {
    if (!selectedCandidate || !actionNote.trim()) return;
    dispatch({
      type: 'ADJUDICATE_HEARTBURN',
      candidateId: selectedCandidate.id,
      action: adjudicationAction,
      newScore: adjudicationAction === 'Reconcile' ? newScoreVal : undefined,
      note: actionNote
    });
    setSelectedCandidate(null);
  };

  const handleExecuteRollback = () => {
    if (state.currentRole !== 'BMO Lead' || rollbackConfirmInput !== 'ROLLBACK') return;
    dispatch({ type: 'ROLLBACK_PLAYBOOK' });
    setRollbackExecuted(true);
    setRollbackConfirmInput('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Scoring Audit & Heartburn Adjudication</span>
          <span className="font-mono text-xs text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
            REQ 150
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Surfaces statistical heartburn outliers (|myScore - panelAvg| &ge; 1.5 pts) and provides Parity Breach Rollback controls.
        </p>
      </div>

      {/* Heartburn Outliers Table */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2d45] pb-3">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Identified Heartburn Candidates</span>
              <span className="font-mono text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                {heartburnCandidates.length} Active Outliers
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluator score deviates by &ge; 1.5 points from panel average consensus. Requires deliberate reconciliation.
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-[#05080f] px-3 py-1.5 rounded border border-[#1e2d45]">
            Threshold: |MyScore - PanelAvg| &ge; 1.5 pts
          </div>
        </div>

        {heartburnCandidates.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No active heartburn outliers detected. All submitted scores are within 1.5 points of panel consensus.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-[11px] font-mono text-slate-400 uppercase bg-[#05080f]">
                  <th className="py-2.5 px-3">PDO ID</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">DAFSC / Unit</th>
                  <th className="py-2.5 px-3">My Score</th>
                  <th className="py-2.5 px-3">Panel Avg</th>
                  <th className="py-2.5 px-3">Model Score</th>
                  <th className="py-2.5 px-3">Variance Gap</th>
                  <th className="py-2.5 px-3 text-right">Adjudication Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60">
                {heartburnCandidates.map(({ candidate: cand, myScore, panelAvg, modelScore, gap }) => (
                  <tr key={cand.id} className="hover:bg-[#0f172a] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">{cand.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{cand.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{cand.dafsc} · {cand.currentUnit}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{myScore.toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300">{panelAvg.toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-mono text-purple-300">{modelScore.toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${gap > 0 ? 'bg-red-950 text-red-300' : 'bg-blue-950 text-blue-300'}`}>
                        {gap > 0 ? `+${gap}` : gap} pts
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAdjudicateModal(cand, 'Reconcile')}
                        className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-medium rounded text-[11px]"
                      >
                        Reconcile
                      </button>
                      <button
                        onClick={() => handleOpenAdjudicateModal(cand, 'Uphold')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded text-[11px]"
                      >
                        Uphold
                      </button>
                      <button
                        onClick={() => handleOpenAdjudicateModal(cand, 'Escalate')}
                        className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-medium rounded text-[11px]"
                      >
                        Escalate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Parity Breach Rollback Playbook (BMO Lead Only) */}
      <div className="bg-[#0a1020] border border-red-900/60 rounded-md p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2d45] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white text-base">Parity Breach Rollback Playbook</h3>
              <span className="font-mono text-[10px] text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                BMO LEAD ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Four-step procedural protocol to recover from systemic evaluator breach or corrupted evaluation batch.
            </p>
          </div>
          {rollbackExecuted && (
            <span className="font-mono text-xs text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ROLLBACK EXECUTED & SEALED
            </span>
          )}
        </div>

        {/* 4-Step Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {[
            { step: 1, title: '1. Freeze Scoring', desc: 'Lock board scoring dock to prevent additional submissions.' },
            { step: 2, title: '2. Identify PDOs', desc: 'Isolate affected candidates evaluated during anomaly window.' },
            { step: 3, title: '3. Revert to Checkpoint', desc: 'Revert state to last cryptographically verified DELTA entry.' },
            { step: 4, title: '4. Re-open for Rescore', desc: 'Unlock evaluation dock under panel chairman oversight.' }
          ].map(s => (
            <div
              key={s.step}
              onClick={() => setRollbackStep(s.step)}
              className={`p-3 rounded border cursor-pointer transition-all ${
                rollbackStep === s.step
                  ? 'border-cyan-400 bg-[#0f172a] text-white ring-1 ring-cyan-400'
                  : 'border-[#1e2d45] bg-[#05080f] text-slate-400 hover:border-slate-500'
              }`}
            >
              <div className="font-mono font-bold text-cyan-400 mb-1">{s.title}</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Rollback Confirmation Block */}
        <div className="pt-3 border-t border-[#1e2d45] flex flex-wrap items-center justify-between gap-3 bg-[#05080f] p-3 rounded">
          <div className="text-xs text-slate-300 max-w-lg">
            <span className="font-semibold text-red-400 block mb-0.5">MANDATORY PROTOCOL CONFIRMATION:</span>
            To execute rollback and reset candidate evaluations to verified checkpoint, type <strong className="text-white font-mono">ROLLBACK</strong> below.
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type ROLLBACK"
              value={rollbackConfirmInput}
              onChange={e => setRollbackConfirmInput(e.target.value)}
              disabled={state.currentRole !== 'BMO Lead'}
              className="p-1.5 bg-[#0a1020] border border-red-800 text-white font-mono text-xs rounded uppercase w-36 focus:outline-hidden focus:border-red-400 disabled:opacity-40"
            />
            <button
              type="button"
              onClick={handleExecuteRollback}
              disabled={state.currentRole !== 'BMO Lead' || rollbackConfirmInput !== 'ROLLBACK'}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold rounded text-xs transition-colors shadow-md"
            >
              Execute Rollback
            </button>
          </div>
        </div>
      </div>

      {/* Adjudication Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
              <h3 className="font-semibold text-white text-sm">
                Adjudicate Heartburn: {selectedCandidate.name} ({selectedCandidate.id})
              </h3>
              <span className="font-mono text-xs text-amber-400 uppercase font-semibold">
                {adjudicationAction}
              </span>
            </div>

            {adjudicationAction === 'Reconcile' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Reconciled Score Value (6.0 to 10.0):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="6.0"
                  max="10.0"
                  value={newScoreVal}
                  onChange={e => setNewScoreVal(Number(e.target.value))}
                  className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white font-mono text-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Required Adjudication Rationale / Note (Audit Logged):
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder="State the clinical or procedural basis for reconciling, upholding, or escalating..."
                className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white text-xs focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2d45]">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!actionNote.trim()}
                onClick={handleConfirmAdjudication}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs rounded transition-colors"
              >
                Confirm Adjudication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
