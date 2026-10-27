import React from 'react';
import { useOrbit } from '../state/context';
import { MetricPopover } from './MetricPopover';

interface MetricCardProps {
  id: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ id, label, className = '', onClick }) => {
  const { useMetric } = useOrbit();
  const val = useMetric(id);

  const getStatusBorder = () => {
    switch (val.status) {
      case 'green':
        return 'border-l-4 border-l-[#00ff88]';
      case 'amber':
        return 'border-l-4 border-l-[#ffb800]';
      case 'red':
        return 'border-l-4 border-l-[#ff4757]';
      default:
        return 'border-l-4 border-l-cyan-500';
    }
  };

  const getTextColor = () => {
    switch (val.status) {
      case 'green':
        return 'text-[#00ff88]';
      case 'amber':
        return 'text-[#ffb800]';
      case 'red':
        return 'text-[#ff4757]';
      default:
        return 'text-white';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#0a1020] border border-[#1e2d45] rounded-md p-3 transition-all ${getStatusBorder()} ${
        onClick ? 'cursor-pointer hover:border-cyan-500/50 hover:bg-[#0f172a]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-medium text-slate-400 truncate uppercase tracking-wider">
          {label || id}
        </span>
        <MetricPopover metricId={id} />
      </div>
      <div className={`text-xl font-bold font-mono tracking-tight ${getTextColor()}`}>
        {val.formatted}
      </div>
      {val.tooltip && (
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1" title={val.tooltip}>
          {val.tooltip}
        </p>
      )}
    </div>
  );
};
