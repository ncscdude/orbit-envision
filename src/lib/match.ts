/**
 * Project ORBIT - Match Lab Engine & Sensitivity Simulator
 */

import { Candidate, Billet, MatchPair, MatchScenarioWeights } from '../types';
import { cosineSimilarity } from './stats';

export const DEFAULT_WEIGHTS: MatchScenarioWeights = {
  oomRank: 0.60,
  soiOverlap: 0.25,
  skillFit: 0.0,
  dafscGradeFit: 0.15,
  candidatePref: 0.0,
  billetPriority: 0.0
};

export interface MatchScoreComponents {
  oomScore: number;
  soiScore: number;
  skillScore: number;
  dafscGradeScore: number;
  candidatePrefScore: number;
  billetPriorityScore: number;
  totalScore: number;
  constraintsPassed: boolean;
  failedConstraintReason?: string;
  matchedTags: string[];
}

export function computeCandidateScore(
  cand: Candidate,
  billet: Billet,
  weights: MatchScenarioWeights,
  totalCandidatePoolCount: number,
  candidateOomRank: number // 1 to N
): MatchScoreComponents {
  // 1. Hard constraints check: DAFSC & Grade
  const dafscMatch = billet.dafscRequired.includes(cand.dafsc) || billet.dafscRequired.length === 0;
  // Grade compatibility
  const gradeLevels: Record<string, number> = { 'CAPT': 3, 'MAJ': 4, 'LT COL': 5, 'MSGT': 7, 'SMSGT': 8 };
  const candLevel = gradeLevels[cand.grade] || 4;
  const minLevel = gradeLevels[billet.gradeRange[0]] || 3;
  const maxLevel = gradeLevels[billet.gradeRange[1]] || 5;
  const gradeMatch = candLevel >= minLevel && candLevel <= maxLevel;

  const constraintsPassed = dafscMatch && gradeMatch;
  let failedConstraintReason: string | undefined;
  if (!dafscMatch) failedConstraintReason = `DAFSC ${cand.dafsc} not in required ${billet.dafscRequired.join('/')}`;
  else if (!gradeMatch) failedConstraintReason = `Grade ${cand.grade} outside billet range ${billet.gradeRange.join('-')}`;

  // 2. Component scores (0 to 100)
  // OoM score: higher rank gets higher score
  const oomScore = Math.max(0, 100 - ((candidateOomRank - 1) / Math.max(1, totalCandidatePoolCount - 1)) * 70);

  // SOI tag overlap
  const matchedTags = cand.soi.tags.filter(t => billet.preferredTags.includes(t));
  const soiScore = billet.preferredTags.length > 0
    ? (matchedTags.length / billet.preferredTags.length) * 100
    : 70;

  // Skill fit via vector cosine similarity
  const cosine = cosineSimilarity(cand.skillVector, billet.skillVector);
  const skillScore = Math.round(Math.max(0, cosine) * 100);

  // DAFSC & Grade fit score
  const dafscGradeScore = constraintsPassed ? 100 : (dafscMatch || gradeMatch ? 45 : 10);

  // Candidate stated preference
  const prefIndex = cand.soi.preferences.billetIds.indexOf(billet.id);
  let candidatePrefScore = 20;
  if (prefIndex === 0) candidatePrefScore = 100;
  else if (prefIndex === 1) candidatePrefScore = 80;
  else if (prefIndex === 2) candidatePrefScore = 60;
  else if (cand.soi.preferences.willingOCONUS && billet.oconus) candidatePrefScore += 20;

  // Billet priority weight
  let billetPriorityScore = 50;
  if (billet.priority === 'Critical') billetPriorityScore = 100;
  else if (billet.priority === 'High') billetPriorityScore = 80;
  else billetPriorityScore = 60;

  // Normalize weights sum
  const sumWeights =
    weights.oomRank +
    weights.soiOverlap +
    weights.skillFit +
    weights.dafscGradeFit +
    weights.candidatePref +
    weights.billetPriority;

  const totalScore = sumWeights > 0
    ? (
        oomScore * weights.oomRank +
        soiScore * weights.soiOverlap +
        skillScore * weights.skillFit +
        dafscGradeScore * weights.dafscGradeFit +
        candidatePrefScore * weights.candidatePref +
        billetPriorityScore * weights.billetPriority
      ) / sumWeights
    : 0;

  return {
    oomScore: Math.round(oomScore),
    soiScore: Math.round(soiScore),
    skillScore: Math.round(skillScore),
    dafscGradeScore: Math.round(dafscGradeScore),
    candidatePrefScore: Math.round(candidatePrefScore),
    billetPriorityScore: Math.round(billetPriorityScore),
    totalScore: Math.round(totalScore * 10) / 10,
    constraintsPassed,
    failedConstraintReason,
    matchedTags
  };
}

