/**
 * Project ORBIT - Strategic Talent & Loss Calculator
 * Quantifies flight risk drivers, financial replacement costs, vacancy duration,
 * and comparative peer attrition risk for post-board talent management.
 */

import { Candidate, Billet, Tri } from '../types';

export interface LossCostBreakdown {
  trainingPipeline: number;     // Initial specialized training amortization (Space Ops, Cyber, Acq)
  clearanceReinvest: number;    // TS/SCI + SAP reinvestment & polygraph backlog
  vacancyLag: number;           // Productivity gap during 6-18 month backfill
  recruiterAcquisition: number; // Lateral talent acquisition & lateral onboarding
  totalEstimatedCost: number;   // Total financial exposure
}

export interface FlightRiskFactor {
  id: string;
  factor: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  marketEvidence: string;
}

export interface CandidateLossProfile {
  candidateId: string;
  name: string;
  grade: string;
  dafsc: string;
  riskOfLoss: Tri;
  impactOfLoss: Tri;
  flightRiskScore: number; // 0 to 100
  cohortRiskRank: number;   // e.g. #2 out of 36
  cohortTotal: number;
  percentileRisk: number;  // e.g. 94th percentile
  costBreakdown: LossCostBreakdown;
  timeToBackfillMonths: number;
  riskFactors: FlightRiskFactor[];
  successionExposure: {
    isCriticalSuccessor: boolean;
    billetTitle?: string;
    billetUnit?: string;
    criticalityNotice: string;
  };
}

/**
 * Calculates the comprehensive financial and operational loss exposure for a candidate.
 */
