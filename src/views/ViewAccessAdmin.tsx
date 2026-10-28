/**
 * Project ORBIT - Access Admin (ORBIT Admin)
 * Roles (Admin requests, BMO Lead approves), board seating, access review, and system
 * diagnostics with logged repairs. The Admin sees everything but never votes or makes a
 * board decision. Code and sign-in control live outside ORBIT and are listed here read only.
 */

import React, { useMemo, useState } from 'react';
import { useOrbit } from '../state/context';
import { RequireRole } from '../auth/RequireRole';
import { DEV_USERS_SEED } from '../data/seed';
import { lookupRole } from '../auth/roleMap';
import { ROLE_ORDER } from '../auth/permissions';
import { effectiveRole } from '../state/reducer';
import { runDiagnostics } from '../lib/diagnostics';
import { AdminDiagnostics } from '../components/AdminDiagnostics';
import { Role } from '../types';
import { KeyRound, Armchair, ClipboardCheck, Stethoscope } from 'lucide-react';

type Tab = 'roles' | 'seating' | 'review' | 'diagnostics';

const ViewAccessAdminContent: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const isAdmin = state.currentRole === 'ORBIT Admin';
  const isBmo = state.currentRole === 'BMO Lead';
  const [tab, setTab] = useState<Tab>(isAdmin ? 'diagnostics' : 'roles');

  // Role request form
  const [userId, setUserId] = useState('');
  const [toRole, setToRole] = useState<string>('');
  const [reason, setReason] = useState('');
  const [temporary, setTemporary] = useState(false);

  // Seating
  const boardId = state.selectedBoardId;
  const slots = state.staffSlots.filter(s => s.boardId === boardId);
  const [seatNames, setSeatNames] = useState<Record<number, string>>({});

  // Diagnostics badge count
  const findings = useMemo(() => runDiagnostics(state), [state]);

  const users = DEV_USERS_SEED.map(u => {
    const tableRole = lookupRole(u.userId);
    const assignment = state.roleAssignments[u.userId];
    const lastSignIn = [...state.ledger].reverse().find(e => e.type === 'ROLE_CHANGE' && e.payload.userId === u.userId)?.timestamp ?? null;
    const denied = state.ledger.filter(e => e.type === 'ACCESS_DENIED' && e.actor === u.displayName).length;
    return { ...u, tableRole, role: effectiveRole(state, u.userId, tableRole), assignment, lastSignIn, denied };
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'diagnostics', label: 'Diagnostics & repair', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { id: 'roles', label: 'Roles', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: 'seating', label: 'Board seating', icon: <Armchair className="w-3.5 h-3.5" /> },
    { id: 'review', label: 'Access review', icon: <ClipboardCheck className="w-3.5 h-3.5" /> }
  ];

  const faults = findings.filter(f => f.severity !== 'OK').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 text-xs">
      <div className="border-b border-[#1e2d45] pb-3">
        <span className="font-mono text-red-300 uppercase tracking-wider font-semibold">ORBIT Admin</span>
        <h2 className="text-xl font-bold text-white">Access Admin</h2>
        <p className="text-slate-400">
          {isAdmin
            ? 'You see every tool and record. You request role changes (the BMO Lead approves), seat board members, and run logged repairs. You never vote or make a board decision.'
            : 'BMO Lead view: approve or reject role change requests. Everything else here is read only.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-1" role="tablist">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border ${tab === t.id ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'text-slate-400 border-[#1e2d45] hover:text-white'}`}
          >
            {t.icon}
            {t.label}
            {t.id === 'diagnostics' && faults > 0 && <span className="ml-1 px-1.5 rounded bg-red-900 text-red-200 font-mono">{faults}</span>}
            {t.id === 'roles' && state.roleRequests.some(r => r.status === 'Pending') && (
              <span className="ml-1 px-1.5 rounded bg-amber-900 text-amber-200 font-mono">{state.roleRequests.filter(r => r.status === 'Pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'diagnostics' && <AdminDiagnostics />}

      {tab === 'roles' && (
        <section className="space-y-3">
          {isAdmin && (
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded p-3 space-y-2" data-testid="role-request-form">
              <p className="text-white font-semibold">Request a role change (the BMO Lead approves)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select value={userId} onChange={e => setUserId(e.target.value)} aria-label="User to change" className="bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white">
                  <option value="">Choose a user</option>
                  {DEV_USERS_SEED.filter(u => u.userId !== state.userId).map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.displayName}
                    </option>
                  ))}
                </select>
                <select value={toRole} onChange={e => setToRole(e.target.value)} aria-label="New role" className="bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white">
                  <option value="">Choose a role</option>
                  {ROLE_ORDER.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="NONE">No access</option>
                </select>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={temporary} onChange={e => setTemporary(e.target.checked)} /> Temporary (24 hours, break-glass)
                </label>
              </div>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                aria-label="Reason for role change"
                placeholder="Reason, at least 20 characters"
                className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white"
              />
              <button
                type="button"
                disabled={!userId || !toRole || reason.trim().length < 20}
                onClick={() => {
                  dispatch({ type: 'REQUEST_ROLE_CHANGE', userId, toRole: toRole === 'NONE' ? null : (toRole as Role), reason, temporary });
                  setUserId('');
                  setToRole('');
                  setReason('');
                  setTemporary(false);
                }}
                className="px-3 py-1.5 rounded bg-cyan-700 text-white font-semibold disabled:opacity-40"
              >
                Submit request
              </button>
            </div>
          )}

          <table className="w-full text-left bg-[#0a1020] border border-[#1e2d45] rounded" data-testid="role-requests">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-[#1e2d45]">
                <th className="py-2 px-2">Request</th>
                <th className="py-2 px-2">User</th>
                <th className="py-2 px-2">Change</th>
                <th className="py-2 px-2">Reason</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.roleRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 px-2 text-slate-500 italic">
                    No role change requests yet.
                  </td>
                </tr>
              )}
              {[...state.roleRequests].reverse().map(r => (
                <tr key={r.id} className="border-b border-[#1e2d45]/50 align-top">
                  <td className="py-2 px-2 font-mono text-cyan-400">{r.id}</td>
                  <td className="py-2 px-2 text-white">{r.displayName}</td>
                  <td className="py-2 px-2 text-slate-300">
                    {r.fromRole ?? 'none'} → {r.toRole ?? 'no access'}
                    {r.temporary && <span className="block text-amber-300">temporary 24h</span>}
                  </td>
                  <td className="py-2 px-2 text-slate-400">{r.reason}</td>
                  <td className="py-2 px-2">
                    {r.status === 'Pending' && isBmo ? (
                      <span className="flex gap-1">
                        <button type="button" onClick={() => dispatch({ type: 'DECIDE_ROLE_REQUEST', requestId: r.id, approve: true })} className="px-2 py-1 rounded bg-emerald-800 text-white">
                          Approve
                        </button>
                        <button type="button" onClick={() => dispatch({ type: 'DECIDE_ROLE_REQUEST', requestId: r.id, approve: false })} className="px-2 py-1 rounded bg-red-900 text-white">
                          Reject
                        </button>
                      </span>
                    ) : (
                      <span className={r.status === 'Approved' ? 'text-emerald-300' : r.status === 'Rejected' ? 'text-red-300' : 'text-amber-300'}>
                        {r.status}
                        {r.decidedBy && <span className="block text-[10px] text-slate-500">by {r.decidedBy}</span>}
                        {r.expiresAt && <span className="block text-[10px] text-slate-500">expires {r.expiresAt.slice(0, 16)}Z</span>}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'seating' && (
        <section className="space-y-2" data-testid="seating">
          <p className="text-slate-400">
            Seats on {boardId}. One Board President per board. {isAdmin ? 'Type a name and Seat, or Vacate.' : 'Read only for your role.'}
          </p>
          <table className="w-full text-left bg-[#0a1020] border border-[#1e2d45] rounded">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-[#1e2d45]">
                <th className="py-2 px-2">Seat</th>
                <th className="py-2 px-2">Member</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s, i) => (
                <tr key={i} className="border-b border-[#1e2d45]/50">
                  <td className="py-1.5 px-2 text-slate-300">{s.role}</td>
                  <td className="py-1.5 px-2 text-white">{s.assigned ? s.name : <span className="text-slate-500 italic">Vacant</span>}</td>
                  <td className="py-1.5 px-2 text-right">
                    {isAdmin &&
                      (s.assigned ? (
                        <button type="button" onClick={() => dispatch({ type: 'SEAT_MEMBER', boardId, slotIndex: i, name: null })} className="px-2 py-1 rounded border border-[#1e2d45] text-slate-300">
                          Vacate
                        </button>
                      ) : (
                        <span className="inline-flex gap-1">
                          <input
                            value={seatNames[i] ?? ''}
                            onChange={e => setSeatNames(n => ({ ...n, [i]: e.target.value }))}
                            aria-label={`Name for seat ${i + 1}`}
                            placeholder="Rank and name"
                            className="bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-white w-40"
                          />
                          <button
                            type="button"
                            disabled={!(seatNames[i] ?? '').trim()}
                            onClick={() => {
                              dispatch({ type: 'SEAT_MEMBER', boardId, slotIndex: i, name: seatNames[i] });
                              setSeatNames(n => ({ ...n, [i]: '' }));
                            }}
                            className="px-2 py-1 rounded bg-cyan-800 text-white disabled:opacity-40"
                          >
                            Seat
                          </button>
                        </span>
                      ))}
                  </td>
                </tr>
              ))}
              {slots.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 px-2 text-slate-500 italic">
                    No seats defined for this board yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'review' && (
        <section className="space-y-2" data-testid="access-review">
          <p className="text-slate-400">Who holds which role, last sign-in, and denied attempts. Export from the DELTA Ledger for inspections.</p>
          <table className="w-full text-left bg-[#0a1020] border border-[#1e2d45] rounded">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-slate-400 border-b border-[#1e2d45]">
                <th className="py-2 px-2">User</th>
                <th className="py-2 px-2">Role table</th>
                <th className="py-2 px-2">Current role</th>
                <th className="py-2 px-2">Last sign-in</th>
                <th className="py-2 px-2">Denied attempts</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} className="border-b border-[#1e2d45]/50">
                  <td className="py-1.5 px-2 text-white">
                    {u.displayName}
                    <span className="block font-mono text-[10px] text-slate-500">{u.userId}</span>
                  </td>
                  <td className="py-1.5 px-2 text-slate-300">{u.tableRole ?? 'none'}</td>
                  <td className="py-1.5 px-2 text-slate-300">
                    {u.role ?? 'no access'}
                    {u.assignment?.expiresAt && <span className="block text-amber-300 text-[10px]">temporary to {u.assignment.expiresAt.slice(0, 16)}Z</span>}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-slate-400">{u.lastSignIn ? `${u.lastSignIn.slice(0, 16).replace('T', ' ')}Z` : 'never'}</td>
                  <td className={`py-1.5 px-2 font-mono ${u.denied > 0 ? 'text-amber-300' : 'text-slate-400'}`}>{u.denied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export const ViewAccessAdmin: React.FC = () => (
  <RequireRole viewId="VIEW-AccessAdmin">
    <ViewAccessAdminContent />
  </RequireRole>
);
