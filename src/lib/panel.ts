/**
 * Project ORBIT - Panel rules (A-1 Board President, A-2 panel chat, A-5 fit reveal)
 * One place for who may score, who may chat, and when the AI fit value may be shown.
 */

import { AppState, Candidate, Role } from '../types';
import { PANELIST_PROFILES } from '../data/seed';

/** Roles that cast a vote on a record. The Board President votes as a panel member. */
export const SCORING_ROLES: ReadonlyArray<Role> = ['Panelist', 'Board President'];
/** Roles that may post in panel chat. */
export const CHAT_POST_ROLES: ReadonlyArray<Role> = ['Panelist', 'Board President'];
/** Roles that may read panel chat (posting roles plus the Board Recorder, who keeps the record). */
export const CHAT_READ_ROLES: ReadonlyArray<Role> = ['Panelist', 'Board President', 'Board Recorder'];

export const canScore = (role: Role): boolean => SCORING_ROLES.includes(role);
export const canPostChat = (role: Role): boolean => CHAT_POST_ROLES.includes(role);
export const canReadChat = (role: Role): boolean => CHAT_READ_ROLES.includes(role);

/**
 * Score key for the signed-in voter. The demo Panelist keeps the original 'USER-ME' seat
 * (seeded scores and audit examples depend on it); the Board President votes under their own ID.
 */
export function scoreKeyFor(state: Pick<AppState, 'currentRole' | 'userId'>): string {
  return state.currentRole === 'Board President' ? state.userId || 'DEV-PRES-01' : 'USER-ME';
}

/** The signed-in voter's own score on a record, or null if they have not scored it. */
export function getMyScore(c: Candidate, state: Pick<AppState, 'currentRole' | 'userId'>): number | null {
  if (state.currentRole === 'Board President') {
    const key = scoreKeyFor(state);
    return c.scores.find(s => s.panelistId === key)?.value ?? null;
  }
  return c.myScore;
}

/**
 * A-5 anti-anchoring: a voter sees the AI fit value only after scoring the record.
 * Roles that do not vote see it at all times.
 */
export function fitVisible(c: Candidate, state: Pick<AppState, 'currentRole' | 'userId'>): boolean {
  if (!canScore(state.currentRole)) return true;
  return getMyScore(c, state) !== null;
}

// Words that suggest health information. Chat is CUI-capable but PHI is prohibited (INTENT.md).
const PHI_PATTERNS: RegExp[] = [
  /\bdiagnos/i,
  /\bmedical\b/i,
  /\bmedication/i,
  /\bprescri/i,
  /\bptsd\b/i,
  /\bdepress/i,
  /\banxiety\b/i,
  /\btherap/i,
  /\bprofile\s*(code|4|p4)/i,
  /\bsurgery\b/i,
  /\bdisabilit/i,
  /\bpregnan/i
];

export function containsPossiblePhi(text: string): boolean {
  return PHI_PATTERNS.some(p => p.test(text));
}

export interface PanelistProgress {
  id: string;
  name: string;
  scored: number;
  total: number;
  avg: number | null;
  divergent: number; // scores 1.5 or more points from that record's panel average
}

/** Board President oversight: each voter's progress and divergence on this board. */
export function panelOversight(candidates: Candidate[], presidentKey: string, presidentName: string): PanelistProgress[] {
  const voters = [
    ...PANELIST_PROFILES.map(p => ({ id: p.id, name: p.name })),
    { id: 'USER-ME', name: 'Demo Panelist seat' },
    { id: presidentKey, name: `${presidentName} (President)` }
  ];
  return voters.map(v => {
    let scored = 0;
    let sum = 0;
    let divergent = 0;
    candidates.forEach(c => {
      const mine = c.scores.find(s => s.panelistId === v.id);
      if (!mine) return;
      scored += 1;
      sum += mine.value;
      const avg = c.scores.reduce((a, s) => a + s.value, 0) / c.scores.length;
      if (Math.abs(mine.value - avg) >= 1.5) divergent += 1;
    });
    return {
      id: v.id,
      name: v.name,
      scored,
      total: candidates.length,
      avg: scored > 0 ? Number((sum / scored).toFixed(2)) : null,
      divergent
    };
  });
}
