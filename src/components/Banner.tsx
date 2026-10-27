import React from 'react';

export const Banner: React.FC = () => {
  return (
    <div className="bg-[#0a1020] border-b border-[#1e2d45] px-4 py-1 flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-400 no-print">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="text-cyan-300 font-semibold">CAPABILITY CONCEPT BRIEF</span>
        <span className="text-slate-600">·</span>
        <span>USSF S1/ETM/TMEB</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-300">ORBIT / HELIOS</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-amber-400/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
          HUMAN-IN-THE-LOOP ENFORCED
        </span>
        <span className="text-slate-500 hidden sm:inline">CONTROLLED PROTOTYPE</span>
      </div>
    </div>
  );
};