export function generateAllCandidateBilletScores(
  candidates: Candidate[],
  billets: Billet[],
  weights: MatchScenarioWeights
): Record<string, Record<string, MatchScoreComponents>> {
  // Sort candidates by OoM first
  const sorted = [...candidates].sort((a, b) => {
    const avgA = a.scores.length > 0 ? a.scores.reduce((s, x) => s + x.value, 0) / a.scores.length : a.mScore;
    const avgB = b.scores.length > 0 ? b.scores.reduce((s, x) => s + x.value, 0) / b.scores.length : b.mScore;
    return avgB - avgA;
  });

  const oomRanks: Record<string, number> = {};
  sorted.forEach((c, idx) => {
    oomRanks[c.id] = idx + 1;
  });

  const matrix: Record<string, Record<string, MatchScoreComponents>> = {};

  for (const b of billets) {
    matrix[b.id] = {};
    for (const c of candidates) {
      matrix[b.id][c.id] = computeCandidateScore(c, b, weights, candidates.length, oomRanks[c.id]);
    }
  }

  return matrix;
}

export function computeSensitivityHolds(
  candidates: Candidate[],
  billets: Billet[],
  baseWeights: MatchScenarioWeights,
  matches: MatchPair[],
  iterations = 200
): Record<string, number> {
  const matchHoldCounts: Record<string, number> = {};
  matches.forEach(m => (matchHoldCounts[`${m.candidateId}_${m.billetId}`] = 0));

  for (let iter = 0; iter < iterations; iter++) {
    // Perturb weights by +/- 10%
    const perturb = (w: number) => Math.max(0.01, w * (0.90 + Math.random() * 0.20));
    const perturbedWeights: MatchScenarioWeights = {
      oomRank: perturb(baseWeights.oomRank),
      soiOverlap: perturb(baseWeights.soiOverlap),
      skillFit: perturb(baseWeights.skillFit),
      dafscGradeFit: perturb(baseWeights.dafscGradeFit),
      candidatePref: perturb(baseWeights.candidatePref),
      billetPriority: perturb(baseWeights.billetPriority)
    };

    const matrix = generateAllCandidateBilletScores(candidates, billets, perturbedWeights);

    // Check which matches would hold if assigned greedily by OoM under these perturbed weights
    const assignedBillets = new Set<string>();
    const assignedCandidates = new Set<string>();

    for (const m of matches) {
      const bScores = matrix[m.billetId];
      if (!bScores) continue;

      let topCand = '';
      let topScore = -1;

      for (const [candId, scoreComp] of Object.entries(bScores)) {
        if (assignedCandidates.has(candId)) continue;
        if (scoreComp.totalScore > topScore) {
          topScore = scoreComp.totalScore;
          topCand = candId;
        }
      }

      if (topCand === m.candidateId && !assignedBillets.has(m.billetId)) {
        matchHoldCounts[`${m.candidateId}_${m.billetId}`] =
          (matchHoldCounts[`${m.candidateId}_${m.billetId}`] || 0) + 1;
      }
      assignedBillets.add(m.billetId);
      assignedCandidates.add(m.candidateId);
    }
  }

  const fragilityPercents: Record<string, number> = {};
  matches.forEach(m => {
    const key = `${m.candidateId}_${m.billetId}`;
    const holds = matchHoldCounts[key] || 0;
    fragilityPercents[key] = Math.round((holds / iterations) * 100);
  });

  return fragilityPercents;
}

