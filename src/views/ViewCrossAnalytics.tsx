import React, { useState, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { computePanelistCalibration, computeZScoreNormalizedRankings, PanelistStats } from '../lib/stats';
import { PANELIST_PROFILES } from '../data/seed';
import { RequireRole } from '../auth/RequireRole';
import { fitVisible, hiddenNote } from '../lib/panel';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ViewCrossAnalyticsContent: React.FC = () => {
  const { state } = useOrbit();
  const [selectedCandidatesForCompare, setSelectedCandidatesForCompare] = useState<string[]>([
    'PDO-001',
    'PDO-002',
    'PDO-004'
  ]);
  const [selectedEndorserId, setSelectedEndorserId] = useState<string>('END-02'); // Col Valerie Vance (high placer)
  const [calibrationPreviewOpen, setCalibrationPreviewOpen] = useState(false);

  // Panelist names mapping
  const panelistNames = useMemo(() => {
    const map: Record<string, string> = {};
    PANELIST_PROFILES.forEach(p => (map[p.id] = p.name));
    return map;
  }, []);

  // Compute calibration stats
  const allSubmittedScores = useMemo(() => {
    const list: { panelistId: string; value: number; candidateId: string }[] = [];
    state.candidates.forEach(c => {
      c.scores.forEach(s => {
        list.push({ panelistId: s.panelistId, value: s.value, candidateId: c.id });
      });
    });
    return list;
  }, [state.candidates]);

  const calibrationStats: PanelistStats[] = useMemo(() => {
    return computePanelistCalibration(allSubmittedScores, panelistNames);
  }, [allSubmittedScores, panelistNames]);

  // Z-score rankings preview
  const normalizedRankings = useMemo(() => {
    const statsMap: Record<string, { mean: number; stdDev: number }> = {};
    calibrationStats.forEach(st => {
      statsMap[st.panelistId] = { mean: st.mean, stdDev: st.stdDev };
    });
    return computeZScoreNormalizedRankings(state.candidates, statsMap);
  }, [state.candidates, calibrationStats]);

  // Radar data for compared candidates (2 to 4)
  const comparedCandidates = state.candidates.filter(c => selectedCandidatesForCompare.includes(c.id));
  const radarData = [
    {
      attribute: 'Skills (Cosine)',
      ...Object.fromEntries(comparedCandidates.map(c => [c.name.split(',')[0], Math.round(c.skills[0]?.proficiency || 80)]))
    },
    {
      attribute: 'Experience (Tours)',
      ...Object.fromEntries(comparedCandidates.map(c => [c.name.split(',')[0], Math.min(100, (c.deployments + c.jointTours) * 25)]))
    },
    {
      attribute: 'Performance (Top %)',
      ...Object.fromEntries(comparedCandidates.map(c => [c.name.split(',')[0], 100 - (c.performance[0]?.pctTop || 15) * 3]))
    },
    {
      attribute: 'Education (PME)',
      ...Object.fromEntries(comparedCandidates.map(c => [c.name.split(',')[0], c.pmeStatus === 'SDE Complete' ? 95 : c.pmeStatus === 'ILE Eligible' ? 85 : 70]))
    },
    {
      attribute: 'Predictive Fit',
      // The Board President votes, so their own unscored records show 0 here (A-5)
      ...Object.fromEntries(comparedCandidates.map(c => [c.name.split(',')[0], fitVisible(c, state) ? c.llmFitScore : 0]))
    }
  ];

  // Scatter plot data (Panel Avg vs LLM Fit)
  const scatterData = state.candidates.filter(c => fitVisible(c, state)).map(c => {
    const scores = c.scores.map(s => s.value);
    const avg = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 8.0;
    const isHeartburn = Math.abs((c.myScore || avg) - avg) >= 1.5;

    let quadrant: string;
    if (avg >= 8.0 && c.llmFitScore >= 80) quadrant = 'Consensus Strong';
    else if (avg < 8.0 && c.llmFitScore >= 80) quadrant = 'Hidden Talent';
    else if (avg >= 8.0 && c.llmFitScore < 80) quadrant = 'Model Skeptic';
    else quadrant = 'Consensus Weak';

    return {
      id: c.id,
      name: c.name,
      x: avg,
      y: c.llmFitScore,
      quadrant,
      isHeartburn,
      candidate: c
    };
  });

  // Selected Endorser Insights
  const selectedEndorser = state.endorsers.find(e => e.id === selectedEndorserId) || state.endorsers[0];
  const endorserDonutData = [
    { name: 'Top 3 Placements', value: selectedEndorser.top3SharePct, color: '#00d4ff' },
    { name: 'Other Unit Officers', value: 100 - selectedEndorser.top3SharePct, color: '#1e2d45' }
  ];

  const handleToggleCompareCandidate = (id: string) => {
    if (selectedCandidatesForCompare.includes(id)) {
      if (selectedCandidatesForCompare.length > 2) {
        setSelectedCandidatesForCompare(selectedCandidatesForCompare.filter(x => x !== id));
      }
    } else {
      if (selectedCandidatesForCompare.length < 4) {
        setSelectedCandidatesForCompare([...selectedCandidatesForCompare, id]);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Cross Analytics & Calibration Intelligence</span>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
            ADVANCED ANALYTICS
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Multi-candidate comparator radar, quadrant scatter, talent constellation, panelist calibration, and endorser insights.
        </p>
      </div>

      {/* SECTION 1: CANDIDATE COMPARATOR (Radar + Synced Metric Table) */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Multi-Candidate Comparator (2 to 4 Candidates)</h3>
            <span className="text-xs text-slate-400 font-mono">
              Selected: {comparedCandidates.length} / 4 candidates
            </span>
          </div>
          <p className="text-xs text-cyan-400/90 italic font-mono mt-0.5">
            Takeaway: Maj Tyler Vance leads operational orbital fit, while Maj Brandon Thorne anchors deep cyber specialization.
          </p>
        </div>

        {/* Candidate Selector Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          {state.candidates.slice(0, 8).map(c => {
            const isSelected = selectedCandidatesForCompare.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleToggleCompareCandidate(c.id)}
                className={`px-2.5 py-1 rounded font-mono text-xs transition-colors border ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                    : 'bg-[#05080f] text-slate-400 border-[#1e2d45] hover:text-white'
                }`}
              >
                {c.name.split(',')[0]} ({c.id})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Radar Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e2d45" />
                <PolarAngleAxis dataKey="attribute" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis stroke="#475569" fontSize={9} domain={[0, 100]} />
                {comparedCandidates.map((c, i) => {
                  const colors = ['#00d4ff', '#00ff88', '#a855f7', '#ffb800'];
                  return (
                    <Radar
                      key={c.id}
                      name={c.name.split(',')[0]}
                      dataKey={c.name.split(',')[0]}
                      stroke={colors[i]}
                      fill={colors[i]}
                      fillOpacity={0.2}
                    />
                  );
                })}
                <Tooltip contentStyle={{ backgroundColor: '#0a1020', borderColor: '#1e2d45', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Synchronized Metric Table */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-2">Metric</th>
                  {comparedCandidates.map(c => (
                    <th key={c.id} className="py-2 px-2 text-cyan-400">{c.name.split(',')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
                <tr>
                  <td className="py-1.5 px-2 font-semibold">Grade / DAFSC</td>
                  {comparedCandidates.map(c => (
                    <td key={c.id} className="py-1.5 px-2 text-white">{c.grade} · {c.dafsc}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-semibold">LLM Fit Score</td>
                  {comparedCandidates.map(c => (
                    <td key={c.id} className="py-1.5 px-2 font-bold text-purple-300">
                      {fitVisible(c, state) ? `${c.llmFitScore}%` : hiddenNote('llmFit', c, state)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-semibold">TIG / TAFCSD</td>
                  {comparedCandidates.map(c => (
                    <td key={c.id} className="py-1.5 px-2">{c.tig} / {c.tafcsd}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-semibold">Top Stratification</td>
                  {comparedCandidates.map(c => (
                    <td key={c.id} className="py-1.5 px-2 text-emerald-400 font-bold">Top {c.performance[0]?.pctTop}%</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-2 font-semibold">PME Status</td>
                  {comparedCandidates.map(c => (
                    <td key={c.id} className="py-1.5 px-2">{c.pmeStatus}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: SCATTER PLOT (Panel Avg vs LLM Fit Quadrants) */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
        <div>
          <h3 className="font-bold text-white text-sm">Quadrant Scatter: Panel Consensus vs Algorithmic Fit</h3>
          <p className="text-xs text-cyan-400/90 italic font-mono mt-0.5">
            Takeaway: Highlights 3 Hidden Talent candidates (low panel avg, high LLM fit) requiring evaluator re-examination.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="x" name="Panel Avg" domain={[6, 10]} stroke="#64748b" fontSize={11} label={{ value: 'Panel Average Score', position: 'bottom', fill: '#64748b', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="LLM Fit" domain={[60, 100]} stroke="#64748b" fontSize={11} label={{ value: 'LLM Fit Score (%)', angle: -90, position: 'left', fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload || !payload[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#05080f] border border-[#1e2d45] p-2.5 rounded text-xs shadow-xl space-y-1">
                      <div className="font-bold text-white">{data.name} ({data.id})</div>
                      <div className="text-cyan-300 font-mono">Panel Avg: {data.x} · LLM Fit: {data.y}%</div>
                      <div className="text-amber-400 font-mono text-[10px]">Quadrant: {data.quadrant}</div>
                      {data.isHeartburn && <div className="text-red-400 text-[10px] font-bold">⚠️ Heartburn Outlier</div>}
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="#00d4ff" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quadrant Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 bg-[#05080f] border border-emerald-800 rounded text-emerald-300">
            <strong>Consensus Strong:</strong> High Panel & High Fit
          </div>
          <div className="p-2 bg-[#05080f] border border-purple-800 rounded text-purple-300">
            <strong>Hidden Talent:</strong> Low Panel & High Fit
          </div>
          <div className="p-2 bg-[#05080f] border border-blue-800 rounded text-blue-300">
            <strong>Model Skeptic:</strong> High Panel & Low Fit
          </div>
          <div className="p-2 bg-[#05080f] border border-[#1e2d45] rounded text-slate-400">
            <strong>Consensus Weak:</strong> Low Panel & Low Fit
          </div>
        </div>
      </div>

      {/* SECTION 3: ENDORSER & STRATIFICATION INSIGHTS (IDEA-004) */}
      <div className="bg-[#0a1020] border border-cyan-500/40 rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Endorser & Stratification Insights</h3>
              <span className="font-mono text-xs text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                IDEA-004
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assesses endorser leniency and Top-3 placement tendencies to contextualize subjective narrative recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Select Endorser:</span>
            <select
              value={selectedEndorserId}
              onChange={e => setSelectedEndorserId(e.target.value)}
              className="p-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-white font-medium"
            >
              {state.endorsers.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.unit}) — {e.top3SharePct}% Top 3
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-cyan-400/90 italic font-mono">
          Takeaway: {selectedEndorser.name} places {selectedEndorser.top3SharePct}% of unit officers in the Top 3 (Baseline reference: 18%).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Endorsee Scale Donut */}
          <div className="p-4 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Endorsee Scale (Top 3 vs Other)</span>
              <span className="text-[10px] font-mono text-cyan-400">Reference: 18% Top 3</span>
            </div>

            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={endorserDonutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value">
                    {endorserDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0a1020', borderColor: '#1e2d45', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xl font-bold font-mono text-white">{selectedEndorser.top3SharePct}%</span>
                <span className="text-[10px] text-cyan-400 uppercase font-mono">Top 3</span>
              </div>
            </div>

            <div className="flex justify-between text-[11px] font-mono text-slate-300">
              <span className="text-cyan-400">● Top 3 Placements: {selectedEndorser.top3SharePct}%</span>
              <span className="text-slate-400">● Other Officers: {100 - selectedEndorser.top3SharePct}%</span>
            </div>
          </div>

          {/* Unit Stratification Stacked Overview */}
          <div className="p-4 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Unit Stratification Overview</span>
              <span className="text-[10px] font-mono text-slate-400">Unit: {selectedEndorser.unit}</span>
            </div>

            <div className="space-y-3 my-auto">
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-emerald-400">Definitely Promote (DP): {selectedEndorser.stratMix.dpPct}%</span>
                  <span className="text-cyan-300">Promote (P): {selectedEndorser.stratMix.pPct}%</span>
                  <span className="text-slate-400">Non-Strat: {selectedEndorser.stratMix.nonStratPct}%</span>
                </div>
                <div className="w-full h-4 bg-[#0a1020] rounded flex overflow-hidden border border-[#1e2d45]">
                  <div style={{ width: `${selectedEndorser.stratMix.dpPct}%` }} className="bg-emerald-500 h-full"></div>
                  <div style={{ width: `${selectedEndorser.stratMix.pPct}%` }} className="bg-cyan-500 h-full"></div>
                  <div style={{ width: `${selectedEndorser.stratMix.nonStratPct}%` }} className="bg-slate-600 h-full"></div>
                </div>
              </div>

              <div className="p-2.5 bg-[#0a1020] border border-[#1e2d45] rounded text-[11px] text-slate-300 space-y-1">
                <span className="font-semibold text-white block">Operational Label:</span>
                <p className="text-slate-400">
                  "Context, not a score." Endorser top-3 placements serve purely as interpretive context for panel evaluators and never modify official mathematical OoM rank.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: PANELIST CALIBRATION & Z-SCORE NORMALIZATION */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
          <div>
            <h3 className="font-bold text-white text-sm">Panelist Calibration & Z-Score Normalization</h3>
            <p className="text-xs text-slate-400">
              Evaluator scoring spread, standard deviation, and identification of harsh vs lenient grading tendencies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCalibrationPreviewOpen(!calibrationPreviewOpen)}
            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-semibold rounded text-xs transition-colors"
          >
            {calibrationPreviewOpen ? 'Hide Z-Score Preview' : 'Preview Z-Score OoM Normalization'}
          </button>
        </div>

        <p className="text-xs text-cyan-400/90 italic font-mono">
          Takeaway: Lt Col Elena Rostova scores 0.5 pts below panel mean (Harsh), while Lt Col David Sterling averages 0.6 pts higher (Lenient).
        </p>

        {/* Panelist Calibration Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {calibrationStats.map(ps => (
            <div key={ps.panelistId} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-1 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-white">{ps.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{ps.panelistId}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  ps.tendency === 'Harsh' ? 'bg-red-950 text-red-300 border border-red-800' :
                  ps.tendency === 'Lenient' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  'bg-emerald-950 text-emerald-300'
                }`}>
                  {ps.tendency}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 font-mono text-[11px] text-slate-300">
                <div>Mean: <strong className="text-white">{ps.mean}</strong></div>
                <div>StdDev: <strong className="text-white">{ps.stdDev}</strong></div>
                <div>Count: <strong className="text-cyan-300">{ps.count}</strong></div>
              </div>
            </div>
          ))}
        </div>

        {/* Z-Score Preview Table */}
        {calibrationPreviewOpen && (
          <div className="p-4 bg-[#05080f] border border-cyan-500/50 rounded-md space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white font-mono uppercase">
                Simulated Normalized Order of Merit (Z-Score Preview)
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                Preview only: Never applied without BMO Lead approval
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#1e2d45] text-slate-400 text-[10px]">
                    <th className="py-2 px-2">Normalized Rank</th>
                    <th className="py-2 px-2">Candidate ID</th>
                    <th className="py-2 px-2">Raw Average</th>
                    <th className="py-2 px-2">Normalized Z-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d45]/60 text-slate-300">
                  {normalizedRankings.slice(0, 5).map((nr, idx) => (
                    <tr key={nr.candidateId}>
                      <td className="py-1.5 px-2 font-bold text-cyan-400">#{idx + 1}</td>
                      <td className="py-1.5 px-2 text-white">{nr.candidateId}</td>
                      <td className="py-1.5 px-2">{nr.rawAvg} pts</td>
                      <td className="py-1.5 px-2 font-bold text-emerald-400">+{nr.normalizedZScore}σ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ViewCrossAnalytics: React.FC = () => (
  <RequireRole viewId="VIEW-CrossAnalytics">
    <ViewCrossAnalyticsContent />
  </RequireRole>
);