export function calculateCandidateLossProfile(
  candidate: Candidate,
  allCandidates: Candidate[],
  billets: Billet[]
): CandidateLossProfile {
  // 1. Specialized Pipeline Cost by DAFSC & Certifications
  let baseTraining = 420000;
  if (candidate.dafsc.startsWith('13S')) {
    baseTraining = 780000; // Space Operations Undergraduate + Mission Qualification
  } else if (candidate.dafsc.startsWith('17S')) {
    baseTraining = 650000; // Cyber Warfare Operations + Specialty Certs
  } else if (candidate.dafsc.startsWith('63A') || candidate.dafsc.startsWith('61C')) {
    baseTraining = 520000; // Advanced Space Systems Acquisition & Engineering
  } else if (candidate.dafsc.startsWith('14N')) {
    baseTraining = 480000; // Space Intelligence & Special Access Programs
  }

  // Rare skills multiplier
  const hasRareSkills = candidate.skills.some(s => s.rarity >= 0.7 && s.proficiency >= 85);
  if (hasRareSkills) {
    baseTraining += 140000;
  }

  // 2. Clearance Reinvestment & SAP
  const clearanceReinvest = 95000; // TS/SCI reinvestigation, Special Access Program briefing, CI Polygraph

  // 3. Vacancy Duration & Productivity Lag
  let timeToBackfill = 9; // months
  if (candidate.grade === 'LT COL' || candidate.grade === 'SMSGT') {
    timeToBackfill = 14;
  } else if (candidate.grade === 'MAJ') {
    timeToBackfill = 11;
  }
  if (hasRareSkills) {
    timeToBackfill += 3;
  }

  // Monthly productivity value ~$22,000
  const vacancyLag = timeToBackfill * 22000;

  // 4. Lateral Recruiter / Succession Acquisition
  const recruiterAcquisition = 65000;

  const totalEstimatedCost = baseTraining + clearanceReinvest + vacancyLag + recruiterAcquisition;

  // 5. Flight Risk Score (0-100) based on market demand, TIG, look status, and SOI friction
  let riskScore = 40;
  const factors: FlightRiskFactor[] = [];

  // Market demand factor
  if (candidate.dafsc.startsWith('17S') || candidate.dafsc.startsWith('13S') || candidate.dafsc.startsWith('63A')) {
    riskScore += 25;
    factors.push({
      id: 'market-demand',
      factor: 'High Commercial Aerospace / Defense Tech Pull',
      severity: 'High',
      description: `${candidate.dafsc} skillset is heavily recruited by private defense tech firms offering 1.8x-2.4x compensation premiums.`,
      marketEvidence: 'Space Systems / Cyber specialists face active commercial recruitment pressure in Denver, El Segundo, and Colorado Springs.'
    });
  }

  // TIG Stagnation Factor (e.g. > 4 years in grade)
  const tigYears = parseFloat(candidate.tig.split('y')[0]) || 3;
  if (tigYears >= 4.0) {
    riskScore += 18;
    factors.push({
      id: 'tig-stagnation',
      factor: `Elevated Time in Grade (${candidate.tig})`,
      severity: 'High',
      description: `Has spent ${candidate.tig} in current grade without selection gate advancement; flight hazard increases sharply past 4.0 years.`,
      marketEvidence: 'Historical ETMO records indicate a 32% rise in voluntary separation requests past 42 months in grade.'
    });
  }

  // Look Status Factor
  if (candidate.lookStatus === '2nd Look') {
    riskScore += 12;
    factors.push({
      id: 'promotion-look',
      factor: '2nd Promotion Look Tension',
      severity: 'Medium',
      description: 'Second-look status creates acute career trajectory uncertainty if not slated for competitive command or key staff.',
      marketEvidence: 'Mid-career retention drops when second-look officers perceive lack of institutional succession backing.'
    });
  }

  // Stated Preference Mismatch
  if (candidate.soi.preferences.locations.length > 0) {
    riskScore += 8;
    factors.push({
      id: 'geo-friction',
      factor: 'Geographic Assignment Preference Friction',
      severity: 'Medium',
      description: `Candidate expressed strict desire for ${candidate.soi.preferences.locations.join(', ')}. Slating outside preferred corridors elevates separation probability.`,
      marketEvidence: 'Family geographic stability is cited in 58% of voluntary separation survey responses.'
    });
  }

  // Performance Top Tier
  if (candidate.talent?.impactOfLoss === 'High') {
    riskScore += 10;
  }

  riskScore = Math.min(96, Math.max(22, riskScore));

  // 6. Succession Exposure: Check if candidate is primary successor to critical billets
  const criticalBillets = billets.filter(b => b.priority === 'Critical');
  let matchedBilletTitle: string | undefined;
  let matchedBilletUnit: string | undefined;
  let isCritical = false;

  for (const b of criticalBillets) {
    const hasDafsc = b.dafscRequired.includes(candidate.dafsc);
    if (hasDafsc) {
      isCritical = true;
      matchedBilletTitle = b.title;
      matchedBilletUnit = b.unit;
      break;
    }
  }

  const successionExposure = {
    isCriticalSuccessor: isCritical,
    billetTitle: matchedBilletTitle,
    billetUnit: matchedBilletUnit,
    criticalityNotice: isCritical
      ? `Primary succession pipeline candidate for Critical Billet: ${matchedBilletTitle} (${matchedBilletUnit}). Departure would leave this command billet unslated.`
      : 'Standard bench depth available across sister units.'
  };

  // 7. Comparative Cohort Ranking
  // Calculate risk scores for all candidates to get relative percentile
  const allScores = allCandidates.map(c => {
    let s = 40;
    if (c.dafsc.startsWith('17S') || c.dafsc.startsWith('13S') || c.dafsc.startsWith('63A')) s += 25;
    const ty = parseFloat(c.tig.split('y')[0]) || 3;
    if (ty >= 4.0) s += 18;
    if (c.lookStatus === '2nd Look') s += 12;
    if (c.talent?.impactOfLoss === 'High') s += 10;
    return { id: c.id, score: Math.min(96, Math.max(22, s)) };
  }).sort((a, b) => b.score - a.score);

  const myRankIdx = allScores.findIndex(s => s.id === candidate.id);
  const cohortRiskRank = myRankIdx >= 0 ? myRankIdx + 1 : 1;
  const percentileRisk = Math.round(((allCandidates.length - cohortRiskRank) / allCandidates.length) * 100);

  return {
    candidateId: candidate.id,
    name: candidate.name,
    grade: candidate.grade,
    dafsc: candidate.dafsc,
    riskOfLoss: candidate.talent?.riskOfLoss || (riskScore >= 70 ? 'High' : riskScore >= 50 ? 'Medium' : 'Low'),
    impactOfLoss: candidate.talent?.impactOfLoss || 'Medium',
    flightRiskScore: riskScore,
    cohortRiskRank,
    cohortTotal: allCandidates.length,
    percentileRisk,
    costBreakdown: {
      trainingPipeline: baseTraining,
      clearanceReinvest,
      vacancyLag,
      recruiterAcquisition,
      totalEstimatedCost
    },
    timeToBackfillMonths: timeToBackfill,
    riskFactors: factors,
    successionExposure
  };
}

