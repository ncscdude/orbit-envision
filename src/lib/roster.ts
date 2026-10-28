/**
 * Project ORBIT - Board roster rules (A-4)
 * How each board's Candidate Queue is populated. In production the BMO Lead runs these rules
 * as a MilPDS query, reviews the result, and locks the population (POPULATION_LOCK in DELTA).
 * In this demo only BRD-001 has records; other boards show their rules and an empty roster.
 */

import { Board, Candidate } from '../types';

export interface RosterRule {
  boardId: string;
  grades: Candidate['grade'][];
  looks: Candidate['lookStatus'][];
  /** Records whose PME status is listed here need BMO review instead of automatic inclusion. */
  pmeReview: Candidate['pmeStatus'][];
  /** Plain-language description of the population query. */
  query: string;
  source: string;
}

export const ROSTER_RULES: RosterRule[] = [
  {
    boardId: 'BRD-001',
    grades: ['CAPT', 'MAJ', 'LT COL'],
    looks: ['1st Look', '2nd Look', 'Below Zone'],
    pmeReview: ['SDE Complete'],
    query: 'Officers in the ILE year group window, in a space operations, intel, acquisition, or engineering DAFSC, with a current SOI on file',
    source: 'MilPDS (grade, DAFSC, DOR, look status, eligibility); MyVector (SOI on file)'
  },
  {
    boardId: 'BRD-002',
    grades: ['MAJ', 'LT COL'],
    looks: ['1st Look', '2nd Look'],
    pmeReview: [],
    query: 'Majors and lieutenant colonels in the CY26 development team window for their DAFSC',
    source: 'MilPDS; DT roster from the career field team'
  },
  {
    boardId: 'BRD-003',
    grades: ['CAPT', 'MAJ'],
    looks: ['1st Look'],
    pmeReview: [],
    query: 'Applicants who submitted a fellowship application and meet the program grade and degree rules',
    source: 'Application list (program office); MilPDS (grade, degree)'
  },
  {
    boardId: 'BRD-004',
    grades: ['CAPT', 'MAJ'],
    looks: ['1st Look', '2nd Look'],
    pmeReview: [],
    query: 'Applicants to the test course who meet the course prerequisites',
    source: 'Application list (course office); MilPDS; ARMS (qualifications)'
  }
];

export type RosterStatus = 'Included' | 'BMO review' | 'Excluded';

export interface RosterCheck {
  candidateId: string;
  status: RosterStatus;
  reasons: string[];
}

export function ruleForBoard(boardId: string): RosterRule | undefined {
  return ROSTER_RULES.find(r => r.boardId === boardId);
}

/** Applies a board's rules to one record. Pure, so the same check runs in tests and on screen. */
export function checkRecord(rule: RosterRule, c: Candidate): RosterCheck {
  const reasons: string[] = [];
  let status: RosterStatus = 'Included';
  if (!rule.grades.includes(c.grade)) {
    status = 'Excluded';
    reasons.push(`Grade ${c.grade} is outside this board`);
  }
  if (!rule.looks.includes(c.lookStatus)) {
    status = 'Excluded';
    reasons.push(`${c.lookStatus} is not considered on this board`);
  }
  if (status !== 'Excluded') {
    if (!c.packetReadiness.eligibility || c.eligibility.adverseActions !== 'None') {
      status = 'BMO review';
      reasons.push(`Eligibility: ${c.eligibility.adverseActions}`);
    }
    if (rule.pmeReview.includes(c.pmeStatus)) {
      status = 'BMO review';
      reasons.push(`PME status ${c.pmeStatus}: confirm the record still belongs on this board`);
    }
  }
  return { candidateId: c.id, status, reasons };
}

export interface RosterSummary {
  board: Board;
  rule: RosterRule | undefined;
  records: Candidate[];
  checks: RosterCheck[];
  included: number;
  review: number;
  excluded: number;
}

/** The records assigned to a board and how each one fares against that board's rules. */
export function buildRoster(board: Board, candidates: Candidate[]): RosterSummary {
  const rule = ruleForBoard(board.id);
  const records = candidates.filter(c => c.boardId === board.id);
  const checks = rule ? records.map(c => checkRecord(rule, c)) : [];
  return {
    board,
    rule,
    records,
    checks,
    included: checks.filter(c => c.status === 'Included').length,
    review: checks.filter(c => c.status === 'BMO review').length,
    excluded: checks.filter(c => c.status === 'Excluded').length
  };
}
