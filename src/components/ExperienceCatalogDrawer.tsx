import React from 'react';
import { X, Layers, HelpCircle, CheckCircle2, Clock } from 'lucide-react';
import { EXPERIENCES, ASSUMPTIONS_AND_QUESTIONS } from '../registry/experiences';
import { useOrbit } from '../state/context';
import { canOpen } from '../auth/permissions';

interface ExperienceCatalogDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

export const ExperienceCatalogDrawer: React.FC<ExperienceCatalogDrawerProps> = ({
  open,
  onClose,
  onNavigate
}) => {
  const { state } = useOrbit();
  if (!open) return null;

  // Only the tools this role may open (permission table)
  const live = EXPERIENCES.filter(e => e.status === 'Live' && canOpen(state.currentRole, e.viewId));
  const roadmap = EXPERIENCES.filter(e => e.status === 'Roadmap');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-xl bg-[#0a1020] border-l border-[#1e2d45] h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2d45] flex items-center justify-between bg-[#05080f]">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-white text-sm">Experience Catalog & Architecture</h3>
              <p className="text-xs text-slate-400">Project ORBIT dynamic view registry and backlog status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1e2d45]"
            aria-label="Close catalog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* Live Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Live Experiences ({live.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to navigate</span>
            </div>
            <div className="space-y-2">
              {live.map(exp => (
                <div
                  key={exp.id}
                  onClick={() => {
                    onNavigate(exp.viewId);
                    onClose();
                  }}
                  className="p-3 bg-[#05080f] border border-[#1e2d45] rounded hover:border-cyan-500/60 hover:bg-[#0f172a] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-xs">{exp.title}</span>
                    <span className="font-mono text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                      {exp.viewId}
                    </span>
                  </div>
                  <p className="text-slate-300 italic mb-1.5">"{exp.question}"</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Group: <strong className="text-slate-200">{exp.group}</strong></span>
                    <span>Roles: {exp.roles.length === 8 ? 'All Roles' : exp.roles.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Roadmap Backlog ({roadmap.length})
              </span>
              <span className="text-[11px] text-slate-400">Proposed / Pending approval</span>
            </div>
            <div className="space-y-2">
              {roadmap.map(exp => (
                <div
                  key={exp.id}
                  className="p-3 bg-[#05080f]/60 border border-[#1e2d45]/70 rounded opacity-80"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-300 text-xs">{exp.title}</span>
                    <span className="font-mono text-[10px] bg-amber-950/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/60">
                      {exp.ideaId} · Roadmap
                    </span>
                  </div>
                  <p className="text-slate-400 italic mb-1.5">"{exp.question}"</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Group: {exp.group}</span>
                    <span>Target: {exp.roles.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions & Open Questions */}
          <div className="pt-2 border-t border-[#1e2d45]">
            <div className="flex items-center gap-1.5 mb-2 text-purple-300 font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              Assumptions and Open Questions
            </div>
            <div className="space-y-2.5">
              {ASSUMPTIONS_AND_QUESTIONS.map(item => (
                <div key={item.id} className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded">
                  <div className="font-semibold text-slate-200 text-xs mb-0.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-900/50 text-purple-300 text-[10px] flex items-center justify-center font-mono">
                      {item.id}
                    </span>
                    {item.topic}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed pl-5">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