/**
 * Simulates the effect of targeted retention interventions on a candidate's flight risk score and preserved value.
 */
export function simulateRetentionMitigation(
  baseProfile: CandidateLossProfile,
  activeMitigations: string[]
): {
  revisedRiskScore: number;
  revisedRiskTier: Tri;
  preservedValue: number;
  mitigationEffectivenessPct: number;
} {
  let reduction = 0;

  if (activeMitigations.includes('csrb_bonus')) {
    reduction += 26; // Targeted Critical Skills Retention Bonus ($35k/yr)
  }
  if (activeMitigations.includes('soi_slating')) {
    reduction += 22; // Priority slating to #1 SOI preference location
  }
  if (activeMitigations.includes('fellowship_sde')) {
    reduction += 18; // In-residence SDE / fellowship sponsorship
  }
  if (activeMitigations.includes('joint_acceleration')) {
    reduction += 14; // Joint duty assignment track fast-lane
  }

  const revisedRiskScore = Math.max(18, baseProfile.flightRiskScore - reduction);
  const revisedRiskTier: Tri = revisedRiskScore >= 70 ? 'High' : revisedRiskScore >= 45 ? 'Medium' : 'Low';
  const mitigationEffectivenessPct = Math.round((reduction / baseProfile.flightRiskScore) * 100);
  const preservedValue = Math.round(baseProfile.costBreakdown.totalEstimatedCost * (reduction / 100));

  return {
    revisedRiskScore,
    revisedRiskTier,
    preservedValue,
    mitigationEffectivenessPct
  };
}

export interface MissionReadinessAreaImpact {
  area: string;
  baselinePct: number;
  degradedPct: number;
  lossPct: number;
  severity: 'Severe' | 'Moderate' | 'Minor';
  description: string;
}

export interface CapabilityDegradationSummary {
  candidateId: string;
  name: string;
  grade: string;
  dafsc: string;
  isKeyTalent: boolean;
  m601RiskScore: number;
  m602ImpactScore: number;
  m601RiskTier: Tri;
  m602ImpactTier: Tri;
  overallDegradationPct: number;
  compositeCalculationFormula: string;
  primaryMissionImpacted: string;
  missionReadinessImpacts: MissionReadinessAreaImpact[];
  vacatedBillet?: {
    id: string;
    title: string;
    unit: string;
    priority: 'Critical' | 'High' | 'Routine';
  };
  lostSkills: { cluster: string; proficiency: number; rarity: number }[];
  slatingDisruptionCount: number;
  downstreamSuccessionGap: string;
  replacementLeadTimeDays: number;
}

export interface CohortLossAverages {
  avgFlightRiskScore: number;
  avgImpactScore: number;
  avgReplacementCost: number;
  avgBackfillMonths: number;
  avgDegradationPct: number;
  totalKeyTalentCount: number;
  totalOfficers: number;
}

/**
 * Computes cohort-wide loss averages to power comparative risk analysis.
 */
