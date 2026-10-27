import React, { useState, useEffect, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { Candidate, Billet } from '../types';
import { AiBadge } from '../components/AiBadge';
import { cosineSimilarity } from '../lib/stats';
import {
  FileText,
  Award,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Send,
  ExternalLink,
  BookOpen,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';

export const ViewPanelReview: React.FC = () => {
  const { state, dispatch, useMetric } = useOrbit();
  const [activeLens, setActiveLens] = useState<number>(1);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReasonText, setFlagReasonText] = useState('');
  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false);
  const [reviseConfirmOpen, setReviseConfirmOpen] = useState(false);
  const [revisionReasonText, setRevisionReasonText] = useState('');

  // Selected candidate lookup
  const candidateIndex = state.candidates.findIndex(c => c.id === state.selectedCandidateId);
  const candidate: Candidate = state.candidates[candidateIndex >= 0 ? candidateIndex : 0];

  // Sync selected score when candidate changes
  useEffect(() => {
    if (candidate) {
      setSelectedScore(candidate.myScore);
    }
  }, [candidate?.id, candidate?.myScore]);

  // Hotkey navigation: Alt+1 to Alt+8 for lenses, 1-5 for scoring
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Lens hotkeys
      if (e.altKey && !isNaN(Number(e.key))) {
        const num = Number(e.key);
        if (num >= 1 && num <= 8) {
          e.preventDefault();
          setActiveLens(num);
        }
      }

      // Scoring hotkeys (only when not typing in an input/textarea)
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!e.altKey && !e.ctrlKey && !e.metaKey) {
        let baseVal = 0;
        if (e.key === '1') baseVal = 6.0;
        else if (e.key === '2') baseVal = 7.0;
        else if (e.key === '3') baseVal = 8.0;
        else if (e.key === '4') baseVal = 9.0;
        else if (e.key === '5') baseVal = 10.0;

        if (baseVal > 0) {
          const finalScore = e.shiftKey ? Math.min(10.0, baseVal + 0.5) : baseVal;
          setSelectedScore(finalScore);
        }

        // Arrow keys nudge
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          setSelectedScore(prev => (prev === null ? 8.0 : Math.min(10.0, prev + 0.5)));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          setSelectedScore(prev => (prev === null ? 8.0 : Math.max(6.0, prev - 0.5)));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Nearest 5 candidates by cosine similarity of skillVector
  const similarCandidates = useMemo(() => {
    if (!candidate) return [];
    return state.candidates
      .filter(c => c.id !== candidate.id)
      .map(c => ({
        candidate: c,
        similarity: cosineSimilarity(candidate.skillVector, c.skillVector)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }, [candidate, state.candidates]);

  // Top 3 possible billet fits
  const possibleFits = useMemo(() => {
    if (!candidate) return [];
    return state.billets
      .map(b => ({
        billet: b,
        cos: cosineSimilarity(candidate.skillVector, b.skillVector)
      }))
      .sort((a, b) => b.cos - a.cos)
      .slice(0, 3);
  }, [candidate, state.billets]);

  // Endorser insights (IDEA-004 context)
  const candidateEndorser = useMemo(() => {
    return state.endorsers.find(e => e.id === candidate?.endorserId) || state.endorsers[0];
  }, [candidate, state.endorsers]);

  if (!candidate) return <div>No candidate selected</div>;

  const scoreOptions = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];

  // Anti-anchoring rule: modelScore and panelAvg hidden until human submits!
  const hasSubmitted = candidate.myScore !== null;
  const panelScores = candidate.scores.map(s => s.value);
  const panelAvg = panelScores.length > 0 ? (panelScores.reduce((a, b) => a + b, 0) / panelScores.length).toFixed(1) : '8.1';
  const modelScore = (candidate.mScore / 10).toFixed(1);

  const handleNextCandidate = () => {
    const nextIdx = (candidateIndex + 1) % state.candidates.length;
    dispatch({ type: 'SELECT_CANDIDATE', candidateId: state.candidates[nextIdx].id });
  };

  const handlePrevCandidate = () => {
    const prevIdx = (candidateIndex - 1 + state.candidates.length) % state.candidates.length;
    dispatch({ type: 'SELECT_CANDIDATE', candidateId: state.candidates[prevIdx].id });
  };

  const handleSubmitScore = () => {
    if (selectedScore === null) return;
    if (hasSubmitted && selectedScore !== candidate.myScore) {
      setReviseConfirmOpen(true);
      return;
    }
    dispatch({ type: 'SUBMIT_SCORE', candidateId: candidate.id, score: selectedScore });
    handleNextCandidate();
  };

  const handleConfirmRevision = () => {
    if (selectedScore === null) return;
    dispatch({
      type: 'REVISE_SCORE',
      candidateId: candidate.id,
      score: selectedScore,
      reason: revisionReasonText || 'Evaluator reassessment after comprehensive package review'
    });
    setReviseConfirmOpen(false);
    setRevisionReasonText('');
  };

  const handleConfirmFlag = () => {
    dispatch({
      type: 'TOGGLE_FLAG',
      candidateId: candidate.id,
      reason: flagReasonText || 'Evaluator discussion required'
    });
    setFlagModalOpen(false);
    setFlagReasonText('');
  };

  const lenses = [
    { num: 1, name: 'Overview (4-Panel)', q: 'Comprehensive operational dossier summarizing core records' },
    { num: 2, name: 'Skills & Competencies', q: 'Technical cluster proficiencies and 8-dimensional space vector' },
    { num: 3, name: 'Experience & Command', q: 'Operational command chronology, joint tours, and deployments' },
    { num: 4, name: 'Performance (ROPs)', q: 'Historical evaluation stratifications and multi-year rating trends' },
    { num: 5, name: 'Education & PME', q: 'Academic degrees, space credentials, badges, and professional schooling' },
    { num: 6, name: 'Predictive & Drivers', q: 'Algorithmic fit scoring, confidence indices, and key weight drivers' },
    { num: 7, name: 'Narrative & SOI', q: 'Candidate Statement of Intent and unit endorser context' },
    { num: 8, name: 'Eligibility & Freshness', q: 'Administrative clearances, waivers, and authoritative sync latency' }
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-24">
      {/* Top Navigation & Candidate Summary Bar */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-cyan-400 font-bold text-xs bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {candidate.id}
            </span>
            <span className="text-slate-400 font-mono text-xs">DoD ID: {candidate.dodId}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono text-xs">PAS: {candidate.pasCode}</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{candidate.name}</span>
            <span className="text-xs font-mono font-medium text-slate-300 bg-[#1e2d45] px-2 py-0.5 rounded">
              {candidate.grade} · {candidate.dafsc}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {candidate.currentUnit} · Last Assignment: {candidate.lastAssignment}
          </p>
        </div>

        {/* Candidate Switcher Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevCandidate}
            className="p-1.5 bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] rounded text-slate-300 hover:text-white"
            title="Previous candidate in queue"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-slate-400 px-2">
            {candidateIndex + 1} of {state.candidates.length}
          </span>
          <button
            type="button"
            onClick={handleNextCandidate}
            className="p-1.5 bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] rounded text-slate-300 hover:text-white"
            title="Next candidate in queue"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Analytical Lenses Navigation */}
      <div className="border-b border-[#1e2d45] pb-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {lenses.map(l => (
            <button
              key={l.num}
              type="button"
              onClick={() => setActiveLens(l.num)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                activeLens === l.num
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#0a1020]'
              }`}
            >
              <span className="font-mono text-[10px] text-cyan-500/80">Alt+{l.num}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 italic pl-1">
          Lens {activeLens}: {lenses[activeLens - 1]?.q}
        </p>
      </div>

      {/* Main Workspace (Split Grid: Central Lenses + Right LLM Scribe Drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Central Lenses Area (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          {/* LENS 1: Overview (4-Panel) */}
          {activeLens === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Panel 1: Statement of Intent (SOI) */}
              <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Statement of Intent (SOI)
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{candidate.soi.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-4">
                  "{candidate.soi.text}"
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {candidate.soi.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/70 text-cyan-300 border border-cyan-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Panel 2: Performance & Stratifications (ROPs) */}
              <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" /> Evaluations & Stratifications
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">Trend: {candidate.ropTrend}</span>
                </div>
                <div className="space-y-1.5">
                  {candidate.performance.map(p => (
                    <div key={p.year} className="p-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-xs flex justify-between">
                      <span className="font-mono text-slate-400">{p.year}</span>
                      <span className="font-semibold text-white truncate max-w-[180px]">{p.strat}</span>
                      <span className="font-mono text-cyan-300">Top {p.pctTop}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3: ARMS & Source Freshness */}
              <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> ARMS & Source Freshness
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Badge: {candidate.badgeLevel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-1.5 bg-[#05080f] border border-[#1e2d45] rounded">
                    <span className="text-[10px] text-slate-400 block">ARMS Sync:</span>
                    <span className="text-emerald-400">5.2h ago</span>
                  </div>
                  <div className="p-1.5 bg-[#05080f] border border-[#1e2d45] rounded">
                    <span className="text-[10px] text-slate-400 block">SURF Sync:</span>
                    <span className={candidate.id === 'PDO-008' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {candidate.id === 'PDO-008' ? '9.5 days (RED)' : '18h ago'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300">
                  <span>Waivers: <strong className="text-white">{candidate.eligibility.waivers}</strong></span>
                </div>
              </div>

              {/* Panel 4: SURF Career Record */}
              <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" /> SURF Career Record
                  </span>
                  <span className="font-mono text-[10px] text-purple-300">PME: {candidate.pmeStatus}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300">
                  <div>TIG: <strong className="text-white">{candidate.tig}</strong></div>
                  <div>TAFCSD: <strong className="text-white">{candidate.tafcsd}</strong></div>
                  <div>Deployments: <strong className="text-cyan-400">{candidate.deployments}</strong></div>
                  <div>Joint Tours: <strong className="text-cyan-400">{candidate.jointTours}</strong></div>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Decorations: {candidate.decorations.join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* LENS 2: Skills */}
          {activeLens === 2 && (
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-4">
              <h3 className="font-semibold text-white text-sm">Competency Clusters & Skill Vector (8-Dim)</h3>
              <div className="space-y-3">
                {candidate.skills.map(sk => (
                  <div key={sk.cluster}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-200">{sk.cluster}</span>
                      <span className="font-mono text-cyan-400">{sk.proficiency} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-[#05080f] rounded-full overflow-hidden border border-[#1e2d45]">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${sk.proficiency}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#1e2d45]">
                <span className="text-xs font-mono text-slate-400 uppercase">8-Dimensional Normalized Vector:</span>
                <div className="flex gap-2 mt-1 font-mono text-xs text-cyan-300">
                  {candidate.skillVector.map((v, i) => (
                    <span key={i} className="bg-[#05080f] px-2 py-0.5 rounded border border-[#1e2d45]">
                      v{i + 1}: {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LENS 3: Experience */}
          {activeLens === 3 && (
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <h3 className="font-semibold text-white text-sm">Command & Duty Chronology</h3>
              <div className="space-y-2">
                {candidate.timeline.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded text-xs flex justify-between">
                    <div>
                      <span className="font-semibold text-white">{item.role}</span>
                      <span className="block text-[11px] text-slate-400">{item.command} · {item.missionArea}</span>
                    </div>
                    <span className="font-mono text-cyan-400">{item.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LENS 4: Performance */}
          {activeLens === 4 && (
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <h3 className="font-semibold text-white text-sm">Officer Performance Reports (Multi-Year)</h3>
              <div className="space-y-2">
                {candidate.performance.map(p => (
                  <div key={p.year} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono text-cyan-400 font-bold mr-2">{p.year}</span>
                      <span className="font-medium text-white">{p.strat}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Top {p.pctTop}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LENS 5: Education */}
          {activeLens === 5 && (
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <h3 className="font-semibold text-white text-sm">Education, Credentials & Certifications</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Highest Degree</span>
                  <span className="font-semibold text-white">{candidate.highestDegree}</span>
                  <span className="text-[11px] text-slate-400 block">{candidate.academicDiscipline}</span>
                </div>
                <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">PME Status</span>
                  <span className="font-semibold text-cyan-300">{candidate.pmeStatus}</span>
                  <span className="text-[11px] text-slate-400 block">Class Year: {candidate.pmeYear}</span>
                </div>
              </div>
            </div>
          )}

          {/* LENS 6: Predictive */}
          {activeLens === 6 && (
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <span>Algorithmic Fit & Feature Weight Drivers</span>
                  <AiBadge />
                </h3>
                <span className="font-mono text-purple-300 font-bold text-sm">
                  LLM Fit: {candidate.llmFitScore}% · mScore: {candidate.mScore}
                </span>
              </div>
              <div className="space-y-2">
                {candidate.featureDrivers.map((fd, i) => (
                  <div key={i} className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded text-xs flex justify-between">
                    <span className="text-slate-300">{fd.feature}</span>
                    <span className="font-mono font-bold text-purple-300">+{(fd.weight * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LENS 7: Narrative & SOI + IDEA-004 Endorser Context */}
          {activeLens === 7 && (
            <div className="space-y-4">
              <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                  <h3 className="font-semibold text-white text-sm">Full Statement of Intent (SOI)</h3>
                  <span className="font-mono text-xs text-slate-400">{candidate.soi.wordCount} words</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#05080f] p-3 rounded border border-[#1e2d45]">
                  {candidate.soi.text}
                </p>
                <div className="p-2.5 bg-cyan-950/20 border border-cyan-800/40 rounded text-xs">
                  <span className="font-semibold text-cyan-300 block mb-0.5">Endorser Endorsement Quote:</span>
                  <span className="text-slate-300 italic">"{candidate.soi.endorserQuote}"</span>
                </div>
              </div>

              {/* IDEA-004: Endorser & Stratification Context beside candidate */}
              <div className="bg-[#0a1020] border border-cyan-500/40 rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Endorser & Stratification Insights (IDEA-004 Context)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#05080f] px-2 py-0.5 rounded border border-[#1e2d45]">
                    Context, not a score
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Endorser Scale */}
                  <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                    <span className="text-slate-400 font-medium block mb-1">
                      Endorser: <strong className="text-white">{candidateEndorser.name}</strong> ({candidateEndorser.unit})
                    </span>
                    <div className="text-sm font-mono font-bold text-cyan-300">
                      {candidateEndorser.top3SharePct}% Top 3 Share
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {candidateEndorser.top3SharePct > 35
                        ? 'High-inflation endorser: Places over 50% of unit candidates in Top 3.'
                        : 'Calibrated endorser: Aligned with normal 18% Top 3 baseline.'}
                    </p>
                  </div>

                  {/* Unit Stratification Overview */}
                  <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded">
                    <span className="text-slate-400 font-medium block mb-1">
                      Unit Stratification Mix ({candidate.currentUnit})
                    </span>
                    <div className="text-xs font-mono text-slate-200">
                      <span className="text-emerald-400 font-bold">DP: {candidateEndorser.stratMix.dpPct}%</span>
                      <span className="text-slate-600 mx-1.5">|</span>
                      <span className="text-cyan-400 font-bold">P: {candidateEndorser.stratMix.pPct}%</span>
                      <span className="text-slate-600 mx-1.5">|</span>
                      <span className="text-slate-400">Non-Strat: {candidateEndorser.stratMix.nonStratPct}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Shares normalized to 100% (see catalog notes on 109% historical sum).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LENS 8: Eligibility & Freshness */}
          {activeLens === 8 && (
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 space-y-3">
              <h3 className="font-semibold text-white text-sm">Administrative Eligibility & Source Gateway Sync</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex justify-between">
                  <span className="text-slate-400">Adverse Actions:</span>
                  <span className={candidate.eligibility.adverseActions !== 'None' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    {candidate.eligibility.adverseActions}
                  </span>
                </div>
                <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex justify-between">
                  <span className="text-slate-400">Waivers:</span>
                  <span className="text-slate-200">{candidate.eligibility.waivers}</span>
                </div>
                <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded flex justify-between">
                  <span className="text-slate-400">Limitation Code:</span>
                  <span className="font-mono font-bold text-cyan-300">{candidate.eligibility.limitationCode}</span>
                </div>
              </div>
            </div>
          )}

          {/* Supporting Lower Cards: Similar Candidates & Possible Fits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Similar Candidates */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3.5 space-y-2">
              <span className="font-semibold text-white text-xs flex items-center justify-between">
                <span>Similar Candidates (Cosine Vector Fit)</span>
                <span className="text-[10px] text-slate-400 font-mono">Top 5</span>
              </span>
              <div className="space-y-1.5">
                {similarCandidates.map(({ candidate: simCand, similarity }) => (
                  <div
                    key={simCand.id}
                    onClick={() => dispatch({ type: 'SELECT_CANDIDATE', candidateId: simCand.id })}
                    className="p-1.5 bg-[#05080f] hover:bg-[#1e2d45] border border-[#1e2d45] rounded text-xs flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{simCand.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{simCand.grade} · {simCand.dafsc}</span>
                    </div>
                    <span className="font-mono text-cyan-300 font-bold">
                      {(similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Possible Billet Fits */}
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3.5 space-y-2">
              <span className="font-semibold text-white text-xs flex items-center justify-between">
                <span>Top 3 Possible Billet Matches</span>
                <button
                  onClick={() => dispatch({ type: 'SET_VIEW', viewId: 'VIEW-MatchLab' })}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  Match Lab <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </span>
              <div className="space-y-1.5">
                {possibleFits.map(({ billet: b, cos }) => (
                  <div key={b.id} className="p-1.5 bg-[#05080f] border border-[#1e2d45] rounded text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200 truncate">{b.title}</span>
                      <span className="font-mono text-purple-300 font-bold">{(cos * 100).toFixed(0)}%</span>
                    </div>
                    <span className="block text-[10px] text-slate-400 font-mono">{b.unit} · {b.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI LLM Scribe Drawer (Req 145) */}
        <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">LLM Scribe Synthesis</span>
                <AiBadge />
              </div>
              <span className="font-mono text-[10px] text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
                {candidate.chatSnapshot.id}
              </span>
            </div>

            {/* 3-Paragraph Synthesis */}
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
              {candidate.chatSnapshot.summary.map((para, idx) => (
                <p key={idx} className="bg-[#05080f] p-2.5 rounded border border-[#1e2d45]">
                  {para}
                </p>
              ))}
            </div>

            {/* Highlighted Strengths */}
            <div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase block mb-1">
                Highlighted Strengths:
              </span>
              <ul className="space-y-1 text-xs text-slate-200">
                {candidate.chatSnapshot.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Considerations */}
            <div>
              <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase block mb-1">
                Considerations & Divergence:
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {candidate.chatSnapshot.considerations.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scribe Human Sign-Off Action */}
          <div className="pt-3 border-t border-[#1e2d45] space-y-2">
            {candidate.chatSnapshot.signedOffBy ? (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off & Verified
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'REVOKE_SNAPSHOT', candidateId: candidate.id })}
                    className="text-[10px] text-red-400 hover:text-red-300 underline"
                  >
                    Revoke
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Signatory: {candidate.chatSnapshot.signedOffBy} · {candidate.chatSnapshot.signedOffAt?.slice(0, 19).replace('T', ' ')}Z
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => dispatch({ type: 'SIGN_OFF_SNAPSHOT', candidateId: candidate.id })}
                className="w-full py-2 px-3 bg-purple-900/60 hover:bg-purple-800 border border-purple-700 rounded font-semibold text-purple-200 text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Approve & Sign Off CHAT-SNAPSHOT</span>
              </button>
            )}
            <p className="text-[10px] text-slate-500 italic text-center">
              Requires human click; stamps actor into DELTA ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Scoring Dock (Anti-Anchoring Enforced) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a1020]/95 backdrop-blur-md border-t border-[#1e2d45] px-4 py-2.5 shadow-2xl no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Candidate Indicator */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold">{candidate.id}</span>
            <span className="font-semibold text-white">{candidate.name}</span>
            <button
              onClick={() => setShowHotkeysHelp(!showHotkeysHelp)}
              className="text-slate-400 hover:text-cyan-400 p-0.5"
              title="View scoring keyboard hotkeys"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scoring Buttons (6.0 to 10.0 in 0.5 steps) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {scoreOptions.map(sc => {
              const isSelected = selectedScore === sc;
              return (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setSelectedScore(sc)}
                  className={`w-10 h-8 rounded font-mono font-bold text-xs transition-all border ${
                    isSelected
                      ? 'bg-cyan-500 text-black border-cyan-400 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/30'
                      : 'bg-[#05080f] text-slate-300 border-[#1e2d45] hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {sc.toFixed(1)}
                </button>
              );
            })}
          </div>

          {/* Anti-Anchoring Reveal or Hidden State */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            {hasSubmitted ? (
              <div className="flex items-center gap-2 bg-[#05080f] px-2.5 py-1 rounded border border-cyan-800/80">
                <span className="text-slate-400">Model: <strong className="text-purple-300">{modelScore}</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Panel Avg: <strong className="text-cyan-300">{panelAvg}</strong></span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Delta: <strong className="text-emerald-400">{(candidate.myScore! - Number(panelAvg)).toFixed(1)}</strong></span>
              </div>
            ) : (
              <span className="text-slate-500 italic bg-[#05080f] px-2 py-1 rounded border border-[#1e2d45]">
                🔒 Model & Panel averages hidden until submission
              </span>
            )}
          </div>

          {/* Action Buttons: Submit & Flag */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlagModalOpen(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded font-medium transition-colors border ${
                candidate.flagged
                  ? 'bg-red-950/80 text-red-300 border-red-700'
                  : 'bg-[#05080f] text-slate-300 border-[#1e2d45] hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{candidate.flagged ? 'Flagged' : 'Flag for Discussion'}</span>
            </button>

            <button
              type="button"
              disabled={selectedScore === null}
              onClick={handleSubmitScore}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-black font-bold rounded shadow-md shadow-cyan-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{hasSubmitted ? 'Update Score' : 'Submit & Next'}</span>
            </button>
          </div>
        </div>

        {/* Hotkeys Popover */}
        {showHotkeysHelp && (
          <div className="max-w-md mx-auto mt-2 p-2.5 bg-[#05080f] border border-[#1e2d45] rounded text-[11px] text-slate-300 font-mono flex items-center justify-between">
            <span>Keys 1 to 5 = 6.0 to 10.0 · Shift+Key = +0.5 · Arrows = Nudge 0.5 · Alt+1..8 = Lenses</span>
            <button onClick={() => setShowHotkeysHelp(false)} className="text-cyan-400 hover:underline">
              Got it
            </button>
          </div>
        )}
      </div>

      {/* Flag Reason Modal */}
      {flagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 w-full max-w-md shadow-2xl space-y-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-400" />
              Flag Candidate for Discussion
            </h3>
            <p className="text-xs text-slate-400">
              Provide a rationale for flagging {candidate.name}. This will be logged to the DELTA ledger.
            </p>
            <textarea
              rows={3}
              value={flagReasonText}
              onChange={e => setFlagReasonText(e.target.value)}
              placeholder="e.g. Divergence in cyber vs space operations weight; requires panel chairman adjudication."
              className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-xs text-white focus:outline-hidden focus:border-red-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFlagModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFlag}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-xs"
              >
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Reason Modal */}
      {reviseConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 w-full max-w-md shadow-2xl space-y-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Confirm Score Revision
            </h3>
            <p className="text-xs text-slate-400">
              You are updating your score from {candidate.myScore?.toFixed(1)} to {selectedScore?.toFixed(1)}. Please provide a brief justification for the DELTA audit trail.
            </p>
            <textarea
              rows={3}
              value={revisionReasonText}
              onChange={e => setRevisionReasonText(e.target.value)}
              placeholder="e.g. Reconciled after reviewing detailed WIC instructor credentialing in Lens 5."
              className="w-full p-2 bg-[#05080f] border border-[#1e2d45] rounded text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReviseConfirmOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevision}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-bold text-xs"
              >
                Submit Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
