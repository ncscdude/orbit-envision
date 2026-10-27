import React, { useState } from 'react';
import { useOrbit } from '../state/context';
import { Milestone, Risk } from '../types';
import {
  Download,
  Plus,
  Edit2
} from 'lucide-react';

export const ViewOpsRegisters: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const [activeTab, setActiveTab] = useState<'milestones' | 'risks' | 'improvements' | 'boards' | 'readiness' | 'results'>('milestones');
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);

  // New AAR item modal state
  const [newImprovementModalOpen, setNewImprovementModalOpen] = useState(false);
  const [impPhase, setImpPhase] = useState<number>(8);
  const [impTitle, setImpTitle] = useState('');
  const [impOwner] = useState('BMO Lead');
  const [impDue, setImpDue] = useState('2026-12-15');
  const [impLesson, setImpLesson] = useState('');

  const canEdit = state.currentRole === 'Board Recorder' || state.currentRole === 'BMO Lead';

  const exportCsv = <T extends object>(filename: string, rows: T[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [headers, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const _handleSaveMilestone = () => {
    if (!editingMilestone) return;
    dispatch({
      type: 'UPDATE_MILESTONE',
      milestoneId: editingMilestone.id,
      updates: {
        planned: editingMilestone.planned,
        actual: editingMilestone.actual,
        status: editingMilestone.status
      }
    });
    setEditingMilestone(null);
  };

  const _handleSaveRisk = () => {
    if (!editingRisk) return;
    dispatch({
      type: 'UPDATE_RISK',
      riskId: editingRisk.id,
      updates: {
        mitigation: editingRisk.mitigation,
        suspense: editingRisk.suspense,
        status: editingRisk.status,
        escalate: editingRisk.escalate
      }
    });
    setEditingRisk(null);
  };

  const handleAddImprovement = () => {
    if (!impTitle.trim()) return;
    dispatch({
      type: 'ADD_IMPROVEMENT_ACTION',
      action: {
        phase: impPhase,
        title: impTitle,
        owner: impOwner,
        due: impDue,
        lessonLearned: impLesson
      }
    });
    setNewImprovementModalOpen(false);
    setImpTitle('');
    setImpLesson('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Operations Logs</span>
            <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              ORBIT DATA LOGS
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Structured tracking tables for milestones, risks/issues, phase 8 AAR items, and packet data.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Edit Permission: <strong className={canEdit ? 'text-emerald-400' : 'text-amber-400'}>{canEdit ? 'Granted' : 'Read-Only (HQ)'}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1e2d45] pb-2 overflow-x-auto text-xs scrollbar-none">
        {[
          { id: 'milestones', label: '1. Milestones (Gantt Planned vs Actual)' },
          { id: 'risks', label: '2. Risk, Issue & Change Log' },
          { id: 'improvements', label: '3. AAR Items (Phase 8)' },
          { id: 'boards', label: '4. Cycle Log' },
          { id: 'readiness', label: '5. Packet Check' },
          { id: 'results', label: '6. Results & Placement' }
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

      {/* TAB 1: MILESTONES (Gantt Planned vs Actual) */}
      {activeTab === 'milestones' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Milestone Log (Late Items First)</h3>
              <p className="text-xs text-slate-400">
                Compare planned vs actual timelines across cycles. Editable by Board Recorder & BMO Lead.
              </p>
            </div>
            <button
              onClick={() => exportCsv('orbit_milestones.csv', state.milestones)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-[#05080f] border border-[#1e2d45] rounded hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-[11px] font-mono text-slate-400 uppercase bg-[#05080f]">
                  <th className="py-2.5 px-3">Board</th>
                  <th className="py-2.5 px-3">Phase</th>
                  <th className="py-2.5 px-3">Milestone Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Planned</th>
                  <th className="py-2.5 px-3">Actual</th>
                  <th className="py-2.5 px-3">Status</th>
                  {canEdit && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60 font-mono">
                {state.milestones
                  .slice()
                  .sort((a, b) => (a.status === 'Delayed' ? -1 : b.status === 'Delayed' ? 1 : 0))
                  .slice(0, 15)
                  .map(m => (
                    <tr key={m.id} className="hover:bg-[#0f172a] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-cyan-400">{m.boardId}</td>
                      <td className="py-2.5 px-3 text-slate-300">Phase {m.phase}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-white">{m.name}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{m.owner}</td>
                      <td className="py-2.5 px-3 text-slate-300">{m.planned}</td>
                      <td className="py-2.5 px-3 text-slate-400">{m.actual || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'Done' ? 'bg-emerald-950 text-emerald-300' :
                          m.status === 'Delayed' ? 'bg-red-950 text-red-300 border border-red-800' :
                          m.status === 'At Risk' ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingMilestone(m)}
                            className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RISKS / ISSUES / CHANGES */}
      {activeTab === 'risks' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Risk, Issue & Change Log</h3>
              <p className="text-xs text-slate-400">
                Track open risks, aging buckets, mitigations, and escalation triggers.
              </p>
            </div>
            <button
              onClick={() => exportCsv('orbit_risks.csv', state.risks)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-[#05080f] border border-[#1e2d45] rounded hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-[11px] font-mono text-slate-400 uppercase bg-[#05080f]">
                  <th className="py-2.5 px-3">ID / Type</th>
                  <th className="py-2.5 px-3">Title & Summary</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Opened</th>
                  <th className="py-2.5 px-3">Suspense</th>
                  <th className="py-2.5 px-3">Mitigation Action</th>
                  <th className="py-2.5 px-3">Status</th>
                  {canEdit && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60 font-mono">
                {state.risks.map(r => (
                  <tr key={r.id} className="hover:bg-[#0f172a] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">
                      <div>{r.id}</div>
                      <span className={`text-[10px] ${r.type === 'Issue' ? 'text-amber-400' : 'text-slate-400'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-white max-w-xs">{r.title}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{r.owner}</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.opened}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{r.suspense}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans max-w-sm text-[11px]">{r.mitigation}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'Open' ? (r.escalate ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300') : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {r.status} {r.escalate ? '(Escalate)' : ''}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingRisk(r)}
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AAR ITEMS (Phase 8) */}
      {activeTab === 'improvements' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Phase 8 AAR Items</h3>
              <p className="text-xs text-slate-400">
                AAR items from closed cycles with owner and due date (K-11).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewImprovementModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-black bg-cyan-500 hover:bg-cyan-400 rounded transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Log AAR Item
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {state.improvementActions.map(act => (
              <div key={act.id} className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold">{act.id}</span>
                    <span className="font-semibold text-white text-sm">{act.title}</span>
                    <span className="font-mono text-[10px] bg-[#1e2d45] px-2 py-0.5 rounded text-slate-300">
                      Phase {act.phase}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    act.done ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                  }`}>
                    {act.done ? 'Resolved' : 'Pending Suspense'}
                  </span>
                </div>

                <div className="text-slate-400 flex gap-4 font-mono text-[11px]">
                  <span>Owner: <strong className="text-slate-200">{act.owner}</strong></span>
                  <span>Due Date: <strong className="text-white">{act.due}</strong></span>
                </div>

                {act.lessonLearned && (
                  <div className="p-2 bg-[#0a1020] border border-[#1e2d45] rounded text-[11px] text-slate-300 italic">
                    <span className="font-semibold text-purple-300 not-italic mr-1">Lesson Learned:</span>
                    {act.lessonLearned}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CYCLE LOG */}
      {activeTab === 'boards' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#1e2d45] pb-3">
            <h3 className="font-bold text-white text-sm">Cycle Log ({state.boards.length} Cycles)</h3>
            <button
              onClick={() => exportCsv('orbit_boards.csv', state.boards)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-300 bg-[#05080f] border border-[#1e2d45] rounded hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-3">Board ID</th>
                  <th className="py-2 px-3">Cycle Name</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Start Date</th>
                  <th className="py-2 px-3">Lock Date</th>
                  <th className="py-2 px-3">Release Date</th>
                  <th className="py-2 px-3">Candidates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
                {state.boards.map(b => (
                  <tr key={b.id} className="hover:bg-[#0f172a]">
                    <td className="py-2 px-3 text-cyan-400 font-bold">{b.id}</td>
                    <td className="py-2 px-3 text-white font-sans font-semibold">{b.name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Complete' ? 'bg-blue-950 text-blue-300' :
                        b.status === 'On Track' ? 'bg-emerald-950 text-emerald-300' :
                        b.status === 'At Risk' ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{b.startDate}</td>
                    <td className="py-2 px-3">{b.lockDate}</td>
                    <td className="py-2 px-3">{b.releaseDate}</td>
                    <td className="py-2 px-3">{b.candidateCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PACKET CHECK */}
      {activeTab === 'readiness' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#1e2d45] pb-3">
            <h3 className="font-bold text-white text-sm">Packet Check</h3>
            <button
              onClick={() => exportCsv('orbit_readiness.csv', state.candidates.map(c => ({ id: c.id, name: c.name, complete: c.packetReadiness.complete })))}
              className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-300 bg-[#05080f] border border-[#1e2d45] rounded hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-3">Candidate ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Eligibility</th>
                  <th className="py-2 px-3">Documents</th>
                  <th className="py-2 px-3">Complete</th>
                  <th className="py-2 px-3">Exceptions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
                {state.candidates.map(c => (
                  <tr key={c.id} className="hover:bg-[#0f172a]">
                    <td className="py-2 px-3 text-cyan-400 font-bold">{c.id}</td>
                    <td className="py-2 px-3 text-white font-sans">{c.name}</td>
                    <td className="py-2 px-3 text-emerald-400">{c.packetReadiness.eligibility ? 'PASS' : 'FAIL'}</td>
                    <td className="py-2 px-3 text-emerald-400">{c.packetReadiness.documents ? 'PASS' : 'FAIL'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${c.packetReadiness.complete ? 'text-emerald-300 bg-emerald-950' : 'text-amber-300 bg-amber-950'}`}>
                        {c.packetReadiness.complete ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] font-sans">
                      {c.packetReadiness.exceptions.join('; ') || 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: RESULTS & POST-BOARD */}
      {activeTab === 'results' && (
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#1e2d45] pb-3">
            <h3 className="font-bold text-white text-sm">Results & Placement Log</h3>
            <button
              onClick={() => exportCsv('orbit_official_slates.csv', state.officialMatches)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-300 bg-[#05080f] border border-[#1e2d45] rounded hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-3">Candidate ID</th>
                  <th className="py-2 px-3">Billet ID</th>
                  <th className="py-2 px-3">Match Score</th>
                  <th className="py-2 px-3">Approved</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
                {state.officialMatches.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#0f172a]">
                    <td className="py-2 px-3 text-cyan-400 font-bold">{m.candidateId}</td>
                    <td className="py-2 px-3 text-purple-300">{m.billetId}</td>
                    <td className="py-2 px-3 text-white font-bold">{m.score.toFixed(1)}</td>
                    <td className="py-2 px-3 text-emerald-400">{m.approved ? 'Yes' : 'Pending'}</td>
                    <td className="py-2 px-3">{m.overridden ? 'Human Override' : 'Algorithmic Proposed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Improvement Modal */}
      {newImprovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-semibold text-white text-sm">Log Phase 8 AAR Item</h3>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">Action Title:</label>
              <input
                type="text"
                value={impTitle}
                onChange={e => setImpTitle(e.target.value)}
                placeholder="e.g. Automate ARMS Socket Failure Telemetry Alerts"
                className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Related Phase:</label>
                <select
                  value={impPhase}
                  onChange={e => setImpPhase(Number(e.target.value))}
                  className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                    <option key={p} value={p}>Phase {p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Suspense Date:</label>
                <input
                  type="date"
                  value={impDue}
                  onChange={e => setImpDue(e.target.value)}
                  className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white"
                >
                </input>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">Lesson Learned Note:</label>
              <textarea
                rows={3}
                value={impLesson}
                onChange={e => setImpLesson(e.target.value)}
                placeholder="Document cause of latency or operational gap observed in previous cycle..."
                className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2d45]">
              <button
                onClick={() => setNewImprovementModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!impTitle.trim()}
                onClick={handleAddImprovement}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs rounded transition-colors"
              >
                Save Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
