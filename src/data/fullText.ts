/**
 * Project ORBIT - Full-text record documents (A-3)
 * Builds the complete documents a voter can open: the SOI, the commander's comments
 * (endorsement), and each year's appraisal. In production these come from the source
 * systems as the original documents; here they are assembled from the fictional seed record
 * so the reader works end to end. All content is fictional.
 */

import { Candidate, Endorser } from '../types';

export type DocKind = 'SOI' | 'Commander' | 'Appraisal';

export interface FullDocument {
  kind: DocKind;
  title: string;
  source: string;
  dated: string;
  author: string;
  paragraphs: string[];
}

function splitSentences(text: string, perParagraph = 3): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) ?? [text];
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    out.push(sentences.slice(i, i + perParagraph).join(' '));
  }
  return out;
}

export function buildSoi(c: Candidate): FullDocument {
  const prefs = c.soi.preferences;
  return {
    kind: 'SOI',
    title: 'Statement of Intent',
    source: 'MyVector',
    dated: c.soi.date,
    author: c.name,
    paragraphs: [
      ...splitSentences(c.soi.text),
      `Assignment preferences, in order: ${prefs.billetIds.join(', ')}. Preferred locations: ${prefs.locations.join('; ')}. Willing to serve OCONUS: ${prefs.willingOCONUS ? 'Yes' : 'No'}.`,
      `Focus areas I want the board to weigh: ${c.soi.tags.join(', ')}.`
    ]
  };
}

export function buildCommanderComments(c: Candidate, endorser: Endorser | undefined): FullDocument {
  const latest = c.performance[0];
  const rankLine =
    c.endorserRank !== null
      ? `I rank this officer #${c.endorserRank} of the officers I am endorsing to this board.`
      : 'This officer is not ranked on my endorsement list.';
  return {
    kind: 'Commander',
    title: "Commander's Comments (Endorsement)",
    source: 'MyVector (endorsement)',
    dated: c.soi.date,
    author: endorser ? `${endorser.name}, ${endorser.unit}` : 'Endorsing commander',
    paragraphs: [
      `"${c.soi.endorserQuote}"`,
      rankLine,
      latest ? `Most recent stratification: ${latest.strat} (${latest.year}).` : 'No stratification on file.',
      `Recommended for ${c.soi.tags[0]?.toLowerCase() ?? 'key'} billets where this officer's ${c.skills[0]?.cluster.toLowerCase() ?? 'technical'} skill is needed now.`
    ]
  };
}

export function buildAppraisals(c: Candidate): FullDocument[] {
  return c.performance.map((p, i) => {
    const timeline = c.timeline ?? []; // some legacy seed records carry no timeline
    const job = timeline.find(t => t.year === p.year) ?? timeline[timeline.length - 1 - i] ?? timeline[0];
    const role = job?.role ?? 'Staff officer';
    const command = job?.command ?? c.currentUnit;
    const mission = job?.missionArea ?? 'space operations';
    return {
      kind: 'Appraisal' as const,
      title: `Officer Performance Report ${p.year}`,
      source: 'ARMS / myEval',
      dated: `${p.year}-05-31`,
      author: `Rater and additional rater, ${command}`,
      paragraphs: [
        `Duty title: ${role}, ${command}. Mission area: ${mission}.`,
        `Key duties: leads ${mission.toLowerCase()} planning and execution; accountable for crew readiness, standardization, and mission assurance reporting.`,
        `Performance: delivered every assigned mission on time; ${c.ropTrend === 'Upward' ? 'performance rose sharply over the period' : c.ropTrend === 'Consistent' ? 'performance held at a high level all period' : 'performance varied across the period'}.`,
        `Stratification: ${p.strat}. Top ${p.pctTop}% of peers.`,
        `Push line: ready now for ${c.soi.tags[0]?.toLowerCase() ?? 'increased'} responsibility and developmental education.`
      ]
    };
  });
}

export interface FullRecord {
  soi: FullDocument;
  commander: FullDocument;
  appraisals: FullDocument[];
}

export function buildFullRecord(c: Candidate, endorsers: Endorser[]): FullRecord {
  return {
    soi: buildSoi(c),
    commander: buildCommanderComments(c, endorsers.find(e => e.id === c.endorserId)),
    appraisals: buildAppraisals(c)
  };
}