export function computeCohortAverages(
  candidates: Candidate[],
  billets: Billet[]
): CohortLossAverages {
  const profiles = candidates.map(c => calculateCandidateLossProfile(c, candidates, billets));

  const totalCost = profiles.reduce((acc, p) => acc + p.costBreakdown.totalEstimatedCost, 0);
  const totalRisk = profiles.reduce((acc, p) => acc + p.flightRiskScore, 0);
  const totalMonths = profiles.reduce((acc, p) => acc + p.timeToBackfillMonths, 0);
  const totalImpact = candidates.reduce((acc, c) => {
    const val = c.talent?.impactOfLoss === 'High' ? 88 : c.talent?.impactOfLoss === 'Medium' ? 55 : 25;
    return acc + val;
  }, 0);

  const totalDegradation = candidates.reduce((acc, c) => {
    const hasRare = c.skills.some(s => s.rarity >= 0.7);
    const base = c.talent?.impactOfLoss === 'High' ? 16 : c.talent?.impactOfLoss === 'Medium' ? 8 : 4;
    return acc + (hasRare ? base + 4 : base);
  }, 0);

  const n = Math.max(1, candidates.length);
  const keyTalentCount = candidates.filter(c => c.talent?.nBoxCell === 'Key Talent').length;

  return {
    avgFlightRiskScore: Math.round(totalRisk / n),
    avgImpactScore: Math.round(totalImpact / n),
    avgReplacementCost: Math.round(totalCost / n),
    avgBackfillMonths: parseFloat((totalMonths / n).toFixed(1)),
    avgDegradationPct: parseFloat((totalDegradation / n).toFixed(1)),
    totalKeyTalentCount: keyTalentCount,
    totalOfficers: candidates.length
  };
}

/**
 * Calculates specific capability degradation metrics (M-601/M-602) if an officer is removed from roster.
 */
