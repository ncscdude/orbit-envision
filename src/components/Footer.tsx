import React from 'react';
import { useOrbit } from '../state/context';
import { RotateCcw, ShieldCheck, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  const { state, dispatch } = useOrbit();

  return (
    <footer className="bg-[#0a1020] border-t border-[#1e2d45] px-4 py-2 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3 no-print">
      <div className="flex items-center gap-3 font-mono text-[11px]">
        <span className="text-amber-400 font-medium">FICTIONAL DATA · NOT FOR OPERATIONAL USE</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Actor: <strong className="text-slate-200">{state.actorName}</strong></span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Role: <strong className="text-cyan-400">{state.currentRole}</strong></span>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-slate-400">
          {state.chainTampered ? (
            <span className="text-red-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> DELTA Chain: Tamper Detected
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> DELTA Chain: SHA-256 Verified ({state.ledger.length} entries)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset Project ORBIT demo state to pristine initial seed?')) {
              dispatch({ type: 'RESET_DEMO' });
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] rounded transition-colors"
          title="Clear localStorage and restore initial demo baseline"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          <span>Reset Demo</span>
        </button>
      </div>
    </footer>
  );
};
