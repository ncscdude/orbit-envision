import React, { useState } from 'react';
import { useOrbit } from '../state/context';
import { EXPERIENCES } from '../registry/experiences';
import { identityProvider, devIdentityProvider } from '../auth/identity';
import { ShieldCheck, ShieldAlert, Clock, Layers, BookOpen, ChevronDown, UserCheck } from 'lucide-react';

interface HeaderProps {
  onOpenCatalog: () => void;
  onOpenDemoGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCatalog, onOpenDemoGuide }) => {
  const { state, dispatch } = useOrbit();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Switching users is a dev-adapter feature only; under Envision the role is fixed by identity.
  const canSwitchUser = identityProvider.kind === 'dev';
  const devUsers = canSwitchUser ? devIdentityProvider.listUsers().filter(u => u.role !== null) : [];

  // Filter live experiences that are permitted for the current role
  const liveExperiences = EXPERIENCES.filter(
    exp => exp.status === 'Live' && exp.roles.includes(state.currentRole)
  );

  const handleUserChange = (userId: string) => {
    devIdentityProvider.selectUser(userId);
    dispatch({ type: 'SET_IDENTITY', identity: devIdentityProvider.getIdentity() });
    setRoleDropdownOpen(false);
  };

  return (
    <header className="bg-[#0a1020] border-b border-[#1e2d45] sticky top-0 z-40 shadow-lg no-print">
      {/* Top Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45]/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center font-bold text-black font-mono text-base shadow-md shadow-cyan-500/20">
              ⬡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-wider text-white text-sm">
                  PROJECT ORBIT
                </span>
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                  v4.2-HELIOS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                USSF ETMO / BMO · Operational Repository for Boards & Talent
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* DELTA Chain Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${
              state.chainTampered
                ? 'bg-red-950/60 text-red-300 border-red-700 animate-pulse'
                : 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
            }`}
            title={state.chainTampered ? 'DELTA tamper detected!' : 'DELTA Cryptographic Hash Chain Verified (SHA-256)'}
          >
            {state.chainTampered ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>TAMPER DETECTED</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>CHAIN VERIFIED</span>
              </>
            )}
          </div>

          {/* Time Toggle (Zulu vs Local) */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_TIME_DISPLAY' })}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-slate-300 bg-[#05080f] border border-[#1e2d45] hover:text-white hover:border-slate-500"
            title="Toggle Zulu (UTC) and Local system timestamps"
          >
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="uppercase">{state.timeDisplay}</span>
          </button>

          {/* Experience Catalog Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenCatalog}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-300 bg-[#05080f] border border-[#1e2d45] hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Catalog</span>
          </button>

          {/* Demo Guide Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenDemoGuide}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-cyan-300 bg-cyan-950/50 border border-cyan-800 hover:bg-cyan-900/60 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Demo Guide</span>
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => canSwitchUser && setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1 bg-[#1e2d45]/70 hover:bg-[#1e2d45] border border-cyan-500/30 rounded text-xs font-medium text-slate-200 transition-colors"
              aria-expanded={roleDropdownOpen}
              aria-label="Select user role"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <div className="text-left">
                <span className="block text-[10px] text-cyan-400/80 font-mono leading-none">PERSPECTIVE</span>
                <span className="block font-semibold text-white leading-tight">{state.currentRole}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-[#0a1020] border border-[#1e2d45] rounded-md shadow-2xl z-50 py-1 text-xs">
                <div className="px-3 py-1.5 border-b border-[#1e2d45] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Select Perspective / Role (dev users)
                </div>
                {devUsers.map(user => (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => handleUserChange(user.userId)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#1e2d45] transition-colors ${
                      state.userId === user.userId ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{user.role}</span>
                    {state.userId === user.userId && (
                      <span className="text-[10px] font-mono text-cyan-400">ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Tab Navigation (Generated from EXPERIENCES, grouped and role-filtered) */}
      <nav className="px-4 flex items-center gap-1 overflow-x-auto text-xs py-1 bg-[#05080f]/90 scrollbar-none">
        {liveExperiences.map(exp => {
          const isActive = state.activeViewId === exp.viewId;
          return (
            <button
              key={exp.id}
              type="button"
              onClick={() => dispatch({ type: 'SET_VIEW', viewId: exp.viewId })}
              className={`px-3 py-1.5 rounded font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80 shadow-xs shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0a1020] border-transparent'
              }`}
            >
              <span>{exp.title}</span>
              {exp.ideaId && (
                <span className="text-[9px] font-mono text-cyan-500/70">
                  {exp.ideaId}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
