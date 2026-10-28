/**
 * Project ORBIT - Admin diagnostics and repair (Access Admin tab)
 * Health checks on the live state and logged repairs. A repair fixes the system, never a decision.
 */

import React, { useMemo, useState } from 'react';
import { useOrbit } from '../state/context';
import { runDiagnostics, REPAIR_LABELS, Finding } from '../lib/diagnostics';
import { GitBranch, Wrench, Bug } from 'lucide-react';

export const AdminDiagnostics: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const isAdmin = state.currentRole === 'ORBIT Admin';
  const findings = useMemo(() => runDiagnostics(state), [state]);
  const [repairFor, setRepairFor] = useState<Finding | null>(null);
  const [repairReason, setRepairReason] = useState('');

  return (
    <section className="space-y-3" data-testid="diagnostics">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-slate-400">
          Health checks on the live state. A repair fixes the system, never a decision: it does not change a vote, a match approval, or an Order of Merit. Each repair needs a reason and is logged.
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'ADMIN_INJECT_GLITCH' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#1e2d45] text-slate-300 hover:text-white"
            title="Demo only: creates a duplicate score and a broken selection so you can practice a repair"
          >
            <Bug className="w-3.5 h-3.5" /> Inject test glitch (demo)
          </button>
        )}
      </div>
      <table className="w-full text-left bg-[#0a1020] border border-[#1e2d45] rounded">
        <thead>
          <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-[#1e2d45]">
            <th className="py-2 px-2">Check</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">Finding</th>
            <th className="py-2 px-2 text-right">Repair</th>
          </tr>
        </thead>
        <tbody>
          {findings.map(f => (
            <tr key={f.id} className="border-b border-[#1e2d45]/50 align-top">
              <td className="py-2 px-2 text-white">{f.check}</td>
              <td className="py-2 px-2 font-mono">
                <span className={f.severity === 'OK' ? 'text-emerald-300' : f.severity === 'Warn' ? 'text-amber-300' : 'text-red-300'}>{f.severity}</span>
              </td>
              <td className="py-2 px-2 text-slate-300">{f.detail}</td>
              <td className="py-2 px-2 text-right">
                {f.repair && isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setRepairFor(f);
                      setRepairReason('');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-200"
                  >
                    <Wrench className="w-3 h-3" /> Repair
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {repairFor?.repair && (
        <div className="bg-[#0a1020] border border-cyan-800 rounded p-3 space-y-2" role="dialog" aria-label="Repair">
          <p className="text-white font-semibold">{REPAIR_LABELS[repairFor.repair]}{repairFor.targetId ? ` (${repairFor.targetId})` : ''}</p>
          <textarea
            value={repairReason}
            onChange={e => setRepairReason(e.target.value)}
            rows={2}
            aria-label="Repair reason"
            placeholder="Reason, at least 20 characters (what happened and who reported it)"
            className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setRepairFor(null)} className="px-3 py-1.5 rounded border border-[#1e2d45] text-slate-300">
              Cancel
            </button>
            <button
              type="button"
              disabled={repairReason.trim().length < 20}
              onClick={() => {
                dispatch({ type: 'ADMIN_REPAIR', repair: repairFor.repair!, targetId: repairFor.targetId, reason: repairReason });
                setRepairFor(null);
              }}
              className="px-3 py-1.5 rounded bg-cyan-700 text-white font-semibold disabled:opacity-40"
            >
              Run repair
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#0a1020] border border-[#1e2d45] rounded p-3 space-y-1">
        <p className="text-white font-semibold flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-cyan-400" /> Controlled outside ORBIT (read only)
        </p>
        <p className="text-slate-400">Code changes: GitHub branch protection, CODEOWNERS, and required review (web.git.mil in Envision).</p>
        <p className="text-slate-400">Who can sign in: Cloudflare Access policy for this demo (Envision identity in production).</p>
      </div>
    </section>
  );
};
