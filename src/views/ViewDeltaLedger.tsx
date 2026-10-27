import React, { useState, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { verifyChain } from '../state/delta';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  Clock,
  Upload,
  FolderTree,
  CheckCircle2
} from 'lucide-react';

export const ViewDeltaLedger: React.FC = () => {
  const { state, dispatch } = useOrbit();
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Replay mode state
  const [replayActive, setReplayActive] = useState(false);
  const [replaySliderVal, setReplaySliderVal] = useState<number>(state.ledger.length);

  // File canonicalizer routing node filter

  const verification = useMemo(() => {
    return verifyChain(state.ledger);
  }, [state.ledger]);

  const isTampered = state.chainTampered || !verification.valid;

  // Filtered ledger entries
  const filteredLedger = useMemo(() => {
    return state.ledger.filter(entry => {
      const matchesSearch =
        entry.id.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        entry.actor.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        entry.summary.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        entry.targetId.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        entry.type.toLowerCase().includes(ledgerSearch.toLowerCase());

      const matchesType = typeFilter === 'All' || entry.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [state.ledger, ledgerSearch, typeFilter]);

  const totalPages = Math.ceil(filteredLedger.length / pageSize) || 1;
  const paginatedEntries = filteredLedger.slice((page - 1) * pageSize, page * pageSize);

  const exportLedgerCsv = () => {
    const headers = 'ID,Timestamp,Actor,Role,TargetID,Type,Summary,PrevHash,Hash';
    const rows = state.ledger.map(e =>
      `"${e.id}","${e.timestamp}","${e.actor}","${e.role}","${e.targetId}","${e.type}","${e.summary.replace(/"/g, '""')}","${e.prevHash}","${e.hash}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DELTA_LEDGER_EXPORT_${Date.now()}.csv`;
    a.click();
  };

  const handleTamperToggle = () => {
    dispatch({ type: 'TAMPER_CHAIN', tamper: !state.chainTampered });
  };

  const handleRouteFile = (fileId: string, node: string) => {
    dispatch({ type: 'ROUTE_FILE', fileId, targetNode: node });
  };

  const handleCommitRouting = () => {
    if (state.currentRole !== 'BMO Lead') return;
    dispatch({ type: 'COMMIT_ROUTING' });
  };

  const sharePointNodes = [
    { code: '00SRT', label: '00SRT — Sorting Ingest Buffer' },
    { code: '01INT', label: '01INT: Intake & Cycle Stand-Up' },
    { code: '02SOI', label: '02SOI — Candidate Statements of Intent' },
    { code: '03ROP', label: '03ROP — Evaluation Reports (ROPs)' },
    { code: '04SURF', label: '04SURF — Single Record Files' },
    { code: '05ARMS', label: '05ARMS — Flight / Ops Qualifications' },
    { code: '06SCR', label: '06SCR — Panel Scoring Sheets' },
    { code: '07MAT', label: '07MAT — Match Lab Slating Packages' },
    { code: '08PUB', label: '08PUB — Published PSDM Memorandums' },
    { code: '09REF', label: '09REF — Reference Standards & DAFSC' },
    { code: '88ARC', label: '88ARC — Permanent Cycle Archive' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              DELTA Cryptographic Ledger & File Canonicalizer
            </h1>
            <span className="font-mono text-xs text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              SHA-256 APPEND-ONLY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cryptographic ledger tracking every human decision, anti-tamper verification, and automated 00SRT file canonicalizer.
          </p>
        </div>

        {/* Chain Verification Indicator & Tamper Test */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono border ${
              isTampered
                ? 'bg-red-950/80 text-red-300 border-red-700 animate-pulse font-bold'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
            }`}
          >
            {isTampered ? (
              <>
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>TAMPER DETECTED: INVALID PREVHASH</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CHAIN VERIFIED: {state.ledger.length} SHA-256 BLOCKS</span>
              </>
            )}
          </div>

          {state.currentRole === 'BMO Lead' && (
            <button
              type="button"
              onClick={handleTamperToggle}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border ${
                state.chainTampered
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                  : 'bg-red-950 hover:bg-red-900 border-red-800 text-red-300'
              }`}
            >
              {state.chainTampered ? 'Repair Chain' : 'Simulate Tamper Test'}
            </button>
          )}
        </div>
      </div>

      {/* Replay Mode Timeline Scrubber */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Historical Replay Mode Scrubber
            </span>
            {replayActive && (
              <span className="font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 text-[10px]">
                READ-ONLY HISTORICAL STATE
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setReplayActive(!replayActive);
              if (replayActive) {
                dispatch({ type: 'SET_REPLAY_INDEX', index: null });
              } else {
                dispatch({ type: 'SET_REPLAY_INDEX', index: replaySliderVal });
              }
            }}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              replayActive ? 'bg-purple-600 text-white' : 'bg-[#05080f] text-slate-300 border border-[#1e2d45]'
            }`}
          >
            {replayActive ? 'Exit Replay' : 'Enable Replay Scrubber'}
          </button>
        </div>

        {replayActive && (
          <div className="space-y-2 pt-2 border-t border-[#1e2d45]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Rewind Point: Entry {replaySliderVal} of {state.ledger.length}</span>
              <span className="text-cyan-300 font-bold">{state.ledger[Math.min(state.ledger.length - 1, replaySliderVal - 1)]?.id}</span>
            </div>
            <input
              type="range"
              min="1"
              max={state.ledger.length}
              value={replaySliderVal}
              onChange={e => {
                const val = Number(e.target.value);
                setReplaySliderVal(val);
                dispatch({ type: 'SET_REPLAY_INDEX', index: val });
              }}
              className="w-full accent-cyan-400"
            />
          </div>
        )}
      </div>

      {/* DELTA Table Section */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
          <div>
            <h3 className="font-bold text-white text-sm">DELTA Append-Only Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Complete chronological register of evaluations, score revisions, overrides, and governance commits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ledger entries, actors, IDs..."
                value={ledgerSearch}
                onChange={e => {
                  setLedgerSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1 bg-[#05080f] border border-[#1e2d45] rounded text-white text-xs w-60 focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 bg-[#05080f] border border-[#1e2d45] rounded text-slate-300 text-xs focus:outline-hidden focus:border-cyan-400"
            >
              <option value="All">All DELTA Event Types</option>
              <option value="SCORE_SUBMIT">SCORE_SUBMIT</option>
              <option value="SCORE_REVISE">SCORE_REVISE</option>
              <option value="FLAG">FLAG</option>
              <option value="SNAPSHOT_SIGNOFF">SNAPSHOT_SIGNOFF</option>
              <option value="SHUFFLE">SHUFFLE</option>
              <option value="MATCH_APPROVE">MATCH_APPROVE</option>
              <option value="MATCH_OVERRIDE">MATCH_OVERRIDE</option>
              <option value="SCENARIO_PROMOTE">SCENARIO_PROMOTE</option>
              <option value="PSDM_EXPORT">PSDM_EXPORT</option>
              <option value="FILE_ROUTED">FILE_ROUTED</option>
              <option value="ROLLBACK">ROLLBACK</option>
            </select>

            <button
              onClick={exportLedgerCsv}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-300 bg-[#05080f] border border-[#1e2d45] rounded hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px] uppercase bg-[#05080f]">
                <th className="py-2.5 px-3">Entry ID</th>
                <th className="py-2.5 px-3">Timestamp ({state.timeDisplay.toUpperCase()})</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Action Summary</th>
                <th className="py-2.5 px-3">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
              {paginatedEntries.map(e => (
                <tr key={e.id} className="hover:bg-[#0f172a] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-cyan-400 whitespace-nowrap">{e.id}</td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {state.timeDisplay === 'zulu'
                      ? `${e.timestamp.slice(0, 19).replace('T', ' ')}Z`
                      : new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-white font-medium block">{e.actor}</span>
                    <span className="text-[10px] text-cyan-400/80">{e.role}</span>
                  </td>
                  <td className="py-2.5 px-3 text-purple-300 font-bold whitespace-nowrap">{e.targetId}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2d45] text-slate-200">
                      {e.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 max-w-sm truncate font-sans">{e.summary}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[10px] truncate max-w-[120px]" title={e.hash}>
                    {e.hash.slice(0, 16)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-[#1e2d45] font-mono">
          <span>Page {page} of {totalPages} ({filteredLedger.length} total events)</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 bg-[#05080f] border border-[#1e2d45] rounded text-slate-300 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 bg-[#05080f] border border-[#1e2d45] rounded text-slate-300 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ORBIT-NIPR File Canonicalizer (00SRT Gate) */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">ORBIT-NIPR File Canonicalizer (00SRT Gate)</h3>
              <span className="font-mono text-xs text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                SHAREPOINT TREE ROUTING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic PASS / WARN / FAIL classification and standardized renaming: <code className="text-cyan-300">[NodeCode]_YYYYMMDD_Slug.ext</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCommitRouting}
              disabled={state.currentRole !== 'BMO Lead'}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs rounded transition-colors shadow-md shadow-cyan-500/20"
            >
              Commit Routing to SharePoint
            </button>
          </div>
        </div>

        {/* File Dropzone & Intake Simulation */}
        <div className="p-4 bg-[#05080f] border-2 border-dashed border-[#1e2d45] rounded-md text-center space-y-2">
          <Upload className="w-6 h-6 text-slate-500 mx-auto" />
          <div className="text-xs text-slate-300">
            Drag and drop unformatted personnel files or review mock intake batch
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Approved types: SOI, ROPs, SURF, ARMS, PSDM · Deterministic field validation (No confidence scores)
          </span>
        </div>

        {/* Canonicalized Files Table */}
        <div className="overflow-x-auto text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px] uppercase bg-[#05080f]">
                <th className="py-2.5 px-3">Original Filename</th>
                <th className="py-2.5 px-3">Detected Type</th>
                <th className="py-2.5 px-3">Proposed Canonical Name</th>
                <th className="py-2.5 px-3">Target Node</th>
                <th className="py-2.5 px-3">Gate Result</th>
                <th className="py-2.5 px-3">Deterministic Rationale</th>
                <th className="py-2.5 px-3 text-right">Commit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
              {state.canonicalFiles.map(f => (
                <tr key={f.id} className="hover:bg-[#0f172a] transition-colors">
                  <td className="py-2.5 px-3 text-white font-medium">{f.originalName}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{f.detectedDocType}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-bold">{f.canonicalName}</td>
                  <td className="py-2.5 px-3">
                    <select
                      value={f.targetNode}
                      onChange={e => handleRouteFile(f.id, e.target.value)}
                      className="p-1 bg-[#05080f] border border-[#1e2d45] rounded text-white text-[11px]"
                    >
                      {sharePointNodes.map(n => (
                        <option key={n.code} value={n.code}>{n.code}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.checkResult === 'PASS' ? 'bg-emerald-950 text-emerald-300' :
                      f.checkResult === 'WARN' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {f.checkResult}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans max-w-xs truncate text-[11px]">{f.reason}</td>
                  <td className="py-2.5 px-3 text-right">
                    {f.committed ? (
                      <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Committed
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">Pending Commit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