export interface NearFitResult {
  candidate: Candidate;
  billet: Billet;
  gapType: 'DAFSC' | 'Grade' | 'Skill';
  gapDescription: string;
  gapSeverity: 'Minor' | 'Moderate';
  recommendedClosingAction: string;
}

export function findNearFitCandidates(candidates: Candidate[], billets: Billet[]): NearFitResult[] {
  const results: NearFitResult[] = [];

  for (const b of billets) {
    for (const c of candidates) {
      const dafscMatch = b.dafscRequired.includes(c.dafsc);
      const gradeLevels: Record<string, number> = { 'CAPT': 3, 'MAJ': 4, 'LT COL': 5, 'MSGT': 7, 'SMSGT': 8 };
      const candLevel = gradeLevels[c.grade] || 4;
      const minLevel = gradeLevels[b.gradeRange[0]] || 3;
      const maxLevel = gradeLevels[b.gradeRange[1]] || 5;
      const gradeMatch = candLevel >= minLevel && candLevel <= maxLevel;

      if (!dafscMatch && gradeMatch) {
        // Near fit: DAFSC slightly divergent but skill is high
        const skillCos = cosineSimilarity(c.skillVector, b.skillVector);
        if (skillCos >= 0.70) {
          results.push({
            candidate: c,
            billet: b,
            gapType: 'DAFSC',
            gapDescription: `Candidate holds ${c.dafsc}; billet prefers ${b.dafscRequired.join('/')}`,
            gapSeverity: 'Minor',
            recommendedClosingAction: `Space Warfighter lateral cross-utilization or 30-day orientation course closing delta (${Math.round(skillCos * 100)}% skill alignment)`
          });
        }
      } else if (!gradeMatch && dafscMatch) {
        if (candLevel === minLevel - 1) {
          results.push({
            candidate: c,
            billet: b,
            gapType: 'Grade',
            gapDescription: `${c.grade} is 1 grade below required range ${b.gradeRange.join('-')}`,
            gapSeverity: 'Moderate',
            recommendedClosingAction: `Billet grade waiver or early-promotion look assignment recommendation`
          });
        }
      }
    }
  }

  return results.slice(0, 6);
}

export interface SupplyRiskItem {
  billet: Billet;
  qualifiedCount: number;
  criticality: 'Critical' | 'High' | 'Routine';
  supplyStatus: 'Thin' | 'Adequate' | 'Healthy';
  cascadeIfDeclines: {
    firstAlternateId: string;
    firstAlternateName: string;
    scoreDelta: number;
  } | null;
}

export function computeSupplyRisks(
  billets: Billet[],
  candidates: Candidate[],
  matrix: Record<string, Record<string, MatchScoreComponents>>,
  currentMatches: MatchPair[]
): SupplyRiskItem[] {
  return billets.map(b => {
    const bScores = matrix[b.id] || {};
    const qualified = candidates.filter(c => {
      const comp = bScores[c.id];
      return comp && comp.constraintsPassed && comp.totalScore >= 60;
    });

    const currentMatch = currentMatches.find(m => m.billetId === b.id);
    let cascade: SupplyRiskItem['cascadeIfDeclines'] = null;

    if (currentMatch) {
      const currentScore = bScores[currentMatch.candidateId]?.totalScore || 70;
      const alternates = qualified
        .filter(c => c.id !== currentMatch.candidateId)
        .sort((a, b) => (bScores[b.id]?.totalScore || 0) - (bScores[a.id]?.totalScore || 0));

      if (alternates.length > 0) {
        const first = alternates[0];
        const altScore = bScores[first.id]?.totalScore || 0;
        cascade = {
          firstAlternateId: first.id,
          firstAlternateName: first.name,
          scoreDelta: Number((altScore - currentScore).toFixed(1))
        };
      }
    }

    const count = qualified.length;
    let supplyStatus: 'Thin' | 'Adequate' | 'Healthy' = 'Healthy';
    if (count <= 2) supplyStatus = 'Thin';
    else if (count <= 4) supplyStatus = 'Adequate';

    return {
      billet: b,
      qualifiedCount: count,
      criticality: b.priority,
      supplyStatus,
      cascadeIfDeclines: cascade
    };
  });
}
