import React from 'react';
import { X, BookOpen, ArrowRight } from 'lucide-react';

interface DemoGuideDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

export const DemoGuideDrawer: React.FC<DemoGuideDrawerProps> = ({ open, onClose, onNavigate }) => {
  if (!open) return null;

  const steps = [
    {
      num: '01',
      title: 'Command Center & 8-Phase Bar',
      viewId: 'VIEW-CommandCenter',
      instruction: 'Observe the 4 executive cards, click Phase 3 (Roster Intake) on the 8-phase bar to filter KPIs, and note how the health dot updates.'
    },
    {
      num: '02',
      title: 'Drill from Late KPI to Candidates',
      viewId: 'VIEW-CommandCenter',
      instruction: 'In the KPI catalog table, click "Drill to candidates" beside Packet Completeness (K-03) or click Active Boards to jump straight into the candidate review queue.'
    },
    {
      num: '03',
      title: 'Anti-Anchored Scoring Dock',
      viewId: 'VIEW-PanelReview',
      instruction: 'Open candidate Maj Tyler Vance (PDO-001). Notice the model score and panel average remain strictly hidden until you select a score and click "Submit & Next Candidate".'
    },
    {
      num: '04',
      title: 'Human-in-the-Loop AI Scribe Sign-Off',
      viewId: 'VIEW-PanelReview',
      instruction: 'Inspect the AI LLM Scribe drawer on the right. Review CHAT-SNAPSHOT-v01 and click "Approve & Sign Off CHAT-SNAPSHOT" to cryptographically sign the evaluation in the DELTA ledger.'
    },
    {
      num: '05',
      title: 'HELIOS Pipeline Funnel & Source Freshness',
      viewId: 'VIEW-HeliosCommand',
      instruction: 'Under Sub-tab A (Pipeline), locate the failed ingest on Candidate PDO-015 and click "Retry". Under Sub-tab B, observe the amber MilPDS and red SURF freshness bars.'
    },
    {
      num: '06',
      title: 'Match Lab: Sliders, Gale-Shapley & PSDM Export',
      viewId: 'VIEW-MatchLab',
      instruction: 'Switch between Greedy and Gale-Shapley Stable algorithms. Adjust the SOI Overlap slider to observe live diffs. Inspect Near-Fit candidates, then click "Generate Draft PSDM".'
    },
    {
      num: '07',
      title: 'Scoring Audit & Parity Breach Rollback',
      viewId: 'VIEW-ScoringAudit',
      instruction: 'Review heartburn cases where evaluator scores diverge by >1.5 points. As BMO Lead, inspect the 4-step Parity Breach Rollback Playbook to freeze and revert affected PDOs.'
    },
    {
      num: '08',
      title: 'Cross Analytics & Endorser Insights',
      viewId: 'VIEW-CrossAnalytics',
      instruction: 'Compare 2-4 candidates on the multi-attribute radar chart. Check the Endorsee Scale donut for Col Valerie Vance (who places 52% in Top 3) vs baseline.'
    },
    {
      num: '09',
      title: 'Career Planner, Loss Calculator & Slices',
      viewId: 'VIEW-CareerPlanner',
      instruction: 'Switch role to CFM / Career Planner. Explore the 3x3 N-Box, then switch to "Loss Calculator & Flight Risk" to analyze replacement costs ($800k-$1.4M), peer flight risk drivers, what-if retention mitigations, and multi-dimensional slices/layers.'
    },
    {
      num: '10',
      title: 'DELTA Ledger & File Canonicalizer',
      viewId: 'VIEW-DeltaLedger',
      instruction: 'Verify SHA-256 chain integrity. Test the BMO Lead "Simulate Tamper" button to watch the chain turn red. In the dropzone, load sample messy files and commit routing to SharePoint.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg bg-[#0a1020] border-l border-[#1e2d45] h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-4 border-b border-[#1e2d45] flex items-center justify-between bg-[#05080f]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-white text-sm">Interactive Demo Guide</h3>
              <p className="text-xs text-slate-400">Step-by-step feature demonstration script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1e2d45]"
            aria-label="Close demo guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {steps.map(s => (
            <div
              key={s.num}
              className="p-3 bg-[#05080f] border border-[#1e2d45] rounded hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold text-xs bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                    Step {s.num}
                  </span>
                  <span className="font-semibold text-white text-xs">{s.title}</span>
                </div>
                <button
                  onClick={() => {
                    onNavigate(s.viewId);
                    onClose();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-medium"
                >
                  Open View <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{s.instruction}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
