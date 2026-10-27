/**
 * Project ORBIT - "No access" screen (INTENT-001)
 * Shown when the identity has no ORBIT role, or when a view is opened by a role it does not allow.
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AccessDeniedProps {
  actor: string;
  role: string;
  detail: string;
  onReturn?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ actor, role, detail, onReturn }) => (
  <div
    role="alert"
    className="p-8 text-center bg-[#0a1020] border border-red-900/60 rounded-md max-w-xl mx-auto my-12 space-y-4 shadow-2xl"
  >
    <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-400">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-white">No access</h2>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{detail}</p>
    </div>
    <div className="p-3 bg-[#05080f] rounded border border-[#1e2d45] text-xs font-mono text-slate-300 space-y-1">
      <div>Actor: <span className="text-white">{actor}</span></div>
      <div>Role: <span className="text-cyan-400">{role}</span></div>
      <div className="text-[10px] text-slate-500">This attempt is recorded in the DELTA ledger as ACCESS_DENIED.</div>
    </div>
    {onReturn && (
      <button
        type="button"
        onClick={onReturn}
        className="px-3 py-1.5 rounded text-xs font-medium text-cyan-300 bg-cyan-950/50 border border-cyan-800 hover:bg-cyan-900/60 transition-colors"
      >
        Return to my landing view
      </button>
    )}
  </div>
);
