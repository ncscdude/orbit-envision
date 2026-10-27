import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { METRIC_REGISTRY } from '../registry/metrics';

interface MetricPopoverProps {
  metricId: string;
  className?: string;
}

export const MetricPopover: React.FC<MetricPopoverProps> = ({ metricId, className = '' }) => {
  const [open, setOpen] = useState(false);
  const def = METRIC_REGISTRY[metricId];

  if (!def) return null;

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-[#1e2d45] transition-colors"
        title="View metric derivation, formula, target, and data owner"
        aria-label={`Metric information for ${def.name}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 top-full mt-1.5 w-72 bg-[#0a1020] border border-[#1e2d45] rounded-md shadow-2xl p-3 text-xs text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-[#1e2d45] pb-2 mb-2">
            <div>
              <span className="font-mono text-[10px] text-cyan-400 uppercase font-semibold">{def.id}</span>
              <h4 className="font-semibold text-white leading-tight">{def.name}</h4>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white p-0.5"
              aria-label="Close metric info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 font-sans">
            <div>
              <span className="text-slate-400 font-medium">Formula: </span>
              <span className="font-mono text-[11px] text-slate-300">{def.formula}</span>
            </div>
            {def.target && (
              <div>
                <span className="text-slate-400 font-medium">Target: </span>
                <span className="text-emerald-400 font-medium">{def.target}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 font-medium">Accountable Owner: </span>
              <span className="text-slate-200">{def.owner}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Data Source: </span>
              <span className="text-slate-300 italic">{def.sourceRef}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