export function calculateCapabilityDegradation(
  candidate: Candidate,
  allCandidates: Candidate[],
  billets: Billet[]
): CapabilityDegradationSummary {
  const profile = calculateCandidateLossProfile(candidate, allCandidates, billets);
  const isKeyTalent = candidate.talent?.nBoxCell === 'Key Talent' || candidate.talent?.impactOfLoss === 'High';

  // Quantitative Impact score (0-100) based on M-602
  let impactScore = 50;
  if (candidate.talent?.impactOfLoss === 'High') impactScore = 88;
  else if (candidate.talent?.impactOfLoss === 'Medium') impactScore = 58;
  else impactScore = 30;

  // Add weight for rare skills and certifications
  const rareSkills = candidate.skills.filter(s => s.rarity >= 0.6 || s.proficiency >= 85);
  impactScore = Math.min(98, impactScore + rareSkills.length * 3);

  // Overall Enterprise Capability Degradation Index
  let degradationPct = candidate.talent?.impactOfLoss === 'High' ? 17.5 : 8.5;
  if (isKeyTalent) degradationPct += 5.5;
  if (profile.successionExposure.isCriticalSuccessor) degradationPct += 4.5;

  // Primary Mission Area Impacted
  let primaryMission = 'General Enterprise Staff Operations';
  if (candidate.dafsc.startsWith('13S')) {
    primaryMission = `${candidate.currentUnit || 'SpOC Delta 9'} Combat Orbital Operations & Space Domain Awareness`;
  } else if (candidate.dafsc.startsWith('17S')) {
    primaryMission = `${candidate.currentUnit || 'Space Delta 6'} Defensive Cyber Operations & Mission C2 Security`;
  } else if (candidate.dafsc.startsWith('63A')) {
    primaryMission = `${candidate.currentUnit || 'SSC'} Next-Generation Space Vehicle Acquisition & Payload Slating`;
  } else if (candidate.dafsc.startsWith('14N')) {
    primaryMission = `${candidate.currentUnit || 'USSPACECOM J2'} Space Threat Warning & Counterspace Intelligence`;
  }

  // 4 Mission Readiness Area Impacts
  const primaryDeg = parseFloat(degradationPct.toFixed(1));
  const missionReadinessImpacts: MissionReadinessAreaImpact[] = [
    {
      area: candidate.dafsc.startsWith('13S')
        ? 'Combat Orbital Warfare & Maneuver Operations'
        : candidate.dafsc.startsWith('17S')
        ? 'Defensive Cyber Operations & Satellite C2'
        : candidate.dafsc.startsWith('63A')
        ? 'NextGen Space Acquisition & Payload Slating'
        : 'Space Domain Awareness & Threat Warning',
      baselinePct: 94,
      degradedPct: Math.max(50, 94 - primaryDeg),
      lossPct: primaryDeg,
      severity: primaryDeg >= 18 ? 'Severe' : primaryDeg >= 10 ? 'Moderate' : 'Minor',
      description: `Direct loss of senior rated ${candidate.dafsc} qualified crew lead in active operational line.`
    },
    {
      area: 'Enterprise Squadron/Delta Leadership Bench Depth',
      baselinePct: 88,
      degradedPct: Math.max(55, 88 - (isKeyTalent ? 18 : 10)),
      lossPct: isKeyTalent ? 18 : 10,
      severity: isKeyTalent ? 'Severe' : 'Moderate',
      description: 'Collapses primary command succession pipeline for the next 2 promotional cycles.'
    },
    {
      area: 'Joint Staff & Allied Coalition Interoperability',
      baselinePct: 91,
      degradedPct: Math.max(65, 91 - (candidate.jointTours > 0 ? 15 : 6)),
      lossPct: candidate.jointTours > 0 ? 15 : 6,
      severity: candidate.jointTours > 0 ? 'Moderate' : 'Minor',
      description: 'Breaks continuity with combatant command joint planning cells and inter-agency coordination.'
    },
    {
      area: 'Technical Mentorship & Crew Re-Certification Throughput',
      baselinePct: 86,
      degradedPct: Math.max(60, 86 - 12),
      lossPct: 12,
      severity: 'Moderate',
      description: 'Depresses crew commander upgrade pipeline by 4-6 months due to loss of certified instructor.'
    }
  ];

  const m601RiskTier = profile.riskOfLoss;
  const m602ImpactTier = candidate.talent?.impactOfLoss || 'Medium';
  const compositeFormula = `Degradation Index = [0.65 × M-602 (${impactScore}) + 0.35 × M-601 (${profile.flightRiskScore})] × Scarcity (${isKeyTalent ? '1.35x' : '1.10x'}) = -${degradationPct.toFixed(1)}%`;
  const matchingBillet = billets.find(b => b.dafscRequired.includes(candidate.dafsc));

  return {
    candidateId: candidate.id,
    name: candidate.name,
    grade: candidate.grade,
    dafsc: candidate.dafsc,
    isKeyTalent,
    m601RiskScore: profile.flightRiskScore,
    m602ImpactScore: impactScore,
    m601RiskTier,
    m602ImpactTier,
    overallDegradationPct: primaryDeg,
    compositeCalculationFormula: compositeFormula,
    primaryMissionImpacted: primaryMission,
    missionReadinessImpacts,
    vacatedBillet: matchingBillet
      ? {
          id: matchingBillet.id,
          title: matchingBillet.title,
          unit: matchingBillet.unit,
          priority: matchingBillet.priority
        }
      : undefined,
    lostSkills: rareSkills,
    slatingDisruptionCount: isKeyTalent ? 4 : 2,
    downstreamSuccessionGap: profile.successionExposure.isCriticalSuccessor
      ? `Critical command succession vacuum: No qualified ${candidate.dafsc} backfill ready in <12 months.`
      : 'Lateral rotation feasible with 3-6 month cross-training delta.',
    replacementLeadTimeDays: profile.timeToBackfillMonths * 30
  };
}

