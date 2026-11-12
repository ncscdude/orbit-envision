/**
 * Project ORBIT - Late file panel (MVP build, DELTA Ledger screen)
 * A file that arrives after the record freeze: received, renamed, checked, held at WARN,
 * and filed to the record only after the BMO Lead accepts it. Every step is logged.
 */

import React, { useState } from 'react';
import { useOrbit } from '../state/context';
import { lateFiles } from '../lib/lateFiles';
import { FileClock, CheckCircle2 } from 'lucide-react';

export const LateFilePanel: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const canReceive = state.currentRole === 'BMO Lead' || state.currentRole === 'Board Recorder';
  const canAccept = state.currentRole === 'BMO Lead';
  const records = state.candidates.filter(c => c.boardId === state.selectedBoardId);
  const [recordId, setRecordId] = useState(records[0]?.id ?? '');
  const rows = lateFiles(state);
  const waiting = rows.filter(r => r.acceptedAt === null).length;
  const time = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}Z`;

  return (
    <section className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4 shadow-xl text-xs" data-testid="late-files">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <FileClock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Late Files After Record Freeze</h3>
            <span className={`font-mono text-xs px-2 py-0.5 rounded border ${waiting > 0 ? 'text-amber-300 bg-amber-950 border-amber-800' : 'text-emerald-300 bg-emerald-950 border-emerald-800'}`}>
              {waiting} WAITING
            </span>
          </div>
          <p className="text-slate-400 mt-1">
            A late file is renamed and checked like any other, always lands as WARN, and reaches the record only after the BMO Lead accepts it. The earlier version is kept.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={recordId}
            onChange={e => setRecordId(e.target.value)}
            aria-label="Record for the late file"
            disabled={!canReceive}
            className="p-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-white max-w-56"
          >
            {records.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} · {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!canReceive || !recordId}
            onClick={() => dispatch({ type: 'RECEIVE_LATE_FILE', candidateId: recordId })}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded transition-colors"
            title={canReceive ? 'Demo: a performance report update arrives for this record' : 'BMO Lead or Board Recorder receives late files'}
          >
            Receive Late File
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate-500 font-mono">No late files on this board. Pick a record and receive one to walk the gate.</p>
      ) : (
        <div className="overflow-x-auto font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px] uppercase bg-[#05080f]">
                <th className="py-2.5 px-3">File</th>
                <th className="py-2.5 px-3">Record</th>
                <th className="py-2.5 px-3">Canonical Name</th>
                <th className="py-2.5 px-3">Gate Result</th>
                <th className="py-2.5 px-3">Received</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
              {rows.map(r => (
                <tr key={r.fileId} className="hover:bg-[#0f172a] transition-colors">
                  <td className="py-2.5 px-3 text-white font-medium">{r.fileId}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{r.candidateId}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-bold">{r.file?.canonicalName ?? 'not found'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">WARN</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">
                    {time(r.receivedAt)} · {r.receivedBy}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {r.acceptedAt ? (
                      <span className="text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Accepted {time(r.acceptedAt)} · {r.acceptedBy}
                      </span>
                    ) : (
                      <span className="text-amber-400">Waiting for BMO Lead</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {!r.acceptedAt && (
                      <button
                        type="button"
                        disabled={!canAccept}
                        onClick={() => dispatch({ type: 'ACCEPT_LATE_FILE', fileId: r.fileId })}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold rounded font-sans"
                        title={canAccept ? 'Accept after review and file to the record' : 'Only the BMO Lead accepts a late file'}
                      >
                        Accept and File
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
