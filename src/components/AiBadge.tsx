import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiBadgeProps {
  label?: string;
  showAdvisoryText?: boolean;
  className?: string;
}

export const AiBadge: React.FC<AiBadgeProps> = ({
  label = 'AI',
  showAdvisoryText = true,
  className = ''
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/40 ${className}`}
      title="Algorithmic output: Advisory only. Requires mandatory human-in-the-loop verification."
    >
      <Sparkles className="w-3 h-3 text-[#a855f7]" />
      <span>{label}</span>
      {showAdvisoryText && (
        <span className="text-[10px] text-purple-300/80 border-l border-purple-500/30 pl-1.5 font-sans font-normal">
          Advisory only
        </span>
      )}
    </div>
  );
};
