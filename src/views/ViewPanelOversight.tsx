/**
 * Project ORBIT - Panel Oversight (Board President)
 * The President's control page: when panel members see each AI item, panel progress and
 * divergence, re-votes and flags, record issues sent to the Board Recorder, and the freshness
 * of the data feeding this board. BMO Lead and Board Recorder view it read only.
 */

import React, { useMemo, useState } from 'react';
import { useOrbit } from '../state/context';
import { useNav } from '../state/useNav';
import { RequireRole } from '../auth/RequireRole';
import { AiBadge } from '../components/AiBadge';
import { AI_FIELDS, AI_TIMINGS, DEFAULT_AI_VISIBILITY, panelOversight, scoreKeyFor } from '../lib/panel';
import { AiTiming, AiVisibility } from '../types';
import { Users, Eye, RotateCcw, FileWarning, Database, Save } from 'lucide-react';

const ViewPanelOversightContent: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const { may, go } = useNav();
  const isPresident = state.currentRole === 'Board President';
  const boardId = state.selectedBoardId;
  const board = state.boards.find(b => b.id === boardId) ?? state.boards[0];
  const saved: AiVisibility = state.aiVisibility[boardId] ?? DEFAULT_AI_VISIBILITY;
  const [draft, setDraft] = useState<AiVisibility>(saved);
  const [draftBoard, setDraftBoard] = useState(boardId);
  if (draftBoard !== boardId) {
    setDraftBoard(boardId);
    setDraft(saved);
  }
  const dirty = AI_FIELDS.some(f => draft[f.id] !== saved[f.id]);

  const records = useMemo(() => state.candidates.filter(c => c.boardId === boardId), [state.candidates, boardId]);
  const progress = useMemo(
    () => panelOversight(records, isPresident ? scoreKeyFor(state) : 'DEV-PRES-01', 'Board President'),
    [records, isPresident, state]
  );
  const flagged = records.filter(c => c.flagged);
  const issues = state.risks.filter(r => r.boardId === boardId && r.title.startsWith('Record issue'));
  const exceptions = records.filter(c => !c.packetReadiness.complete || c.packetReadiness.exceptions.length > 0);

  const [issueRecord, setIssueRecord] = useState('');
  const [issueText, setIssueText] = useState('');

  const now = Date.now();
  const hoursAgo = (iso: string) => Math.max(0, Math.round((now - new Date(iso).getTime()) / 3600000));

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10 text-xs">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <span className="font-mono text-cyan-400 uppercase tracking-wider font-semibold">Board President</span>
          <h2 className="text-xl font-bold text-white">Panel Oversight</h2>
          <p className="text-slate-400">
            {board.name} · {records.length} records · {isPresident ? 'you preside over this board' : 'read only for your role'}
          </p>
        </div>
        <select
          value={boardId}
          onChange={e => dispatch({ type: 'SET_BOARD', boardId: e.target.value })}
          aria-label="Board"
          className="bg-[#0a1020] border border-[#1e2d45] text-white font-semibold text-sm rounded px-3 py-1.5"
        >
          {state.boards.slice(0, 4).map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* 1. AI visibility */}
      <section className="bg-[#0a1020] border border-purple-800/70 rounded-md p-4 space-y-3" data-testid="ai-visibility">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-300" /> When panel members see AI and model output <AiBadge />
          </h3>
          {isPresident && (
            <button
              type="button"
              disabled={!dirty}
              onClick={() => dispatch({ type: 'SET_AI_VISIBILITY', boardId, settings: draft })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-800 border border-purple-600 text-white font-semibold disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" /> Save settings
            </button>
          )}
        </div>
        <p className="text-slate-400">
          Applies to every voter on this board, including you. The BMO Lead, Recorder, and Admin always see everything. Each change is logged to DELTA.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-[#1e2d45]">
                <th className="py-1.5 px-2">AI item</th>
                {AI_TIMINGS.map(t => (
                  <th key={t.id} className="py-1.5 px-2 text-center" title={t.detail}>
                    {t.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AI_FIELDS.map(f => (
                <tr key={f.id} className="border-b border-[#1e2d45]/50">
                  <td className="py-2 px-2">
                    <div className="text-white font-semibold">{f.label}</div>
                    <div className="text-[10px] text-slate-500">{f.detail}</div>
                  </td>
                  {AI_TIMINGS.map(t => (
                    <td key={t.id} className="py-2 px-2 text-center">
                      <input
                        type="radio"
                        name={`ai-${f.id}`}
                        aria-label={`${f.label}: ${t.label}`}
                        checked={draft[f.id] === t.id}
                        disabled={!isPresident}
                        onChange={() => setDraft(d => ({ ...d, [f.id]: t.id as AiTiming }))}
                        className="accent-purple-400"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-500">
          Before: visible while reviewing · During: after the member scores that record · After: once the Order of Merit is certified · Off: never shown to the panel.
        </p>
      </section>

      {/* 2. Panel progress */}
      <section className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-2">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" /> Panel progress and divergence
        </h3>
        <p className="text-slate-400">Divergent: a score 1.5 or more points from that record&apos;s panel average.</p>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-[#1e2d45]">
              <th className="py-1.5 px-2">Voter</th>
              <th className="py-1.5 px-2">Scored</th>
              <th className="py-1.5 px-2">Average</th>
              <th className="py-1.5 px-2">Divergent</th>
            </tr>
          </thead>
          <tbody>
            {progress.map(o => (
              <tr key={o.id} className="border-b border-[#1e2d45]/50">
                <td className="py-1.5 px-2 text-white">{o.name}</td>
                <td className="py-1.5 px-2 font-mono text-slate-300">
                  {o.scored} / {o.total}
                </td>
                <td className="py-1.5 px-2 font-mono text-slate-300">{o.avg ?? '—'}</td>
                <td className={`py-1.5 px-2 font-mono ${o.divergent > 0 ? 'text-amber-300' : 'text-slate-400'}`}>{o.divergent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3. Re-votes and flags */}
        <section className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-300" /> Re-votes and flags ({flagged.length})
          </h3>
          {flagged.length === 0 ? (
            <p className="text-slate-500 italic">No records flagged.</p>
          ) : (
            <ul className="space-y-1.5">
              {flagged.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-2 bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1.5">
                  <span>
                    <span className="font-mono text-cyan-400">{c.id}</span> <span className="text-white">{c.name}</span>
                    <span className="block text-[10px] text-slate-400">{c.flagReason ?? 'Flagged for discussion'}</span>
                  </span>
                  {may('VIEW-PanelReview') && (
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'SELECT_CANDIDATE', candidateId: c.id });
                        go('VIEW-PanelReview');
                      }}
                      className="text-cyan-300 hover:text-white font-mono"
                    >
                      Open
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. Record issues */}
        <section className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-2" data-testid="record-issues">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-amber-300" /> Record issues ({issues.length})
          </h3>
          <p className="text-slate-400">
            Missing or wrong data goes to the Board Recorder&apos;s Risk, Issue &amp; Change Log. The President requests corrections; source systems stay the record.
          </p>
          {isPresident && (
            <div className="space-y-1.5">
              <select
                value={issueRecord}
                onChange={e => setIssueRecord(e.target.value)}
                aria-label="Record with an issue"
                className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white"
              >
                <option value="">Choose a record</option>
                {records.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} {c.name}
                  </option>
                ))}
              </select>
              <textarea
                value={issueText}
                onChange={e => setIssueText(e.target.value)}
                rows={2}
                aria-label="Describe the issue"
                placeholder="What is missing or wrong (for example: 2024 appraisal not loaded)"
                className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white"
              />
              <button
                type="button"
                disabled={!issueRecord || issueText.trim().length < 10}
                onClick={() => {
                  dispatch({ type: 'REPORT_RECORD_ISSUE', candidateId: issueRecord, issue: issueText });
                  setIssueText('');
                  setIssueRecord('');
                }}
                className="px-3 py-1.5 rounded bg-amber-900/60 border border-amber-700 text-amber-100 font-semibold disabled:opacity-40"
              >
                Send to Board Recorder
              </button>
            </div>
          )}
          <ul className="space-y-1">
            {issues.map(r => (
              <li key={r.id} className="bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1.5">
                <span className="font-mono text-amber-300">{r.id}</span> {r.title.replace('Record issue on ', '')}
                <span className="block text-[10px] text-slate-500">
                  Owner {r.owner} · due {r.suspense} · {r.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 5. Data feeding this board */}
      <section className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-2">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" /> Data feeding this board
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {state.sources.map(src => {
            const h = hoursAgo(src.lastSyncAt);
            const tone = h > 168 ? 'text-red-300' : h > 24 ? 'text-amber-300' : 'text-emerald-300';
            return (
              <div key={src.id} className="bg-[#05080f] border border-[#1e2d45] rounded p-2">
                <div className="font-mono text-white">{src.id}</div>
                <div className={`font-mono ${tone}`}>{h}h since last sync</div>
                <div className="text-[10px] text-slate-500">{src.authoritativeSource}</div>
              </div>
            );
          })}
        </div>
        <p className="text-slate-400">
          Packet exceptions on this board: <strong className="text-white">{exceptions.length}</strong>. The BMO Lead clears them in HELIOS Command; report anything else above.
        </p>
      </section>
    </div>
  );
};

export const ViewPanelOversight: React.FC = () => (
  <RequireRole viewId="VIEW-PanelOversight">
    <ViewPanelOversightContent />
  </RequireRole>
);
