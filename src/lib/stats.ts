/**
 * Project ORBIT - Statistics, Calibration & Mathematical Utilities
 */

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function calculateLinearSlope(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

export interface PanelistStats {
  panelistId: string;
  name: string;
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  tendency: 'Harsh' | 'Lenient' | 'Balanced';
}

export function computePanelistCalibration(
  scores: { panelistId: string; value: number; candidateId: string }[],
  panelistNames: Record<string, string> = {}
): PanelistStats[] {
  const byPanelist: Record<string, number[]> = {};

  for (const s of scores) {
    if (!byPanelist[s.panelistId]) byPanelist[s.panelistId] = [];
    byPanelist[s.panelistId].push(s.value);
  }

  // Calculate overall pool mean
  const allValues = scores.map(s => s.value);
  const poolMean = allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 8.0;

  return Object.keys(byPanelist).map(id => {
    const vals = byPanelist[id];
    const n = vals.length;
    const mean = n > 0 ? vals.reduce((a, b) => a + b, 0) / n : 0;
    const variance = n > 1 ? vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);

    let tendency: 'Harsh' | 'Lenient' | 'Balanced' = 'Balanced';
    if (mean <= poolMean - 0.4) tendency = 'Harsh';
    else if (mean >= poolMean + 0.4) tendency = 'Lenient';

    return {
      panelistId: id,
      name: panelistNames[id] || id,
      count: n,
      mean: Number(mean.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      min: Math.min(...vals),
      max: Math.max(...vals),
      tendency
    };
  });
}

export function computeZScoreNormalizedRankings(
  candidates: { id: string; scores: { panelistId: string; value: number }[] }[],
  panelistStats: Record<string, { mean: number; stdDev: number }>
): { candidateId: string; rawAvg: number; normalizedZScore: number }[] {
  return candidates.map(c => {
    const rawScores = c.scores.map(s => s.value);
    const rawAvg = rawScores.length > 0 ? rawScores.reduce((a, b) => a + b, 0) / rawScores.length : 0;

    const zScores = c.scores.map(s => {
      const stats = panelistStats[s.panelistId];
      if (!stats || stats.stdDev === 0) return 0;
      return (s.value - stats.mean) / stats.stdDev;
    });

    const normZ = zScores.length > 0 ? zScores.reduce((a, b) => a + b, 0) / zScores.length : 0;

    return {
      candidateId: c.id,
      rawAvg: Number(rawAvg.toFixed(2)),
      normalizedZScore: Number(normZ.toFixed(2))
    };
  }).sort((a, b) => b.normalizedZScore - a.normalizedZScore);
}
