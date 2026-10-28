/**
 * Project ORBIT - Full-text reader (A-3)
 * Opens the complete SOI, commander's comments, and appraisals for a record, with numbered
 * paragraphs so a voter can check any AI summary line against the original wording.
 * Each document opened is logged to DELTA (RECORD_OPEN).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { useOrbit } from '../state/context';
import { Candidate } from '../types';
import { buildFullRecord, FullDocument } from '../data/fullText';

export type ReaderTab = 'SOI' | 'Commander' | 'Appraisals';

interface FullTextReaderProps {
  candidate: Candidate;
  startOn?: ReaderTab;
  onClose: () => void;
}

const DocumentBody: React.FC<{ doc: FullDocument }> = ({ doc }) => (
  <article className="space-y-2" aria-label={doc.title}>
    <header className="border-b border-[#1e2d45] pb-2">
      <h4 className="text-sm font-bold text-white">{doc.title}</h4>
      <p className="text-[11px] font-mono text-slate-400">
        Source: {doc.source} · Dated {doc.dated} · {doc.author}
      </p>
    </header>
    <ol className="space-y-2">
      {doc.paragraphs.map((p, i) => (
        <li key={i} className="flex gap-2 text-slate-200 leading-relaxed">
          <span className="font-mono text-[10px] text-slate-500 pt-0.5 w-6 shrink-0">¶{i + 1}</span>
          <span>{p}</span>
        </li>
      ))}
    </ol>
  </article>
);

export const FullTextReader: React.FC<FullTextReaderProps> = ({ candidate, startOn = 'SOI', onClose }) => {
  const { state, dispatch } = useOrbit();
  const [tab, setTab] = useState<ReaderTab>(startOn);
  const record = useMemo(() => buildFullRecord(candidate, state.endorsers), [candidate, state.endorsers]);
  const logged = useRef<Set<string>>(new Set());

  useEffect(() => {
    const key = `${candidate.id}|${tab}`;
    if (logged.current.has(key)) return;
    logged.current.add(key);
    dispatch({ type: 'LOG_RECORD_OPEN', candidateId: candidate.id, document: tab });
  }, [candidate.id, tab, dispatch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tabs: { id: ReaderTab; label: string }[] = [
    { id: 'SOI', label: 'Statement of Intent' },
    { id: 'Commander', label: "Commander's Comments" },
    { id: 'Appraisals', label: `Appraisals (${record.appraisals.length})` }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Full record">
      <div className="bg-[#0a1020] border border-cyan-800 rounded-md w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-xs">
        <div className="flex items-center justify-between border-b border-[#1e2d45] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white text-sm">Full record: {candidate.name}</span>
            <span className="font-mono text-cyan-400">{candidate.id}</span>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close full record">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex border-b border-[#1e2d45]">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-2 font-mono ${tab === t.id ? 'text-cyan-300 bg-cyan-950/40 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto p-4 space-y-6">
          {tab === 'SOI' && <DocumentBody doc={record.soi} />}
          {tab === 'Commander' && <DocumentBody doc={record.commander} />}
          {tab === 'Appraisals' && record.appraisals.map(d => <DocumentBody key={d.title} doc={d} />)}
        </div>
        <p className="border-t border-[#1e2d45] px-4 py-2 text-[10px] text-slate-500">
          Original wording from the source system. The AI summary in the Scribe drawer is a shortcut; this text is the record. Opening is logged.
        </p>
      </div>
    </div>
  );
};
