import React, { useState, useMemo } from 'react';
import { useOrbit } from '../state/context';
import { Candidate } from '../types';
import { AiBadge } from '../components/AiBadge';
import {
  calculateCandidateLossProfile,
  simulateRetentionMitigation,
  calculateCapabilityDegradation,
  computeCohortAverages,
  CandidateLossProfile,
  CapabilityDegradationSummary,
  CohortLossAverages
} from '../lib/lossCalculator';
import {
  Sparkles,
  Users,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileText,
  X,
  Lock,
  ChevronRight,
  Save,
  Calculator,
  DollarSign,
  TrendingUp,
  Target,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Flame,
  Briefcase,
  GitCompare,
  TrendingDown,
  UserX,
  BarChart3,
  LayoutGrid,
  Zap,
  Activity
} from 'lucide-react';

export const ViewCareerPlanner: React.FC = () => {
  const { state, dispatch } = useOrbit();

  // View Mode: 'grid' (N-Box & Heatmaps) | 'cards' (Roster Card Gallery with Overlays) | 'calculator' (Loss Calculator & Flight Risk)
  const [plannerMode, setPlannerMode] = useState<'grid' | 'cards' | 'calculator'>('grid');

  // Selected cell & candidate for dossier drawer
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [talentNoteText, setTalentNoteText] = useState('');

  // Impact Loss Calculator Modal State
  const [impactModalCandidate, setImpactModalCandidate] = useState<Candidate | null>(null);
  const [compareWithCohort, setCompareWithCohort] = useState<boolean>(true);
  const [simulateRemoval, setSimulateRemoval] = useState<boolean>(true);

  // Selected candidate for Loss Calculator tab
  const [calcCandId, setCalcCandId] = useState<string>('');

  // What-If Retention Mitigation Toggles in Loss Calculator
  const [activeMitigations, setActiveMitigations] = useState<string[]>(['csrb_bonus', 'soi_slating']);

  // Visual Layers: 'standard' | 'flightRisk' | 'costExposure' | 'succession'
  const [activeLayer, setActiveLayer] = useState<'standard' | 'flightRisk' | 'costExposure' | 'succession'>('standard');

  // Slices & Multi-Dimensional Filters
  const [filterDafsc, setFilterDafsc] = useState<string>('All');
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [filterLook, setFilterLook] = useState<string>('All');
  const [filterReadiness, setFilterReadiness] = useState<string>('All');
  const [filterRiskTier, setFilterRiskTier] = useState<string>('All');
  const [filterImpactTier, setFilterImpactTier] = useState<string>('All');

  // FIREWALL RULE 5 ENFORCEMENT:
  // Hidden from Panelist role completely
  if (state.currentRole === 'Panelist') {
    return (
      <div className="p-8 text-center bg-[#0a1020] border border-red-900/60 rounded-md max-w-xl mx-auto my-12 space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">ACCESS RESTRICTED — FIREWALL RULE 5</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Post-board strategic talent data (Risk of Loss, Impact of Loss, Talent Score, N-Box, Loss Calculator, and Advancement Readiness) is strictly firewalled from active Panelist evaluators to prevent evaluation bias.
          </p>
        </div>
        <div className="p-3 bg-[#05080f] rounded border border-[#1e2d45] text-xs font-mono text-cyan-400">
          Switch role to "CFM / Career Planner" or "Assignments Officer" in top-right header to view strategic talent pipelines.
        </div>
      </div>
    );
  }

  // Eligible pool: candidates with talent records
  const allTalentCandidates = useMemo(() => {
    return state.candidates.filter(c => c.talent !== undefined);
  }, [state.candidates]);

  // Set default calculator candidate once pool is ready
  React.useEffect(() => {
    if (!calcCandId && allTalentCandidates.length > 0) {
      const highRisk = allTalentCandidates.find(c => c.talent?.riskOfLoss === 'High') || allTalentCandidates[0];
      setCalcCandId(highRisk.id);
    }
  }, [allTalentCandidates, calcCandId]);

  // Cohort Averages for Comparative Risk Calculations
  const cohortAverages: CohortLossAverages = useMemo(() => {
    return computeCohortAverages(allTalentCandidates, state.billets);
  }, [allTalentCandidates, state.billets]);

  // Capability Degradation calculation for currently selected impact modal candidate
  const degradationSummary: CapabilityDegradationSummary | null = useMemo(() => {
    if (!impactModalCandidate) return null;
    return calculateCapabilityDegradation(impactModalCandidate, allTalentCandidates, state.billets);
  }, [impactModalCandidate, allTalentCandidates, state.billets]);

  const modalCandidateLossProfile: CandidateLossProfile | null = useMemo(() => {
    if (!impactModalCandidate) return null;
    return calculateCandidateLossProfile(impactModalCandidate, allTalentCandidates, state.billets);
  }, [impactModalCandidate, allTalentCandidates, state.billets]);

  // Apply Slices & Filters
  const filteredCandidates = useMemo(() => {
    return allTalentCandidates.filter(c => {
      if (filterDafsc !== 'All' && !c.dafsc.startsWith(filterDafsc)) return false;
      if (filterGrade !== 'All' && c.grade !== filterGrade) return false;
      if (filterLook !== 'All' && c.lookStatus !== filterLook) return false;
      if (filterReadiness !== 'All' && c.talent?.advancementReadiness !== filterReadiness) return false;
      if (filterRiskTier !== 'All' && c.talent?.riskOfLoss !== filterRiskTier) return false;
      if (filterImpactTier !== 'All' && c.talent?.impactOfLoss !== filterImpactTier) return false;
      return true;
    });
  }, [allTalentCandidates, filterDafsc, filterGrade, filterLook, filterReadiness, filterRiskTier, filterImpactTier]);

  // 3x3 N-Box Grid Setup: Performance by Potential
  const nBoxGrid = [
    { row: 'High Potential', cells: ['Specialist / High Impact', 'High Potential', 'Key Talent'] },
    { row: 'Medium Potential', cells: ['Solid Professional', 'Core Talent', 'High Potential'] },
    { row: 'Low Potential', cells: ['Effective Contributor', 'Solid Professional', 'Core Talent'] }
  ];

  // Group filtered candidates by cell
  const candidatesByCell = useMemo(() => {
    const map: Record<string, Candidate[]> = {};
    filteredCandidates.forEach(c => {
      const cell = c.talent?.nBoxCell || 'Core Talent';
      if (!map[cell]) map[cell] = [];
      map[cell].push(c);
    });
    return map;
  }, [filteredCandidates]);

  // Risk of Loss x Impact of Loss 3x3 Matrix counts
  const riskImpactMatrix = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCandidates.forEach(c => {
      const risk = c.talent?.riskOfLoss || 'Medium';
      const impact = c.talent?.impactOfLoss || 'Medium';
      const key = `${risk}_${impact}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [filteredCandidates]);

  // Advancement Readiness breakdown
  const readinessCounts = useMemo(() => {
    return {
      'Ready now': filteredCandidates.filter(c => c.talent?.advancementReadiness === 'Ready now').length,
      '1-2 yrs': filteredCandidates.filter(c => c.talent?.advancementReadiness === '1-2 yrs').length,
      '3+ yrs': filteredCandidates.filter(c => c.talent?.advancementReadiness === '3+ yrs').length
    };
  }, [filteredCandidates]);

  // Active candidate for Loss Calculator tab
  const currentCalcCandidate = useMemo(() => {
    return allTalentCandidates.find(c => c.id === calcCandId) || allTalentCandidates[0];
  }, [allTalentCandidates, calcCandId]);

  // Candidate Loss Profile & Mitigation simulation for Loss Calculator tab
  const lossProfile: CandidateLossProfile | null = useMemo(() => {
    if (!currentCalcCandidate) return null;
    return calculateCandidateLossProfile(currentCalcCandidate, allTalentCandidates, state.billets);
  }, [currentCalcCandidate, allTalentCandidates, state.billets]);

  const simulatedMitigation = useMemo(() => {
    if (!lossProfile) return null;
    return simulateRetentionMitigation(lossProfile, activeMitigations);
  }, [lossProfile, activeMitigations]);

  const handleOpenCandidateDrawer = (c: Candidate) => {
    setSelectedCandidate(c);
    setTalentNoteText(c.talent?.talentNote || '');
  };

  const handleOpenImpactModal = (c: Candidate) => {
    setImpactModalCandidate(c);
    setSimulateRemoval(true);
  };

  const handleSaveTalentNote = () => {
    if (!selectedCandidate) return;
    dispatch({
      type: 'SAVE_TALENT_NOTE',
      candidateId: selectedCandidate.id,
      note: talentNoteText
    });
    setSelectedCandidate({
      ...selectedCandidate,
      talent: {
        ...selectedCandidate.talent!,
        talentNote: talentNoteText
      }
    });
  };

  const resetAllFilters = () => {
    setFilterDafsc('All');
    setFilterGrade('All');
    setFilterLook('All');
    setFilterReadiness('All');
    setFilterRiskTier('All');
    setFilterImpactTier('All');
  };

  const toggleMitigation = (id: string) => {
    setActiveMitigations(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const hasActiveFilters =
    filterDafsc !== 'All' ||
    filterGrade !== 'All' ||
    filterLook !== 'All' ||
    filterReadiness !== 'All' ||
    filterRiskTier !== 'All' ||
    filterImpactTier !== 'All';

  // Key talent candidates for fast access strip
  const keyTalentOfficers = useMemo(() => {
    return allTalentCandidates.filter(c => c.talent?.nBoxCell === 'Key Talent');
  }, [allTalentCandidates]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2d45] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Career Planner & Strategic Loss Calculator
            </h1>
            <span className="font-mono text-xs text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
              IDEA-005 · POST-BOARD
            </span>
            <AiBadge label="Talent Model" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Model voluntary separation hazard (M-601), quantify operational consequence (M-602), simulate roster removal degradation, and apply analytical slices.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0a1020] p-1 rounded-md border border-[#1e2d45] text-xs font-mono">
            <button
              onClick={() => setPlannerMode('grid')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                plannerMode === 'grid'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>3x3 N-Box Grid</span>
            </button>
            <button
              onClick={() => setPlannerMode('cards')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                plannerMode === 'cards'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Roster Card Gallery</span>
            </button>
            <button
              onClick={() => setPlannerMode('calculator')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                plannerMode === 'calculator'
                  ? 'bg-cyan-500 text-black font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Loss Modeler</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slices, Filters & Visual Layers Toolbar */}
      <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2d45]/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Multi-Dimensional Slices</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredCandidates.length}</strong> of {allTalentCandidates.length} candidates
            </span>
          </div>

          {/* Layer Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] font-mono mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" /> Visual Layer:
            </span>
            {[
              { id: 'standard', label: 'Standard' },
              { id: 'flightRisk', label: 'Flight Risk Heat' },
              { id: 'costExposure', label: 'Cost Exposure ($)' },
              { id: 'succession', label: 'Critical Bench' }
            ].map(layer => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id as any)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors border ${
                  activeLayer === layer.id
                    ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                    : 'bg-[#05080f] text-slate-400 border-[#1e2d45] hover:text-white'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Slice Dropdown Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">DAFSC Slice</label>
            <select
              value={filterDafsc}
              onChange={e => setFilterDafsc(e.target.value)}
              className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="All">All DAFSCs</option>
              <option value="13S">13S Space Ops</option>
              <option value="63A">63A Acquisition</option>
              <option value="17S">17S Cyber Ops</option>
              <option value="14N">14N Intelligence</option>
              <option value="61C">61C Scientist</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Grade Slice</label>
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="All">All Grades</option>
              <option value="CAPT">CAPT</option>
              <option value="MAJ">MAJ</option>
              <option value="LT COL">LT COL</option>
              <option value="MSGT">MSGT</option>
              <option value="SMSGT">SMSGT</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Look Status</label>
            <select
              value={filterLook}
              onChange={e => setFilterLook(e.target.value)}
              className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="All">All Looks</option>
              <option value="1st Look">1st Look</option>
              <option value="2nd Look">2nd Look</option>
              <option value="Below Zone">Below Zone</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Readiness</label>
            <select
              value={filterReadiness}
              onChange={e => setFilterReadiness(e.target.value)}
              className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="All">All Horizons</option>
              <option value="Ready now">Ready now</option>
              <option value="1-2 yrs">1-2 yrs</option>
              <option value="3+ yrs">3+ yrs</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Flight Risk (M-601)</label>
            <select
              value={filterRiskTier}
              onChange={e => setFilterRiskTier(e.target.value)}
              className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="All">All Risk Tiers</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <div className="flex items-end gap-1.5">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Impact Tier (M-602)</label>
              <select
                value={filterImpactTier}
                onChange={e => setFilterImpactTier(e.target.value)}
                className="w-full bg-[#05080f] border border-[#1e2d45] rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
              >
                <option value="All">All Impact Tiers</option>
                <option value="High">High Impact</option>
                <option value="Medium">Medium Impact</option>
                <option value="Low">Low Impact</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                title="Reset all filters"
                className="p-1.5 bg-[#1e2d45] hover:bg-[#2e4265] text-slate-300 hover:text-white rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KEY TALENT HIGH-IMPACT ROSTER STRIP with direct Impact Loss Calculator triggers */}
      <div className="bg-[#0a1020] border border-purple-800/60 rounded-md p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2d45] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              Key Talent Roster — High-Exposure Flight Risk Overlay
            </h3>
            <span className="text-[11px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              {keyTalentOfficers.length} Officers
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click "Impact Loss Calc" on any card to simulate capability degradation if departed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {keyTalentOfficers.map(cand => (
            <div
              key={cand.id}
              className="p-3 bg-[#05080f] hover:bg-[#0a1020] border border-purple-800/40 hover:border-purple-500 rounded-md transition-all flex flex-col justify-between space-y-2 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{cand.name}</span>
                    <span className="text-[9px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-800">
                      Key Talent
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cand.id} · {cand.grade} · {cand.dafsc} · {cand.currentUnit}
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  cand.talent?.riskOfLoss === 'High'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  Risk: {cand.talent?.riskOfLoss}
                </span>
              </div>

              {/* Action Buttons: Impact Loss Calculator Overlay & Dossier */}
              <div className="flex items-center gap-2 pt-1.5 border-t border-[#1e2d45]">
                <button
                  type="button"
                  onClick={() => handleOpenImpactModal(cand)}
                  className="flex-1 py-1.5 px-2 bg-gradient-to-r from-purple-900 to-indigo-950 hover:from-purple-800 hover:to-indigo-900 border border-purple-600/80 text-purple-200 rounded font-mono text-[10px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Calculator className="w-3.5 h-3.5 text-purple-400" />
                  <span>Impact Loss Calc</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCandidateDrawer(cand)}
                  className="py-1.5 px-2.5 bg-[#1e2d45] hover:bg-[#2e4265] text-slate-300 hover:text-white rounded font-mono text-[10px] transition-colors"
                >
                  Dossier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODE 1: STRATEGIC N-BOX GRID (Performance by Potential) */}
      {plannerMode === 'grid' && (
        <div className="space-y-6">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
              <div>
                <h3 className="font-bold text-white text-sm">3x3 N-Box Talent Grid (Performance vs Potential)</h3>
                <p className="text-xs text-slate-400">
                  Select any cell to inspect candidate roster, flight risk factors, and talent development plans.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Active Slice Count: {filteredCandidates.length} Candidates
              </span>
            </div>

            {/* 3x3 Grid Rendering with Layer Overlays */}
            <div className="space-y-2">
              {nBoxGrid.map((rowItem, rIdx) => (
                <div key={rIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {rowItem.cells.map((cellLabel, cIdx) => {
                    const candidatesInCell = candidatesByCell[cellLabel] || [];
                    const isSelected = selectedCell === cellLabel;

                    const highRiskCount = candidatesInCell.filter(c => c.talent?.riskOfLoss === 'High').length;
                    const estimatedExposureSum = candidatesInCell.reduce((acc, c) => {
                      const base = c.dafsc.startsWith('13S') ? 950000 : c.dafsc.startsWith('17S') ? 850000 : 720000;
                      return acc + base;
                    }, 0);

                    return (
                      <div
                        key={cIdx}
                        onClick={() => setSelectedCell(isSelected ? null : cellLabel)}
                        className={`p-3.5 rounded-md border transition-all cursor-pointer flex flex-col justify-between min-h-[115px] relative overflow-hidden ${
                          isSelected
                            ? 'border-purple-400 ring-2 ring-purple-400/50 bg-purple-950/30'
                            : cellLabel === 'Key Talent'
                            ? 'bg-purple-950/20 border-purple-800/80 hover:border-purple-500'
                            : cellLabel === 'High Potential'
                            ? 'bg-cyan-950/20 border-cyan-800/80 hover:border-cyan-500'
                            : 'bg-[#05080f] border-[#1e2d45] hover:border-slate-500'
                        } ${
                          activeLayer === 'flightRisk' && highRiskCount > 0
                            ? 'ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-xs text-white leading-tight block">{cellLabel}</span>
                            {activeLayer === 'costExposure' && candidatesInCell.length > 0 && (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                <DollarSign className="w-2.5 h-2.5" />
                                ${(estimatedExposureSum / 1000000).toFixed(2)}M Exposure
                              </span>
                            )}
                            {activeLayer === 'flightRisk' && highRiskCount > 0 && (
                              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5 mt-0.5">
                                <Flame className="w-2.5 h-2.5 text-amber-500" />
                                {highRiskCount} High Flight Risk
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs font-bold text-purple-300 bg-[#0a1020] px-2 py-0.5 rounded border border-[#1e2d45]">
                            {candidatesInCell.length}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-[#1e2d45]/50 flex justify-between items-center">
                          <span>{rowItem.row.split(' ')[0]} Pot.</span>
                          <span className="text-cyan-400 flex items-center gap-0.5">
                            {isSelected ? 'Viewing' : 'Inspect'} <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Selected Cell Candidate List with Impact Loss Calculator Overlays */}
            {selectedCell && (
              <div className="mt-4 p-4 bg-[#05080f] border border-purple-500/50 rounded-md space-y-3 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-[#1e2d45] pb-2">
                  <span className="font-bold text-white text-xs font-mono uppercase">
                    Candidates in "{selectedCell}" ({candidatesByCell[selectedCell]?.length || 0})
                  </span>
                  <button onClick={() => setSelectedCell(null)} className="text-slate-400 hover:text-white text-xs">
                    Close List
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(candidatesByCell[selectedCell] || []).map(c => {
                    const isHighRisk = c.talent?.riskOfLoss === 'High';
                    const isKeyTalent = c.talent?.nBoxCell === 'Key Talent';
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleOpenCandidateDrawer(c)}
                        className={`p-3 bg-[#0a1020] hover:bg-[#1e2d45] border rounded-md text-xs flex flex-col justify-between gap-2 cursor-pointer transition-colors ${
                          activeLayer === 'flightRisk' && isHighRisk
                            ? 'border-amber-500/80 bg-amber-950/20'
                            : isKeyTalent
                            ? 'border-purple-800/80'
                            : 'border-[#1e2d45]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white">{c.name}</span>
                              {isHighRisk && (
                                <span title="High Flight Risk">
                                  <Flame className="w-3 h-3 text-amber-400" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {c.id} · {c.grade} · {c.dafsc} · Score: {c.talent?.talentScore}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-purple-300 px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 block">
                              {c.talent?.advancementReadiness}
                            </span>
                          </div>
                        </div>

                        {/* Impact Loss Calculator Overlay Trigger on Card */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1e2d45]/60">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenImpactModal(c);
                            }}
                            className={`py-1 px-2 rounded text-[10px] font-mono font-semibold flex items-center gap-1.5 border transition-all ${
                              isKeyTalent
                                ? 'bg-purple-950 text-purple-200 border-purple-600 hover:bg-purple-900 shadow-sm'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800 hover:bg-cyan-900'
                            }`}
                            title="Calculate potential capability degradation if removed from roster"
                          >
                            <Calculator className="w-3 h-3 text-cyan-400" />
                            <span>Impact Loss Calc</span>
                          </button>

                          <span className="text-[9px] font-mono text-slate-400">
                            Risk: <strong className={isHighRisk ? 'text-red-400' : 'text-slate-300'}>{c.talent?.riskOfLoss}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2 & 3: RISK/IMPACT MATRIX & ADVANCEMENT READINESS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">Risk of Loss by Impact of Loss Matrix</h3>
                  <p className="text-[11px] text-slate-400">Cross-tabulation of separation hazard against operational consequence.</p>
                </div>
                <span className="text-[10px] font-mono text-purple-300">M-601 & M-602</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {['High', 'Medium', 'Low'].map(impact => (
                  <div key={impact} className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Impact: {impact}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Low', 'Medium', 'High'].map(risk => {
                        const count = riskImpactMatrix[`${risk}_${impact}`] || 0;
                        const isSevere = impact === 'High' && risk === 'High';
                        return (
                          <div
                            key={risk}
                            className={`p-3 rounded border text-center transition-all ${
                              isSevere
                                ? 'bg-red-950/70 border-red-600 text-red-200 font-bold ring-1 ring-red-500/50'
                                : risk === 'High' || impact === 'High'
                                ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                                : 'bg-[#05080f] border-[#1e2d45] text-slate-300'
                            }`}
                          >
                            <div className="text-xl font-bold">{count}</div>
                            <span className="text-[10px] text-slate-400 block font-normal">Risk: {risk}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic pt-1">
                Top-right quadrant reflects acute voluntary separation probability with severe mission consequence.
              </p>
            </div>

            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2 mb-3">
                  <h3 className="font-bold text-white text-sm">Advancement Readiness Timeline Horizons</h3>
                  <span className="text-[10px] font-mono text-cyan-400">M-605</span>
                </div>

                <div className="space-y-3">
                  {[
                    { horizon: 'Ready now', count: readinessCounts['Ready now'], color: 'bg-emerald-500', text: 'text-emerald-400' },
                    { horizon: '1-2 yrs', count: readinessCounts['1-2 yrs'], color: 'bg-cyan-500', text: 'text-cyan-400' },
                    { horizon: '3+ yrs', count: readinessCounts['3+ yrs'], color: 'bg-slate-500', text: 'text-slate-400' }
                  ].map(h => (
                    <div key={h.horizon} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded-md">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="font-semibold text-white">{h.horizon}</span>
                        <span className={`font-mono font-bold ${h.text}`}>{h.count} Officers</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#0a1020] rounded-full overflow-hidden border border-[#1e2d45]">
                        <div
                          className={`h-full rounded-full ${h.color}`}
                          style={{ width: `${(h.count / Math.max(1, filteredCandidates.length)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#05080f] border border-purple-800/40 rounded text-xs text-slate-300">
                <span className="font-bold text-purple-300 block mb-1">CFM Succession Rule:</span>
                Officers marked "Ready now" populate primary bench slates for upcoming Command and O6 Selection Boards.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: ROSTER CARD GALLERY WITH EXPLICIT IMPACT LOSS CALCULATOR OVERLAYS */}
      {plannerMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#0a1020] border border-[#1e2d45] p-4 rounded-md">
            <div>
              <h3 className="font-bold text-white text-sm">Roster Candidate Cards & Degradation Simulation</h3>
              <p className="text-xs text-slate-400">
                Inspect individual candidate profiles with interactive capability degradation triggers.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {filteredCandidates.length} Candidates in Active Slice
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCandidates.map(cand => {
              const isKeyTalent = cand.talent?.nBoxCell === 'Key Talent';
              const isHighRisk = cand.talent?.riskOfLoss === 'High';
              const isHighImpact = cand.talent?.impactOfLoss === 'High';

              return (
                <div
                  key={cand.id}
                  className={`p-4 bg-[#0a1020] border rounded-lg flex flex-col justify-between space-y-3 relative transition-all hover:shadow-xl ${
                    isKeyTalent
                      ? 'border-purple-600/80 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-gradient-to-b from-[#0a1020] to-[#120f26]'
                      : 'border-[#1e2d45] hover:border-slate-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{cand.name}</span>
                          {isKeyTalent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700">
                              Key Talent
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-cyan-400 font-mono">
                          {cand.id} · {cand.grade} · {cand.dafsc} · {cand.currentUnit}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800 block">
                          Score: {cand.talent?.talentScore}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2 bg-[#05080f] border border-[#1e2d45] rounded">
                        <span className="text-[10px] text-slate-400 block uppercase">M-601 Flight Risk</span>
                        <span className={`font-bold ${isHighRisk ? 'text-red-400' : 'text-slate-300'}`}>
                          {cand.talent?.riskOfLoss} Risk
                        </span>
                      </div>
                      <div className="p-2 bg-[#05080f] border border-[#1e2d45] rounded">
                        <span className="text-[10px] text-slate-400 block uppercase">M-602 Impact</span>
                        <span className={`font-bold ${isHighImpact ? 'text-amber-400' : 'text-slate-300'}`}>
                          {cand.talent?.impactOfLoss} Impact
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex justify-between items-center pt-1 border-t border-[#1e2d45]/40">
                      <span>N-Box: <strong className="text-slate-200">{cand.talent?.nBoxCell}</strong></span>
                      <span>Horizon: <strong className="text-emerald-400">{cand.talent?.advancementReadiness}</strong></span>
                    </div>
                  </div>

                  {/* High Visibility Impact Loss Calculator Overlay Bar */}
                  <div className="pt-2 border-t border-[#1e2d45] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenImpactModal(cand)}
                      className={`flex-1 py-2 px-3 rounded font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        isKeyTalent
                          ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400'
                          : 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Impact Loss Calculator</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCandidateDrawer(cand)}
                      className="py-2 px-3 bg-[#1e2d45] hover:bg-[#2e4265] text-slate-300 hover:text-white rounded font-mono text-xs font-medium"
                    >
                      Dossier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: LOSS CALCULATOR & FLIGHT RISK MODELER */}
      {plannerMode === 'calculator' && lossProfile && (
        <div className="space-y-6">
          <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">Loss Calculator & Flight Risk Dossier</span>
                <span className="text-[11px] text-slate-400">Select an officer to calculate quantitative replacement exposure and peer flight risk drivers.</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-mono">Evaluate Officer:</label>
              <select
                value={calcCandId}
                onChange={e => setCalcCandId(e.target.value)}
                className="bg-[#05080f] border border-cyan-500/60 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-hidden"
              >
                {allTalentCandidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) · {c.grade} · {c.dafsc} · Risk: {c.talent?.riskOfLoss}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-[#0a1020] border border-emerald-800/80 rounded-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="uppercase font-mono text-[10px]">Financial Replacement Cost</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                ${(lossProfile.costBreakdown.totalEstimatedCost / 1000).toLocaleString()}k
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Pipeline training amortization + TS/SCI clearance reinvestment
              </div>
            </div>

            <div className="p-4 bg-[#0a1020] border border-[#1e2d45] rounded-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="uppercase font-mono text-[10px]">Time-to-Productivity Gap</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300">
                {lossProfile.timeToBackfillMonths} Months
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Estimated billet vacancy & mission-qualification curve
              </div>
            </div>

            <div className={`p-4 bg-[#0a1020] rounded-md border ${
              lossProfile.flightRiskScore >= 70
                ? 'border-red-700/80 bg-red-950/20'
                : lossProfile.flightRiskScore >= 50
                ? 'border-amber-700/80 bg-amber-950/20'
                : 'border-emerald-700/80 bg-emerald-950/20'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="uppercase font-mono text-[10px]">Flight Risk Index (M-601)</span>
                <Flame className={`w-4 h-4 ${lossProfile.flightRiskScore >= 70 ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono ${
                  lossProfile.flightRiskScore >= 70 ? 'text-red-300' : 'text-amber-300'
                }`}>
                  {lossProfile.flightRiskScore} / 100
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  ({lossProfile.riskOfLoss} Risk)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Higher separation hazard than <strong className="text-white">{lossProfile.percentileRisk}%</strong> of peer cohort
              </div>
            </div>

            <div className="p-4 bg-[#0a1020] border border-purple-800/80 rounded-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="uppercase font-mono text-[10px]">Succession Impact (M-602)</span>
                <Briefcase className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {lossProfile.successionExposure.isCriticalSuccessor ? (
                  <span className="text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Critical Successor
                  </span>
                ) : (
                  <span className="text-slate-300">Standard Bench Depth</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {lossProfile.successionExposure.criticalityNotice}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
              <div className="border-b border-[#1e2d45] pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  What is at risk of losing this candidate over others?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Peer cohort rank: <strong className="text-white">#{lossProfile.cohortRiskRank} of {lossProfile.cohortTotal}</strong> officers in voluntary separation hazard.
                </p>
              </div>

              <div className="space-y-3">
                {lossProfile.riskFactors.map(factor => (
                  <div key={factor.id} className="p-3 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">{factor.factor}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        factor.severity === 'High'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {factor.severity} Weight
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {factor.description}
                    </p>
                    <div className="text-[11px] text-cyan-400 font-mono pt-1">
                      ETMO Market Benchmark: {factor.marketEvidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0a1020] border border-[#1e2d45] rounded-md p-5 space-y-4">
              <div className="border-b border-[#1e2d45] pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Detailed Replacement Cost Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full lifecycle financial investment required to recruit, clear, train, and seat a replacement.
                </p>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                {[
                  {
                    label: 'Specialized Pipeline Training Amortization',
                    desc: 'Undergraduate Space/Cyber Training + Mission Qualification Course',
                    amount: lossProfile.costBreakdown.trainingPipeline,
                    pct: Math.round((lossProfile.costBreakdown.trainingPipeline / lossProfile.costBreakdown.totalEstimatedCost) * 100)
                  },
                  {
                    label: 'TS/SCI Clearance & SAP Reinvestment',
                    desc: 'Tier 5 Background Investigation, CI Polygraph, and Special Access Briefings',
                    amount: lossProfile.costBreakdown.clearanceReinvest,
                    pct: Math.round((lossProfile.costBreakdown.clearanceReinvest / lossProfile.costBreakdown.totalEstimatedCost) * 100)
                  },
                  {
                    label: `Vacancy & Productivity Gap (${lossProfile.timeToBackfillMonths} Months)`,
                    desc: 'Operational capability shortfall and contractor surge backfill',
                    amount: lossProfile.costBreakdown.vacancyLag,
                    pct: Math.round((lossProfile.costBreakdown.vacancyLag / lossProfile.costBreakdown.totalEstimatedCost) * 100)
                  },
                  {
                    label: 'Lateral Succession & Acquisition Costs',
                    desc: 'PCS relocation, lateral boarding, and onboarding overhead',
                    amount: lossProfile.costBreakdown.recruiterAcquisition,
                    pct: Math.round((lossProfile.costBreakdown.recruiterAcquisition / lossProfile.costBreakdown.totalEstimatedCost) * 100)
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-200 font-semibold">{item.label}</span>
                      <span className="font-bold text-emerald-400">${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0a1020] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{item.desc}</span>
                      <span>{item.pct}% of total</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#05080f] border border-emerald-900/60 rounded flex justify-between items-center font-mono">
                <span className="text-xs text-white font-bold">Total Estimated Attrition Exposure:</span>
                <span className="text-base font-bold text-emerald-300">
                  ${lossProfile.costBreakdown.totalEstimatedCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Retention Mitigation Simulator */}
          {simulatedMitigation && (
            <div className="bg-[#0a1020] border border-cyan-800/80 rounded-md p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2d45] pb-2">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Interactive Retention Mitigation Simulator
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle potential CFM and BMO intervention levers to model projected flight risk reduction and preserved capability value.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Live Preserved Value: ${(simulatedMitigation.preservedValue / 1000).toFixed(0)}k
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'csrb_bonus',
                    title: 'Targeted Retention Bonus (CSRB)',
                    desc: 'Offer $35k/yr Critical Skills Retention Bonus with 3-year commitment.',
                    impact: '-26 Risk Points'
                  },
                  {
                    id: 'soi_slating',
                    title: 'Priority Stated Preference Slating',
                    desc: `Match directly to candidate's #1 SOI preference location (${currentCalcCandidate.soi.preferences.locations[0] || 'Colorado Springs'}).`,
                    impact: '-22 Risk Points'
                  },
                  {
                    id: 'fellowship_sde',
                    title: 'SDE Fellowship Sponsorship',
                    desc: 'Sponsor in-residence SDE or Space Industry Fellowship at MIT / Johns Hopkins APL.',
                    impact: '-18 Risk Points'
                  },
                  {
                    id: 'joint_acceleration',
                    title: 'Joint Duty Fast-Track Path',
                    desc: 'Guarantee fast-track Joint Staff nomination within next slating cycle.',
                    impact: '-14 Risk Points'
                  }
                ].map(mit => {
                  const isChecked = activeMitigations.includes(mit.id);
                  return (
                    <div
                      key={mit.id}
                      onClick={() => toggleMitigation(mit.id)}
                      className={`p-3 rounded-md border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-sm'
                          : 'bg-[#05080f] border-[#1e2d45] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white leading-tight">{mit.title}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-cyan-500 focus:ring-0"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{mit.desc}</p>
                      <div className="mt-2 text-[10px] font-mono text-cyan-300 font-bold">
                        {mit.impact}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Baseline Flight Risk</span>
                    <span className="text-base font-bold text-red-400">{lossProfile.flightRiskScore} / 100 ({lossProfile.riskOfLoss})</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Simulated Risk Outcome</span>
                    <span className="text-base font-bold text-emerald-400">
                      {simulatedMitigation.revisedRiskScore} / 100 ({simulatedMitigation.revisedRiskTier})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Mitigation Efficacy</span>
                    <span className="text-sm font-bold text-cyan-300">{simulatedMitigation.mitigationEffectivenessPct}% Hazard Reduction</span>
                  </div>
                  <div className="border-l border-[#1e2d45] pl-4">
                    <span className="text-[10px] text-slate-400 block uppercase">Preserved Capability Asset</span>
                    <span className="text-sm font-bold text-emerald-400">${simulatedMitigation.preservedValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: IMPACT LOSS & CAPABILITY DEGRADATION CALCULATOR (M-601/M-602) */}
      {impactModalCandidate && degradationSummary && modalCandidateLossProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#0a1020] border-2 border-purple-500 rounded-lg max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#1e2d45] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-purple-400 animate-pulse" />
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Impact Loss Calculator — Capability Degradation Simulation
                      {degradationSummary.isKeyTalent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700">
                          Key Talent Departure
                        </span>
                      )}
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Operational model calculating potential mission capability degradation (M-601/M-602) if <strong>{degradationSummary.name}</strong> ({degradationSummary.grade}, {degradationSummary.dafsc}) is removed from the active personnel roster.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setImpactModalCandidate(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-[#1e2d45] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SIMULATION STATE TOGGLE: Baseline Active vs Removed from Roster */}
            <div className="p-3 bg-[#05080f] border border-[#1e2d45] rounded-md flex flex-wrap items-center justify-between gap-3 font-mono">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs">Roster State Simulation:</span>
                <span className="text-slate-400 text-[11px]">
                  {simulateRemoval
                    ? 'Simulating immediate officer departure from delta line'
                    : 'Showing current active roster readiness status'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulateRemoval(false)}
                  className={`px-3 py-1 rounded text-xs transition-colors border ${
                    !simulateRemoval
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold'
                      : 'bg-[#0a1020] text-slate-400 border-[#1e2d45]'
                  }`}
                >
                  Active Roster (Baseline)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateRemoval(true)}
                  className={`px-3 py-1 rounded text-xs transition-colors border flex items-center gap-1.5 ${
                    simulateRemoval
                      ? 'bg-red-950 text-red-300 border-red-500 font-bold shadow-sm'
                      : 'bg-[#0a1020] text-slate-400 border-[#1e2d45]'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Simulate Removal</span>
                </button>
              </div>
            </div>

            {/* M-601 / M-602 PRIMARY DEGRADATION SCORE STRIP */}
            <div className={`p-4 rounded-md border transition-all ${
              simulateRemoval
                ? 'bg-gradient-to-r from-red-950/40 via-[#0a1020] to-purple-950/40 border-red-700/80 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                : 'bg-[#05080f] border-emerald-700/60'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    {simulateRemoval ? 'Systemic Enterprise Capability Degradation' : 'Current Enterprise Baseline'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-3xl font-bold font-mono ${simulateRemoval ? 'text-red-400' : 'text-emerald-400'}`}>
                      {simulateRemoval ? `-${degradationSummary.overallDegradationPct}%` : '100%'}
                    </span>
                    <span className="text-xs text-slate-300">
                      {simulateRemoval
                        ? `Operational degradation across ${degradationSummary.dafsc} mission area`
                        : 'Full roster deployment readiness'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-purple-300 mt-1">
                    {degradationSummary.compositeCalculationFormula}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">M-601 Flight Risk</span>
                    <span className="text-base font-bold text-amber-400">
                      {degradationSummary.m601RiskScore}/100 ({degradationSummary.m601RiskTier})
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#05080f] border border-[#1e2d45] rounded text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">M-602 Impact</span>
                    <span className="text-base font-bold text-red-400">
                      {degradationSummary.m602ImpactScore}/100 ({degradationSummary.m602ImpactTier})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 OPERATIONAL MISSION READINESS DEGRADATION GAUGES */}
            <div className="space-y-3 bg-[#05080f] border border-[#1e2d45] rounded-md p-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-white uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Mission Readiness Degradation Breakdown (M-601/M-602 Impact Areas)
                </span>
                <span className="text-[11px] text-slate-400">
                  {simulateRemoval ? 'Degraded Post-Departure Levels' : 'Nominal Operational State'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {degradationSummary.missionReadinessImpacts.map((m, idx) => {
                  const currentVal = simulateRemoval ? m.degradedPct : m.baselinePct;
                  const isDegraded = simulateRemoval && m.lossPct > 0;

                  return (
                    <div key={idx} className="p-3 bg-[#0a1020] border border-[#1e2d45] rounded space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-200">{m.area}</span>
                        <span className={`font-mono font-bold ${
                          isDegraded
                            ? m.severity === 'Severe'
                              ? 'text-red-400'
                              : 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {currentVal}% {isDegraded && `(-${m.lossPct}%)`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#05080f] rounded-full overflow-hidden border border-[#1e2d45]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDegraded
                              ? m.severity === 'Severe'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${currentVal}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{m.description}</span>
                        {isDegraded && (
                          <span className="text-red-400 font-bold uppercase">{m.severity} Risk</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COMPARATIVE RISK TOGGLE BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#05080f] border border-[#1e2d45] rounded-md font-mono text-xs">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Comparative Risk Benchmark:</span>
                <span className="text-slate-400 text-[11px]">Compare selected candidate directly against cohort average benchmarks</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-300">Cohort Benchmark:</span>
                <button
                  type="button"
                  onClick={() => setCompareWithCohort(!compareWithCohort)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                    compareWithCohort
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                      : 'bg-[#0a1020] text-slate-400 border-[#1e2d45] hover:text-white'
                  }`}
                >
                  {compareWithCohort ? 'COMPARATIVE ON' : 'COMPARATIVE OFF'}
                </button>
              </div>
            </div>

            {/* COMPARATIVE RISK VIEW (WHEN TOGGLED ON) */}
            {compareWithCohort ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>M-601 FLIGHT RISK</span>
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="flex justify-between items-baseline font-mono">
                      <div>
                        <span className="text-xl font-bold text-amber-400">{degradationSummary.m601RiskScore}</span>
                        <span className="text-[10px] text-slate-400 block">Candidate Score</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-slate-400">{cohortAverages.avgFlightRiskScore}</span>
                        <span className="text-[10px] text-slate-500 block">Cohort Avg</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-amber-300 pt-1 border-t border-[#1e2d45]">
                      Δ {degradationSummary.m601RiskScore >= cohortAverages.avgFlightRiskScore ? '+' : ''}
                      {degradationSummary.m601RiskScore - cohortAverages.avgFlightRiskScore} pts vs cohort mean
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>M-602 IMPACT OF LOSS</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="flex justify-between items-baseline font-mono">
                      <div>
                        <span className="text-xl font-bold text-red-400">{degradationSummary.m602ImpactScore}</span>
                        <span className="text-[10px] text-slate-400 block">Candidate Impact</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-slate-400">{cohortAverages.avgImpactScore}</span>
                        <span className="text-[10px] text-slate-500 block">Cohort Avg</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-red-300 pt-1 border-t border-[#1e2d45]">
                      Δ +{degradationSummary.m602ImpactScore - cohortAverages.avgImpactScore} pts ({Math.round(((degradationSummary.m602ImpactScore - cohortAverages.avgImpactScore) / cohortAverages.avgImpactScore) * 100)}% higher impact)
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>FINANCIAL REPLACEMENT</span>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex justify-between items-baseline font-mono">
                      <div>
                        <span className="text-xl font-bold text-emerald-400">
                          ${(modalCandidateLossProfile.costBreakdown.totalEstimatedCost / 1000).toFixed(0)}k
                        </span>
                        <span className="text-[10px] text-slate-400 block">Candidate Cost</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-slate-400">
                          ${(cohortAverages.avgReplacementCost / 1000).toFixed(0)}k
                        </span>
                        <span className="text-[10px] text-slate-500 block">Cohort Avg</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-300 pt-1 border-t border-[#1e2d45]">
                      Δ +${((modalCandidateLossProfile.costBreakdown.totalEstimatedCost - cohortAverages.avgReplacementCost) / 1000).toFixed(0)}k Cost Premium
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-300 text-xs font-semibold">
                    <span>Comparative Vector Benchmark (Candidate vs Cohort Mean)</span>
                    <span className="text-[10px] text-slate-500">Cohort N = {cohortAverages.totalOfficers}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Mission Readiness Degradation:</span>
                      <span className="text-red-400 font-bold">
                        Candidate: {degradationSummary.overallDegradationPct}% vs Avg: {cohortAverages.avgDegradationPct}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#0a1020] rounded-full overflow-hidden flex relative border border-[#1e2d45]">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${Math.min(100, degradationSummary.overallDegradationPct * 3.5)}%` }}
                      ></div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white"
                        style={{ left: `${Math.min(100, cohortAverages.avgDegradationPct * 3.5)}%` }}
                        title="Cohort Mean"
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Vacancy & Recertification Lag:</span>
                      <span className="text-cyan-400 font-bold">
                        Candidate: {modalCandidateLossProfile.timeToBackfillMonths} mos vs Avg: {cohortAverages.avgBackfillMonths} mos
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#0a1020] rounded-full overflow-hidden flex relative border border-[#1e2d45]">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, (modalCandidateLossProfile.timeToBackfillMonths / 18) * 100)}%` }}
                      ></div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white"
                        style={{ left: `${Math.min(100, (cohortAverages.avgBackfillMonths / 18) * 100)}%` }}
                        title="Cohort Mean"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE OFFICER DEGRADATION PROFILE (WHEN COMPARATIVE OFF) */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2">
                  <span className="font-bold text-white block text-xs uppercase font-mono">
                    Vacated Command Position & Billet Impact
                  </span>
                  {degradationSummary.vacatedBillet ? (
                    <div className="p-2.5 bg-[#0a1020] rounded border border-amber-800/60 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">{degradationSummary.vacatedBillet.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          {degradationSummary.vacatedBillet.priority} Billet
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {degradationSummary.vacatedBillet.unit} · {degradationSummary.vacatedBillet.id}
                      </span>
                      <p className="text-[10px] text-amber-200/90 leading-tight pt-1">
                        Departure vacates this critical command seat with no qualified bench successor available in &lt;12 months.
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs">
                      No single command billet directly vacated; affects enterprise staff pool.
                    </p>
                  )}
                  <div className="text-[11px] text-slate-300 pt-1">
                    <strong className="text-purple-300">Primary Mission Affected:</strong> {degradationSummary.primaryMissionImpacted}
                  </div>
                </div>

                <div className="p-3.5 bg-[#05080f] border border-[#1e2d45] rounded-md space-y-2">
                  <span className="font-bold text-white block text-xs uppercase font-mono">
                    Specialized Skill Capability Attrited
                  </span>
                  <div className="space-y-1.5">
                    {degradationSummary.lostSkills.map((sk, idx) => (
                      <div key={idx} className="p-2 bg-[#0a1020] rounded border border-[#1e2d45] flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-slate-200">{sk.cluster}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Proficiency: {sk.proficiency}/100 · Rarity: {(sk.rarity * 100).toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900">
                          LOST CAPABILITY
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-purple-950/30 border border-purple-800/80 rounded-md text-xs text-slate-300 space-y-1 font-mono">
              <span className="font-bold text-purple-300 block">CFM / BMO Succession Mitigation Advisory:</span>
              <p className="text-[11px] leading-relaxed">
                {degradationSummary.downstreamSuccessionGap} Re-slating must initiate 9 months prior to projected separation date. Retaining {degradationSummary.name} via targeted CSRB incentive ($35k/yr) preserves ~${(modalCandidateLossProfile.costBreakdown.totalEstimatedCost / 1000).toFixed(0)}k in enterprise capability value.
              </p>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1e2d45]">
              <button
                type="button"
                onClick={() => {
                  setCalcCandId(impactModalCandidate.id);
                  setPlannerMode('calculator');
                  setImpactModalCandidate(null);
                }}
                className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-mono font-bold rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open in What-If Retention Simulator</span>
              </button>

              <button
                type="button"
                onClick={() => setImpactModalCandidate(null)}
                className="px-4 py-1.5 bg-[#1e2d45] hover:bg-[#2e4265] text-white font-medium rounded text-xs transition-colors"
              >
                Close Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Talent Dossier Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0a1020] border-l border-[#1e2d45] p-5 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right text-xs">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex justify-between items-center border-b border-[#1e2d45] pb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedCandidate.name}</h3>
                  <span className="font-mono text-[10px] text-cyan-400">
                    {selectedCandidate.id} · {selectedCandidate.grade} · {selectedCandidate.dafsc}
                  </span>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Five Core Talent Values */}
              <div className="space-y-2 bg-[#05080f] p-3 rounded border border-[#1e2d45] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk of Loss (M-601):</span>
                  <span className="font-bold text-amber-400">{selectedCandidate.talent?.riskOfLoss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Impact of Loss (M-602):</span>
                  <span className="font-bold text-red-400">{selectedCandidate.talent?.impactOfLoss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Talent Score (M-603):</span>
                  <span className="font-bold text-purple-300">{selectedCandidate.talent?.talentScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">N-Box Cell (M-604):</span>
                  <span className="font-bold text-cyan-300">{selectedCandidate.talent?.nBoxCell}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Readiness Horizon (M-605):</span>
                  <span className="font-bold text-emerald-400">{selectedCandidate.talent?.advancementReadiness}</span>
                </div>
              </div>

              {/* Impact Loss Calculator Trigger in Drawer */}
              <button
                type="button"
                onClick={() => {
                  const cand = selectedCandidate;
                  setSelectedCandidate(null);
                  handleOpenImpactModal(cand);
                }}
                className="w-full py-2 bg-gradient-to-r from-purple-900 to-indigo-950 hover:from-purple-800 hover:to-indigo-900 border border-purple-600/80 text-purple-200 rounded font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Calculator className="w-3.5 h-3.5 text-purple-400" />
                <span>Simulate Capability Degradation (Impact Loss Calc)</span>
              </button>

              {/* Quick Launch to Loss Calculator */}
              <button
                type="button"
                onClick={() => {
                  setCalcCandId(selectedCandidate.id);
                  setPlannerMode('calculator');
                  setSelectedCandidate(null);
                }}
                className="w-full py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Full Loss & Flight Risk Calculator</span>
              </button>

              {/* CFM Talent Note */}
              <div className="space-y-1.5 pt-2">
                <label className="text-slate-300 font-semibold block">
                  Career Field Manager (CFM) Strategic Note:
                </label>
                <textarea
                  rows={4}
                  value={talentNoteText}
                  onChange={e => setTalentNoteText(e.target.value)}
                  placeholder="Record retention incentives, succession alignment, or fellowship sponsorship..."
                  className="w-full p-2.5 bg-[#05080f] border border-[#1e2d45] rounded text-white text-xs focus:outline-hidden focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={handleSaveTalentNote}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save Talent Note
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedCandidate(null)}
              className="w-full py-2 bg-[#1e2d45] hover:bg-[#2d4263] text-white rounded font-medium mt-4"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
