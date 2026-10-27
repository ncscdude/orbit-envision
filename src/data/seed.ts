/**
 * Project ORBIT - Seed Data Generator
 * Mulberry32 PRNG Reproducible Seed
 * 36 candidates, 13 board cycles, 12 billets, 6 panelists, 8 endorsers, 4 source pipelines
 */

import {
  Candidate,
  Billet,
  Board,
  Milestone,
  Risk,
  SourcePipeline,
  Endorser,
  StaffSlot,
  CommanderAction,
  ImprovementAction,
  CanonicalFileRecord,
  StageGate
} from '../types';

// Mulberry32 deterministic PRNG
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(19820514);

// Fictional dev identities for the local identity adapter (INTENT-001).
// Roles are not stored here; they come from the role table in src/auth/roleMap.ts.
export const DEV_USERS_SEED: { userId: string; displayName: string }[] = [
  { userId: 'DEV-BMO-01', displayName: 'Col Vance (BMO Lead)' },
  { userId: 'DEV-PANEL-01', displayName: 'Col Marcus Vance (Chair)' },
  { userId: 'DEV-REC-01', displayName: 'MSgt Daniel Rivera (Recorder)' },
  { userId: 'DEV-ASG-01', displayName: 'Lt Col David Sterling (Assignments)' },
  { userId: 'DEV-HQ-01', displayName: 'Maj Gen Travis Hayes (HQ Strategic)' },
  { userId: 'DEV-CFM-01', displayName: 'Col Valerie Vance (Career Planner)' },
  { userId: 'DEV-NOROLE-01', displayName: 'Capt Avery Quinn (Unmapped)' } // deliberately has no role
];

export const PANELIST_PROFILES = [
  { id: 'PANEL-01', name: 'Col Marcus Vance', role: 'Chair / Senior Evaluator' },
  { id: 'PANEL-02', name: 'Lt Col Elena Rostova', role: 'Orbital Ops Specialist' }, // Tends harsh
  { id: 'PANEL-03', name: 'Lt Col David Sterling', role: 'Acquisition & Cyber Lead' }, // Tends lenient
  { id: 'PANEL-04', name: 'Maj Sarah Lin', role: 'Intelligence / Strike Evaluator' },
  { id: 'PANEL-05', name: 'Maj Kevin O’Connor', role: 'Tactical Space C2 Lead' },
  { id: 'PANEL-06', name: 'Lt Col Rachel Hayes', role: 'Joint Space Staff Rep' }
];

export const SOURCE_PIPELINES_SEED: SourcePipeline[] = [
  { id: 'ARMS', authoritativeSource: 'Aviation Resource Management (ARMS)', lastSyncAt: '2026-10-26T14:30:00Z' }, // 5h ago (fresh)
  { id: 'MilPDS', authoritativeSource: 'Military Personnel Data System (MilPDS)', lastSyncAt: '2026-10-25T11:00:00Z' }, // 32h ago (amber > 24h)
  { id: 'MyVector', authoritativeSource: 'MyVector Talent Marketplace', lastSyncAt: '2026-10-26T19:10:00Z' }, // 10m ago (fresh)
  { id: 'SURF', authoritativeSource: 'Single Unified Record File (SURF)', lastSyncAt: '2026-10-18T08:00:00Z' } // 8.5 days ago (red > 7 days)
];

export const ENDORSERS_SEED: Endorser[] = [
  { id: 'END-01', name: 'Brig Gen Thomas K. Burke', unit: 'SpOC Delta 9', top3SharePct: 18, stratMix: { dpPct: 29, pPct: 53, nonStratPct: 18 } },
  { id: 'END-02', name: 'Col Valerie Vance', unit: 'USSPACECOM J3', top3SharePct: 52, stratMix: { dpPct: 45, pPct: 45, nonStratPct: 10 } }, // High top-3 placer!
  { id: 'END-03', name: 'Col Nathan Drake', unit: 'SSC Acquisition Delta', top3SharePct: 20, stratMix: { dpPct: 25, pPct: 58, nonStratPct: 17 } },
  { id: 'END-04', name: 'Col Samantha Reed', unit: 'Space Delta 6 (Cyber)', top3SharePct: 22, stratMix: { dpPct: 30, pPct: 52, nonStratPct: 18 } },
  { id: 'END-05', name: 'Col Richard Tanaka', unit: 'Space Delta 4 (MW)', top3SharePct: 16, stratMix: { dpPct: 28, pPct: 54, nonStratPct: 18 } },
  { id: 'END-06', name: 'Brig Gen Arthur Vance', unit: 'HQSF S3/5', top3SharePct: 19, stratMix: { dpPct: 32, pPct: 50, nonStratPct: 18 } },
  { id: 'END-07', name: 'Col Dana Mercer', unit: 'Space Delta 8 (SATCOM)', top3SharePct: 17, stratMix: { dpPct: 27, pPct: 55, nonStratPct: 18 } },
  { id: 'END-08', name: 'Col Gary Thorne', unit: 'STARCOM 392d CTS', top3SharePct: 21, stratMix: { dpPct: 26, pPct: 56, nonStratPct: 18 } }
];

export const BOARDS_SEED: Board[] = [
  { id: 'BRD-001', name: 'ILE AY 26-27 - Panel 1', status: 'On Track', startDate: '2026-11-02', lockDate: '2026-11-09', releaseDate: '2026-11-20', ownerId: 'BMO-LEAD', candidateCount: 36 },
  { id: 'BRD-002', name: 'CY26 O4/O5 DT Scoring', status: 'At Risk', startDate: '2026-11-16', lockDate: '2026-11-23', releaseDate: '2026-12-04', ownerId: 'BMO-LEAD', candidateCount: 28 },
  { id: 'BRD-003', name: 'DARPA SCFP Selection', status: 'Delayed', startDate: '2026-10-15', lockDate: '2026-10-22', releaseDate: '2026-11-06', ownerId: 'BMO-LEAD', candidateCount: 18 },
  { id: 'BRD-004', name: 'Space Test Course Selection', status: 'Complete', startDate: '2026-09-01', lockDate: '2026-09-10', releaseDate: '2026-09-25', ownerId: 'BMO-LEAD', candidateCount: 24 },
  // Portfolio cycles (computed on screen from status)
  { id: 'BRD-005', name: 'CY26 SDE Central Selection Board', status: 'On Track', startDate: '2026-12-01', lockDate: '2026-12-10', releaseDate: '2026-12-22', ownerId: 'BMO-LEAD', candidateCount: 42 },
  { id: 'BRD-006', name: 'Space Squadron Command Board', status: 'At Risk', startDate: '2027-01-11', lockDate: '2027-01-20', releaseDate: '2027-02-05', ownerId: 'BMO-LEAD', candidateCount: 50 },
  { id: 'BRD-007', name: 'CY27 Astronaut & Test Pilot Nom', status: 'On Track', startDate: '2027-02-08', lockDate: '2027-02-18', releaseDate: '2027-03-01', ownerId: 'BMO-LEAD', candidateCount: 14 },
  { id: 'BRD-008', name: 'CY26 Acquisition Leadership Board', status: 'On Track', startDate: '2027-03-01', lockDate: '2027-03-12', releaseDate: '2027-03-26', ownerId: 'BMO-LEAD', candidateCount: 38 },
  { id: 'BRD-009', name: 'Cyber Space Force Specialty Board', status: 'At Risk', startDate: '2026-12-15', lockDate: '2026-12-24', releaseDate: '2027-01-10', ownerId: 'BMO-LEAD', candidateCount: 30 },
  { id: 'BRD-010', name: 'CY26 Senior Enlisted Key Billets', status: 'On Track', startDate: '2027-01-25', lockDate: '2027-02-05', releaseDate: '2027-02-18', ownerId: 'BMO-LEAD', candidateCount: 65 },
  { id: 'BRD-011', name: 'CY25 Fall SDE Secondary Release', status: 'Complete', startDate: '2026-08-10', lockDate: '2026-08-18', releaseDate: '2026-08-30', ownerId: 'BMO-LEAD', candidateCount: 20 },
  { id: 'BRD-013', name: 'CY27 Olmsted Scholar Selection', status: 'On Track', startDate: '2027-04-05', lockDate: '2027-04-14', releaseDate: '2027-04-28', ownerId: 'BMO-LEAD', candidateCount: 16 },
  { id: 'BRD-012', name: 'CY25 Special Mission Delta Slate', status: 'Complete', startDate: '2026-07-05', lockDate: '2026-07-15', releaseDate: '2026-07-28', ownerId: 'BMO-LEAD', candidateCount: 22 }
];

export const BILLETS_SEED: Billet[] = [
  {
    id: 'BIL-001',
    title: 'Chief of Orbital Warfare Ops',
    unit: 'SpOC Delta 9',
    location: 'Schriever SFB, CO',
    oconus: false,
    dafscRequired: ['13S3'],
    gradeRange: ['MAJ', 'LT COL'],
    requiredSkills: [
      { cluster: 'Orbital Warfare', minProficiency: 85 },
      { cluster: 'Operational Planning', minProficiency: 80 }
    ],
    preferredTags: ['Operational planning', 'Orbital mechanics', 'Tactical C2'],
    priority: 'Critical',
    fillByDate: '2027-06-30',
    skillVector: [0.95, 0.45, 0.88, 0.75, 0.35, 0.85, 0.60, 0.70]
  },
  {
    id: 'BIL-002',
    title: 'Director of Space Cyber Defense',
    unit: 'Space Delta 6',
    location: 'Schriever SFB, CO',
    oconus: false,
    dafscRequired: ['17S3'],
    gradeRange: ['MAJ', 'LT COL'],
    requiredSkills: [
      { cluster: 'Space Cyber Defense', minProficiency: 90 },
      { cluster: 'Tactical C2', minProficiency: 75 }
    ],
    preferredTags: ['Space cyber defense', 'Joint staff', 'Commercial integration'],
    priority: 'Critical', // Hard-to-fill 1
    fillByDate: '2027-05-15',
    skillVector: [0.40, 0.95, 0.50, 0.85, 0.30, 0.70, 0.90, 0.65]
  },
  {
    id: 'BIL-003',
    title: 'Joint Space Intelligence Strategist',
    unit: 'USSPACECOM J2',
    location: 'Peterson SFB, CO',
    oconus: false,
    dafscRequired: ['14N3'],
    gradeRange: ['CAPT', 'MAJ'],
    requiredSkills: [
      { cluster: 'Space ISR & Threat Analysis', minProficiency: 85 },
      { cluster: 'Allied Interoperability', minProficiency: 75 }
    ],
    preferredTags: ['Joint staff', 'Allied interoperability', 'Operational planning'],
    priority: 'High',
    fillByDate: '2027-07-01',
    skillVector: [0.55, 0.60, 0.92, 0.80, 0.70, 0.50, 0.60, 0.85]
  },
  {
    id: 'BIL-004',
    title: 'Senior Acquisition Material Leader',
    unit: 'SSC Acquisition Delta',
    location: 'Los Angeles AFB, CA',
    oconus: false,
    dafscRequired: ['63A3'],
    gradeRange: ['MAJ', 'LT COL'],
    requiredSkills: [
      { cluster: 'Acquisition & Program Mgmt', minProficiency: 90 },
      { cluster: 'Commercial Integration', minProficiency: 80 }
    ],
    preferredTags: ['Acquisition category 1', 'Commercial integration', 'SDE in residence'],
    priority: 'High',
    fillByDate: '2027-06-15',
    skillVector: [0.35, 0.40, 0.45, 0.90, 0.95, 0.75, 0.55, 0.65]
  },
  {
    id: 'BIL-005',
    title: 'Tactical Space Electronic Warfare Lead',
    unit: 'Space Delta 3',
    location: 'Peterson SFB, CO',
    oconus: false,
    dafscRequired: ['13S3', '17S3'],
    gradeRange: ['CAPT', 'MAJ'],
    requiredSkills: [
      { cluster: 'Electronic Warfare', minProficiency: 85 },
      { cluster: 'Tactical C2', minProficiency: 80 }
    ],
    preferredTags: ['Electronic warfare', 'Operational planning', 'OCONUS willing'],
    priority: 'Critical', // Hard-to-fill 2
    fillByDate: '2027-08-01',
    skillVector: [0.85, 0.85, 0.70, 0.65, 0.40, 0.80, 0.75, 0.60]
  },
  {
    id: 'BIL-006',
    title: 'Allied Coalition Liaison Officer',
    unit: 'UK Space Command / USSF Det',
    location: 'RAF High Wycombe, UK',
    oconus: true,
    dafscRequired: ['13S3', '14N3'],
    gradeRange: ['MAJ', 'LT COL'],
    requiredSkills: [
      { cluster: 'Allied Interoperability', minProficiency: 90 },
      { cluster: 'Joint Staff Operations', minProficiency: 85 }
    ],
    preferredTags: ['OCONUS willing', 'Allied interoperability', 'Joint staff'],
    priority: 'High',
    fillByDate: '2027-07-15',
    skillVector: [0.75, 0.50, 0.85, 0.85, 0.50, 0.60, 0.70, 0.95]
  },
  {
    id: 'BIL-007',
    title: 'Space Domain Awareness Ops Director',
    unit: 'Space Delta 2',
    location: 'Peterson SFB, CO',
    oconus: false,
    dafscRequired: ['13S3'],
    gradeRange: ['CAPT', 'MAJ'],
    requiredSkills: [{ cluster: 'Electro-Optical & Radar', minProficiency: 80 }],
    preferredTags: ['Electro-optical sensors', 'Orbital mechanics', 'Operational planning'],
    priority: 'Routine',
    fillByDate: '2027-09-01',
    skillVector: [0.90, 0.50, 0.75, 0.60, 0.40, 0.90, 0.50, 0.55]
  },
  {
    id: 'BIL-008',
    title: 'NextGen SATCOM Architecture Lead',
    unit: 'Space Delta 8',
    location: 'Schriever SFB, CO',
    oconus: false,
    dafscRequired: ['13S3', '61C3'],
    gradeRange: ['MAJ', 'LT COL'],
    requiredSkills: [{ cluster: 'Satellite Communications', minProficiency: 85 }],
    preferredTags: ['Commercial integration', 'Tactical C2', 'SDE in residence'],
    priority: 'Routine',
    fillByDate: '2027-08-15',
    skillVector: [0.80, 0.65, 0.60, 0.75, 0.70, 0.80, 0.65, 0.70]
  },
  {
    id: 'BIL-009',
    title: 'Space Test & Evaluation Flight Commander',
    unit: 'Space Delta 11',
    location: 'Kirtland AFB, NM',
    oconus: false,
    dafscRequired: ['13S3', '61C3'],
    gradeRange: ['CAPT', 'MAJ'],
    requiredSkills: [{ cluster: 'Test & Evaluation', minProficiency: 85 }],
    preferredTags: ['Orbital mechanics', 'Commercial integration', 'Operational planning'],
    priority: 'High',
    fillByDate: '2027-07-01',
    skillVector: [0.88, 0.55, 0.70, 0.70, 0.85, 0.85, 0.60, 0.60]
  },
  {
    id: 'BIL-010',
    title: 'USSPACECOM J35 Future Ops Planner',
    unit: 'USSPACECOM J35',
    location: 'Peterson SFB, CO',
    oconus: false,
    dafscRequired: ['13S3', '14N3'],
    gradeRange: ['MAJ', 'LT COL'],
    requiredSkills: [{ cluster: 'Joint Operational Planning', minProficiency: 90 }],
    preferredTags: ['Joint staff', 'Operational planning', 'Tactical C2'],
    priority: 'High',
    fillByDate: '2027-06-30',
    skillVector: [0.85, 0.60, 0.85, 0.90, 0.55, 0.75, 0.70, 0.80]
  },
  {
    id: 'BIL-011',
    title: 'Space Systems Scientific Analyst',
    unit: 'HQSF S5/9',
    location: 'Pentagon, DC',
    oconus: false,
    dafscRequired: ['61C3'],
    gradeRange: ['CAPT', 'MAJ'],
    requiredSkills: [{ cluster: 'Astrodynamics & Physics', minProficiency: 85 }],
    preferredTags: ['Orbital mechanics', 'Acquisition category 1', 'Joint staff'],
    priority: 'Routine',
    fillByDate: '2027-09-15',
    skillVector: [0.70, 0.50, 0.60, 0.70, 0.80, 0.95, 0.50, 0.70]
  },
  {
    id: 'BIL-012',
    title: 'Indo-Pacom Theater Space C2 Officer',
    unit: 'USINDOPACOM / USSF PAC',
    location: 'JB Pearl Harbor-Hickam, HI',
    oconus: true,
    dafscRequired: ['13S3'],
    gradeRange: ['MAJ', 'LT COL'],
    requiredSkills: [{ cluster: 'Theater Space C2', minProficiency: 90 }],
    preferredTags: ['OCONUS willing', 'Joint staff', 'Tactical C2'],
    priority: 'Critical',
    fillByDate: '2027-05-30',
    skillVector: [0.90, 0.60, 0.80, 0.85, 0.45, 0.80, 0.75, 0.85]
  }
];

// Hand-written candidates (12) with full SOI and deep career details
export const HANDWRITTEN_CANDIDATES: Partial<Candidate>[] = [
  {
    id: 'PDO-001',
    dodId: '1098245512',
    name: 'Maj Vance, Tyler K.',
    grade: 'MAJ',
    dafsc: '13S3',
    pasCode: 'SP91OP2B',
    currentUnit: 'SpOC Delta 9',
    lastAssignment: '1st Space Ops Sq / DO',
    tig: '4y 2m',
    tafcsd: '14y 7m',
    dor: '2022-08-01',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '1/18 MAJ in Delta 9 (DP)', pctTop: 5 },
      { year: 2024, strat: '2/17 MAJ (P)', pctTop: 11 },
      { year: 2023, strat: '1/14 CAPT (DP)', pctTop: 7 }
    ],
    ropTrend: 'Upward',
    decorations: ['Defense Meritorious Service Medal', 'Air and Space Commendation Medal with 2 OLC'],
    deployments: 2,
    jointTours: 1,
    shortTours: 0,
    skills: [
      { cluster: 'Orbital Warfare', proficiency: 94, rarity: 0.92 },
      { cluster: 'Tactical C2', proficiency: 88, rarity: 0.85 },
      { cluster: 'Space Threat Modeling', proficiency: 82, rarity: 0.78 }
    ],
    skillVector: [0.94, 0.50, 0.82, 0.78, 0.40, 0.88, 0.65, 0.72],
    badgeLevel: 'Master Space Operations',
    certs: ['Orbital Warfare Level 3', 'Weapons Instructor Course (WIC)'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'M.S. Space Systems Operations',
    academicDiscipline: 'Astrodynamics & Orbital Mechanics',
    pmeYear: 2026,
    llmFitScore: 92,
    mScore: 90,
    confidence: { soi: 'High', rops: 'High', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Top 5% Stratification in Combat Space Delta', weight: 0.35 },
      { feature: 'WIC Graduate with 2 Combined Space Operations Tours', weight: 0.28 },
      { feature: 'High SOI alignment with Delta 9 leadership roles', weight: 0.22 }
    ],
    soi: {
      text: 'Having completed 50 months of operational command and weapons direction across Delta 9, my intent is to leverage deep tactical orbital warfare experience in high-impact leadership billets. I have directed on-orbit proximity operations, authored defensive tactics against adversary direct-ascent threats, and integrated allied space capability into joint combatant commands. My professional preference is centered on operational planning and advanced orbital warfare positions where technical rigor and combat doctrine merge. I am fully prepared for OCONUS or high-tempo Joint Staff requirements, particularly billets integrating allied coalition interoperability. I believe modern space superiority hinges on rapid tactical decision-making, distributed orbital C2, and disciplined mission command. My leadership record demonstrates an enduring commitment to building resilient crew cultures capable of executing contested mission objectives under contested electromagnetic and cyber conditions.',
      date: '2026-10-14',
      wordCount: 148,
      tags: ['Operational planning', 'Orbital mechanics', 'Tactical C2', 'Joint staff'],
      endorserQuote: 'My absolute #1 operational space leader in the Delta; ready for any echelon of command immediately.',
      preferences: {
        billetIds: ['BIL-001', 'BIL-010', 'BIL-005'],
        locations: ['Schriever SFB, CO', 'Peterson SFB, CO'],
        willingOCONUS: true
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v01',
      summary: [
        'Elite orbital warfare tactician with consistent #1 Delta-level stratifications and Weapons School pedigree.',
        'Extensive joint command experience leading contested space security patrols and tactical proximity operations.',
        'Exemplary packet integrity with fully validated flight/ops documentation and spotless disciplinary background.'
      ],
      strengths: [
        'Top 5% stratification across 3 consecutive performance evaluations.',
        'WIC graduate with proven doctrinal leadership in orbital defense.',
        'Exceptional alignment with critical combat billets BIL-001 and BIL-010.'
      ],
      considerations: [
        'TIG of 4y 2m is slightly below pool average (4y 9m) but offset by early combat command.',
        'High demand candidate across multiple delta billets may require de-confliction.'
      ],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-14T12:00:00Z',
      rops: '2026-10-20T10:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 9.0, at: '2026-10-26T16:00:00Z' },
      { panelistId: 'PANEL-02', value: 8.5, at: '2026-10-26T16:05:00Z' },
      { panelistId: 'PANEL-03', value: 9.5, at: '2026-10-26T16:10:00Z' }
    ],
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: [] },
    endorserId: 'END-01',
    endorserRank: 1,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T08:00:00Z',
      validatedAt: '2026-10-22T08:04:12Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T15:00:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Low',
      impactOfLoss: 'High',
      talentScore: 94,
      nBoxCell: 'Key Talent',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Heartburn Outlier 1: My Score 9.5 vs Panel Avg 7.5 (diff = 2.0 >= 1.5)
    id: 'PDO-002',
    dodId: '1098245513',
    name: 'Maj Thorne, Brandon R.',
    grade: 'MAJ',
    dafsc: '17S3',
    pasCode: 'CY60OP4A',
    currentUnit: 'Space Delta 6 (Cyber)',
    lastAssignment: 'Cyber Defense Sq / CC',
    tig: '4y 8m',
    tafcsd: '15y 2m',
    dor: '2022-02-15',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '2/12 MAJ in Cyber Delta (P)', pctTop: 16 },
      { year: 2024, strat: '3/11 MAJ (P)', pctTop: 27 },
      { year: 2023, strat: '1/9 CAPT (DP)', pctTop: 11 }
    ],
    ropTrend: 'Consistent',
    decorations: ['Meritorious Service Medal with 1 OLC', 'Joint Service Commendation Medal'],
    deployments: 1,
    jointTours: 2,
    shortTours: 0,
    skills: [
      { cluster: 'Space Cyber Defense', proficiency: 96, rarity: 0.95 },
      { cluster: 'Zero Trust Architecture', proficiency: 92, rarity: 0.90 },
      { cluster: 'Tactical C2', proficiency: 75, rarity: 0.70 }
    ],
    skillVector: [0.45, 0.96, 0.55, 0.85, 0.35, 0.72, 0.92, 0.68],
    badgeLevel: 'Senior Cyber Operations',
    certs: ['CISSP-ISSAP', 'DoD Space Cyber Warfare Course'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'M.S. Cyber Warfare Engineering',
    academicDiscipline: 'Computer Engineering',
    pmeYear: 2026,
    llmFitScore: 89,
    mScore: 84,
    confidence: { soi: 'High', rops: 'High', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Unmatched Space Cyber Weapon System expertise', weight: 0.40 },
      { feature: 'High demand in critical cyber billet BIL-002', weight: 0.30 }
    ],
    soi: {
      text: 'Over the last five years, my focus has been building resilient defense mechanisms for contested orbital uplink and downlink communications networks. I led the security accreditation for two major satellite ground architectures, remediating critical vulnerabilities under strict joint timelines. My objective in this board is to advance into enterprise-level cyber command or joint space cyber planning billets. My preference is for leadership positions that require integrating zero-trust frameworks across commercial satellite constellations and military constellations. I thrive in high-stakes environments where digital threats pose immediate operational risks to mission assurance. Billets located at Schriever or with USSPACECOM J6 represent ideal assignments where my technical certifications and command perspective will generate outsized tactical returns.',
      date: '2026-10-15',
      wordCount: 142,
      tags: ['Space cyber defense', 'Commercial integration', 'Tactical C2', 'Joint staff'],
      endorserQuote: 'The finest space cyber mind in our command; his defensive innovations have preserved critical SATCOM links.',
      preferences: {
        billetIds: ['BIL-002', 'BIL-005', 'BIL-010'],
        locations: ['Schriever SFB, CO'],
        willingOCONUS: false
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v02',
      summary: [
        'Pioneering cyber operator with extensive specialized weapon system credentials.',
        'Outstanding tactical leadership in fortifying satellite control network perimeters.',
        'Clear match for high-criticality cyber defense positions across USSF deltas.'
      ],
      strengths: ['Top cyber architect in Delta 6', 'Direct match for BIL-002 Director of Cyber Defense'],
      considerations: ['Evaluator variance on cyber versus orbital operational weight.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-15T10:00:00Z',
      rops: '2026-10-21T09:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 7.5, at: '2026-10-26T16:15:00Z' },
      { panelistId: 'PANEL-02', value: 7.0, at: '2026-10-26T16:20:00Z' }, // Harsh panelist
      { panelistId: 'PANEL-03', value: 8.0, at: '2026-10-26T16:25:00Z' }
    ],
    myScore: 9.5, // Heartburn outlier! (9.5 - 7.5 = 2.0 gap)
    flagged: true,
    flagReason: 'Heartburn outlier: evaluator divergence > 1.5 points on technical cyber versus general space command weighting.',
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: [] },
    endorserId: 'END-04',
    endorserRank: 2,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T08:15:00Z',
      validatedAt: '2026-10-22T08:18:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T15:10:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Medium',
      impactOfLoss: 'High',
      talentScore: 91,
      nBoxCell: 'High Potential',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Heartburn Outlier 2: My Score 6.5 vs Panel Avg 8.5 (diff = -2.0)
    id: 'PDO-003',
    dodId: '1098245514',
    name: 'Maj Chen, Kimberly A.',
    grade: 'MAJ',
    dafsc: '14N3',
    pasCode: 'IN20JP1C',
    currentUnit: 'USSPACECOM J2',
    lastAssignment: 'Joint Intel Center / Branch Chief',
    tig: '5y 1m',
    tafcsd: '15y 8m',
    dor: '2021-09-01',
    lookStatus: '2nd Look',
    performance: [
      { year: 2025, strat: '1/20 MAJ at USSPACECOM (DP)', pctTop: 5 },
      { year: 2024, strat: '2/18 MAJ (DP)', pctTop: 11 },
      { year: 2023, strat: '4/16 MAJ (P)', pctTop: 25 }
    ],
    ropTrend: 'Upward',
    decorations: ['Defense Meritorious Service Medal with 1 OLC'],
    deployments: 3,
    jointTours: 2,
    shortTours: 1,
    skills: [
      { cluster: 'Space ISR & Threat Analysis', proficiency: 92, rarity: 0.88 },
      { cluster: 'Allied Interoperability', proficiency: 86, rarity: 0.82 },
      { cluster: 'Joint Operational Planning', proficiency: 84, rarity: 0.80 }
    ],
    skillVector: [0.60, 0.65, 0.94, 0.82, 0.70, 0.55, 0.65, 0.88],
    badgeLevel: 'Senior Intelligence Badge',
    certs: ['Joint Qualified Officer (JQO Level 3)', 'Advanced Space Intelligence Course'],
    pmeStatus: 'SDE Complete',
    highestDegree: 'M.A. Strategic Intelligence',
    academicDiscipline: 'International Security Affairs',
    pmeYear: 2024,
    llmFitScore: 88,
    mScore: 86,
    confidence: { soi: 'High', rops: 'High', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Consecutive DP evaluations at Combatant Command echelon', weight: 0.45 },
      { feature: 'Extensive coalition interoperability tours', weight: 0.30 }
    ],
    soi: {
      text: 'My military career has been dedicated to demystifying adversary counterspace threats and delivering actionable, decision-quality intelligence directly to joint force commanders. Having served as Branch Chief at USSPACECOM J2, I spearheaded intelligence integrations with Five Eyes and NATO partners during live operational contingencies. I seek assignments in coalition space planning, strategic policy, or international liaison roles where multilateral coordination is paramount. I am fully available and enthusiastically willing to accept OCONUS assignments in Europe or the Indo-Pacific theater. My record demonstrates a continuous drive to bridge operational intelligence gaps, streamline intelligence sharing agreements, and cultivate strategic trust across allied commands. I am eager to assume critical responsibilities requiring deep joint warfighting competence.',
      date: '2026-10-12',
      wordCount: 145,
      tags: ['Joint staff', 'Allied interoperability', 'Operational planning', 'OCONUS willing'],
      endorserQuote: 'An extraordinary intelligence officer whose threat assessments guided combatant command posture.',
      preferences: {
        billetIds: ['BIL-006', 'BIL-003', 'BIL-010'],
        locations: ['RAF High Wycombe, UK', 'Peterson SFB, CO'],
        willingOCONUS: true
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v03',
      summary: [
        'Distinguished intelligence professional with exceptional joint combatant command experience.',
        'Extensive allied partnership and multilateral intelligence integration achievements.',
        'Prime candidate for high-visibility international liaison and strategic planning billets.'
      ],
      strengths: ['High joint credentialing (JQO 3)', 'Prime match for UK allied billet BIL-006'],
      considerations: ['Scoring audit flag on panel vs myScore divergence.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-12T14:00:00Z',
      rops: '2026-10-19T11:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 8.5, at: '2026-10-26T16:30:00Z' },
      { panelistId: 'PANEL-02', value: 8.5, at: '2026-10-26T16:35:00Z' },
      { panelistId: 'PANEL-03', value: 9.0, at: '2026-10-26T16:40:00Z' }
    ],
    myScore: 6.5, // Heartburn outlier! (8.66 avg vs 6.5 = -2.16 gap)
    flagged: true,
    flagReason: 'Heartburn outlier: divergence > 1.5 points below panel consensus.',
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: [] },
    endorserId: 'END-02',
    endorserRank: 1,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T08:30:00Z',
      validatedAt: '2026-10-22T08:35:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T15:20:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Low',
      impactOfLoss: 'High',
      talentScore: 92,
      nBoxCell: 'Key Talent',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Hidden Talent 1: Low panel average (6.5) but high LLM Fit Score (91%)
    id: 'PDO-004',
    dodId: '1098245515',
    name: 'Maj Morales, Javier E.',
    grade: 'MAJ',
    dafsc: '63A3',
    pasCode: 'AC40LA1M',
    currentUnit: 'SSC Acquisition Delta',
    lastAssignment: 'Resilient GPS Program Office',
    tig: '4y 4m',
    tafcsd: '14y 1m',
    dor: '2022-06-01',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '5/16 MAJ in Program Office (P)', pctTop: 31 },
      { year: 2024, strat: '6/15 MAJ (P)', pctTop: 40 },
      { year: 2023, strat: '4/12 CAPT (P)', pctTop: 33 }
    ],
    ropTrend: 'Consistent',
    decorations: ['Air and Space Commendation Medal with 1 OLC'],
    deployments: 0,
    jointTours: 0,
    shortTours: 0,
    skills: [
      { cluster: 'Acquisition & Program Mgmt', proficiency: 94, rarity: 0.90 },
      { cluster: 'Commercial Integration', proficiency: 91, rarity: 0.88 },
      { cluster: 'Contracting Law', proficiency: 86, rarity: 0.80 }
    ],
    skillVector: [0.38, 0.42, 0.48, 0.92, 0.96, 0.78, 0.60, 0.68],
    badgeLevel: 'Senior Acquisition Badge',
    certs: ['DAWIA Program Management Level III', 'Contracting Officer Warrant'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'M.B.A. Technology Management',
    academicDiscipline: 'Business & Acquisitions',
    pmeYear: 2026,
    llmFitScore: 91, // High fit!
    mScore: 72,
    confidence: { soi: 'High', rops: 'Med', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Rare DAWIA Level III with active contracting warrant', weight: 0.45 },
      { feature: 'Exceptional alignment with BIL-004 Senior Acquisition Lead', weight: 0.35 }
    ],
    soi: {
      text: 'Throughout my acquisition career at Space Systems Command, I have successfully accelerated contract delivery on Major Defense Acquisition Programs by pioneering rapid commercial prototyping. Traditional acquisition timelines cannot keep pace with dynamic space threats. I spearheaded an OTA contract mechanism that cut satellite sensor delivery timelines by eighteen months. I desire placement in senior acquisition management or strategic commercial integration billets. My focus is on transforming how the Space Force acquires off-the-shelf commercial space technology and binds it into defense architecture. I prefer roles in Los Angeles or Colorado where my procurement authority and technical understanding can directly break bureaucratic logjams.',
      date: '2026-10-16',
      wordCount: 144,
      tags: ['Acquisition category 1', 'Commercial integration', 'SDE in residence'],
      endorserQuote: 'A generational acquisition officer who executes high-value contracts with unmatched speed and precision.',
      preferences: {
        billetIds: ['BIL-004', 'BIL-008'],
        locations: ['Los Angeles AFB, CA'],
        willingOCONUS: false
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v04',
      summary: [
        'Elite programmatic strategist with rare Level III credentials and contracting warrants.',
        'Demonstrated ability to drastically shrink acquisition timelines through OTA and rapid commercial avenues.',
        'High divergence between middle-tier panel stratifications and extraordinarily high billet matching scores.'
      ],
      strengths: ['DAWIA Level III expert', 'Ideal match for BIL-004 (94% algorithm fit)'],
      considerations: ['Panel scores depressed due to non-flying/non-operations career track.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-16T09:00:00Z',
      rops: '2026-10-21T14:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 6.5, at: '2026-10-26T16:45:00Z' },
      { panelistId: 'PANEL-02', value: 6.0, at: '2026-10-26T16:50:00Z' },
      { panelistId: 'PANEL-03', value: 7.0, at: '2026-10-26T16:55:00Z' }
    ], // Panel avg = 6.5 -> Hidden talent!
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: [] },
    endorserId: 'END-03',
    endorserRank: 4,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T08:45:00Z',
      validatedAt: '2026-10-22T08:48:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T15:30:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'High', // At risk of private sector departure
      impactOfLoss: 'High',
      talentScore: 89,
      nBoxCell: 'High Potential',
      advancementReadiness: '1-2 yrs'
    }
  },
  {
    // Hidden Talent 2: Low panel average (6.5) but high fit (88%)
    id: 'PDO-005',
    dodId: '1098245516',
    name: 'Maj Sterling, Alyssa M.',
    grade: 'MAJ',
    dafsc: '61C3',
    pasCode: 'RD10AL5D',
    currentUnit: 'HQSF S5/9',
    lastAssignment: 'Air Force Research Lab Space Vehicles',
    tig: '4y 9m',
    tafcsd: '14y 5m',
    dor: '2022-01-10',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '4/14 MAJ in Directorate (P)', pctTop: 28 },
      { year: 2024, strat: '5/14 MAJ (P)', pctTop: 35 },
      { year: 2023, strat: '3/10 CAPT (P)', pctTop: 30 }
    ],
    ropTrend: 'Consistent',
    decorations: ['Air and Space Commendation Medal with 2 OLC'],
    deployments: 0,
    jointTours: 1,
    shortTours: 0,
    skills: [
      { cluster: 'Astrodynamics & Physics', proficiency: 97, rarity: 0.98 },
      { cluster: 'Cislunar Trajectory Modeling', proficiency: 94, rarity: 0.96 },
      { cluster: 'Scientific Analysis', proficiency: 90, rarity: 0.88 }
    ],
    skillVector: [0.72, 0.48, 0.62, 0.68, 0.82, 0.98, 0.52, 0.74],
    badgeLevel: 'Senior Scientist Badge',
    certs: ['Ph.D. Aeronautics & Astronautics', 'Space Vehicle Design Certification'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'Ph.D. Aerospace Engineering',
    academicDiscipline: 'Orbital Astrodynamics & Celestial Mechanics',
    pmeYear: 2026,
    llmFitScore: 88,
    mScore: 73,
    confidence: { soi: 'High', rops: 'Med', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Doctorate in Astrodynamics with deep cislunar specialization', weight: 0.50 },
      { feature: 'Critical scientific capability needed for BIL-011 and BIL-009', weight: 0.35 }
    ],
    soi: {
      text: 'My military and academic trajectory has focused on non-Keplerian orbital dynamics, cislunar navigation corridors, and advanced space flight mechanics. While standard tactical operations center around LEO and GEO regimes, future theater deterrence depends on mastering deep cislunar space. At AFRL, I directed computer simulation pipelines modeling adversary trajectory diversions around Lagrange points. I am seeking advanced technical leadership assignments within HQ Space Force S5/9 or research-aligned test flights. I bring an uncompromising analytical rigor and peer-reviewed research credentials to operational planning teams. My professional ambition is to anchor Space Force doctrine in mathematically rigorous physical realities that ensure long-range orbital dominance.',
      date: '2026-10-18',
      wordCount: 147,
      tags: ['Orbital mechanics', 'Acquisition category 1', 'Joint staff', 'SDE in residence'],
      endorserQuote: 'A scientific powerhouse whose mathematical formulations underpin our next-decade cislunar strategy.',
      preferences: {
        billetIds: ['BIL-011', 'BIL-009'],
        locations: ['Pentagon, DC', 'Kirtland AFB, NM'],
        willingOCONUS: false
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v05',
      summary: [
        'World-class astrodynamicist holding an accredited doctorate in celestial mechanics.',
        'Pioneered cislunar trajectory calculations adopted by joint space architecture teams.',
        'High-value niche talent whose specialized contributions are under-weighted by operational panels.'
      ],
      strengths: ['Ph.D. in Aerospace Engineering', 'Prime match for scientific billet BIL-011'],
      considerations: ['Panel scores reflect typical operational bias against laboratory assignments.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-18T11:00:00Z',
      rops: '2026-10-21T15:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 6.5, at: '2026-10-26T17:00:00Z' },
      { panelistId: 'PANEL-02', value: 6.0, at: '2026-10-26T17:05:00Z' },
      { panelistId: 'PANEL-03', value: 7.0, at: '2026-10-26T17:10:00Z' }
    ], // Hidden talent 2!
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: [] },
    endorserId: 'END-06',
    endorserRank: 5,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T09:00:00Z',
      validatedAt: '2026-10-22T09:05:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T15:40:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'High',
      impactOfLoss: 'High',
      talentScore: 90,
      nBoxCell: 'Specialist / High Impact',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Hidden Talent 3: Low panel avg (6.5), High fit (87%)
    id: 'PDO-006',
    dodId: '1098245517',
    name: 'Maj Kowalski, Derek T.',
    grade: 'MAJ',
    dafsc: '13S3',
    pasCode: 'EW30PT2K',
    currentUnit: 'Space Delta 3 (EW)',
    lastAssignment: 'Space Electronic Warfare Sq / DO',
    tig: '4y 7m',
    tafcsd: '15y 0m',
    dor: '2022-03-01',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '3/11 MAJ in EW Sq (P)', pctTop: 27 },
      { year: 2024, strat: '4/11 MAJ (P)', pctTop: 36 },
      { year: 2023, strat: '2/8 CAPT (P)', pctTop: 25 }
    ],
    ropTrend: 'Consistent',
    decorations: ['Meritorious Service Medal', 'Air and Space Commendation Medal with 1 OLC'],
    deployments: 2,
    jointTours: 1,
    shortTours: 0,
    skills: [
      { cluster: 'Electronic Warfare', proficiency: 93, rarity: 0.91 },
      { cluster: 'Tactical C2', proficiency: 86, rarity: 0.82 },
      { cluster: 'Electromagnetic Spectrum Ops', proficiency: 88, rarity: 0.85 }
    ],
    skillVector: [0.86, 0.82, 0.68, 0.65, 0.42, 0.82, 0.76, 0.62],
    badgeLevel: 'Senior Space Operations',
    certs: ['Joint Electronic Warfare Course (JEWC)', 'Space Superiority Tactical Leader'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'B.S. Electrical Engineering',
    academicDiscipline: 'RF & Signal Processing',
    pmeYear: 2026,
    llmFitScore: 87,
    mScore: 74,
    confidence: { soi: 'High', rops: 'Med', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Highly specialized Counter-Communications and EW expertise', weight: 0.45 },
      { feature: 'Direct qualification match for critical billet BIL-005', weight: 0.35 }
    ],
    soi: {
      text: 'Having completed two tactical command deployments executing offensive and defensive space electronic warfare, I understand firsthand how critical spectrum supremacy is to theater survival. My operational teams deployed transportable space counter-communications systems in support of theater combatant commanders during live joint exercises. My stated intent is to continue in frontline tactical space EW or operational planning roles where dynamic electromagnetic operations are central. I am willing and eager to accept forward OCONUS deployments or crisis response billets. I pride myself on maintaining high crew readiness and instilling aggressive tactical discipline within combat crews facing sophisticated jamming adversaries.',
      date: '2026-10-15',
      wordCount: 141,
      tags: ['Electronic warfare', 'Operational planning', 'OCONUS willing', 'Tactical C2'],
      endorserQuote: 'A combat-proven electronic warfare leader who consistently out-maneuvers sophisticated adversaries.',
      preferences: {
        billetIds: ['BIL-005', 'BIL-012', 'BIL-001'],
        locations: ['Peterson SFB, CO', 'JB Pearl Harbor-Hickam, HI'],
        willingOCONUS: true
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v06',
      summary: [
        'Combat-tested electronic warfare practitioner with extensive forward deployment background.',
        'Superb tactical understanding of counter-space electromagnetic operations and spectrum control.',
        'High operational value match for hard-to-fill critical billet BIL-005.'
      ],
      strengths: ['Frontline combat EW experience', 'Prime candidate for BIL-005'],
      considerations: ['Panel stratification reflects crowded peer group in non-headquarters delta.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-15T12:00:00Z',
      rops: '2026-10-21T10:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 6.5, at: '2026-10-26T17:15:00Z' },
      { panelistId: 'PANEL-02', value: 6.0, at: '2026-10-26T17:20:00Z' },
      { panelistId: 'PANEL-03', value: 7.0, at: '2026-10-26T17:25:00Z' }
    ], // Hidden talent 3!
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: [] },
    endorserId: 'END-05',
    endorserRank: 3,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T09:15:00Z',
      validatedAt: '2026-10-22T09:20:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T15:50:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Medium',
      impactOfLoss: 'High',
      talentScore: 86,
      nBoxCell: 'High Potential',
      advancementReadiness: '1-2 yrs'
    }
  },
  {
    // Stale-ARMS candidate (amber > 12h)
    id: 'PDO-007',
    dodId: '1098245518',
    name: 'Capt O’Reilly, Sean P.',
    grade: 'CAPT',
    dafsc: '13S3',
    pasCode: 'SP20OP3S',
    currentUnit: 'Space Delta 2',
    lastAssignment: '20th Space Surveillance Sq / Crew Commander',
    tig: '3y 6m',
    tafcsd: '7y 2m',
    dor: '2023-04-15',
    lookStatus: 'Below Zone',
    performance: [
      { year: 2025, strat: '1/12 CAPT in Surveillance Delta (DP)', pctTop: 8 },
      { year: 2024, strat: '2/10 CAPT (P)', pctTop: 20 }
    ],
    ropTrend: 'Upward',
    decorations: ['Air and Space Commendation Medal'],
    deployments: 1,
    jointTours: 0,
    shortTours: 1,
    skills: [
      { cluster: 'Electro-Optical & Radar', proficiency: 88, rarity: 0.85 },
      { cluster: 'Orbital Mechanics', proficiency: 84, rarity: 0.80 },
      { cluster: 'Operational Planning', proficiency: 78, rarity: 0.72 }
    ],
    skillVector: [0.88, 0.48, 0.74, 0.62, 0.42, 0.88, 0.52, 0.58],
    badgeLevel: 'Senior Space Operations',
    certs: ['Space Domain Awareness Analyst'],
    pmeStatus: 'ILE In Progress',
    highestDegree: 'B.S. Physics',
    academicDiscipline: 'Astrophysics',
    pmeYear: 2027,
    llmFitScore: 84,
    mScore: 82,
    confidence: { soi: 'High', rops: 'High', arms: 'Med', surf: 'High' }, // Stale ARMS!
    featureDrivers: [
      { feature: 'Top Space Domain Awareness detection and cataloging record', weight: 0.40 },
      { feature: 'Strong match for BIL-007 SDA Operations Director', weight: 0.35 }
    ],
    soi: {
      text: 'Serving as Crew Commander in Space Delta 2, I directed radar and optical sensor tracking networks monitoring critical geosynchronous and low earth orbit assets during foreign ASAT tests. My team identified and correlated uncatalogued orbital debris within minutes of initial event alerts. My intent is to deepen tactical space surveillance skills and transition into delta flight leadership or joint sensor integration billets. I am actively seeking positions requiring advanced astrodynamic tracking, automated optical correlation, or tactical C2. I value mission focus, meticulous crew precision, and rapid telemetry adjudication. I am prepared to relocate to any installation supporting frontline orbital detection capabilities.',
      date: '2026-10-14',
      wordCount: 143,
      tags: ['Electro-optical sensors', 'Orbital mechanics', 'Operational planning', 'Tactical C2'],
      endorserQuote: 'Superb crew commander whose rapid sensor correlation prevented severe collision risks.',
      preferences: {
        billetIds: ['BIL-007', 'BIL-009'],
        locations: ['Peterson SFB, CO'],
        willingOCONUS: false
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v07',
      summary: [
        'Top-performing company grade officer with stellar orbital surveillance credentials.',
        'Demonstrated vigilance tracking contested orbital space events and cataloging foreign debris.',
        'Package validated; pending refreshed flight/ops verification from authoritative ARMS feed.'
      ],
      strengths: ['#1 CAPT in Space Delta 2', 'Direct match for BIL-007'],
      considerations: ['ARMS sync exceeds 16h amber threshold; awaiting authoritative records sync.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-14T08:00:00Z',
      rops: '2026-10-20T12:00:00Z',
      arms: '2026-10-25T18:00:00Z', // 25h ago (amber > 12h)
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 8.0, at: '2026-10-26T17:30:00Z' },
      { panelistId: 'PANEL-02', value: 8.0, at: '2026-10-26T17:35:00Z' }
    ],
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: ['ARMS source sync > 12h'] },
    endorserId: 'END-07',
    endorserRank: 1,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T09:30:00Z',
      validatedAt: '2026-10-22T09:34:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T16:00:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Low',
      impactOfLoss: 'Medium',
      talentScore: 84,
      nBoxCell: 'High Potential',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Candidate past RED threshold on SURF (> 7 days stale)
    id: 'PDO-008',
    dodId: '1098245519',
    name: 'Maj Sterling-Fox, Diana',
    grade: 'MAJ',
    dafsc: '13S3',
    pasCode: 'SC80SH1D',
    currentUnit: 'Space Delta 8',
    lastAssignment: '4th Space Ops Sq / Assistant Director of Ops',
    tig: '4y 11m',
    tafcsd: '15y 4m',
    dor: '2021-11-01',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '2/15 MAJ in SATCOM Delta (P)', pctTop: 13 },
      { year: 2024, strat: '2/14 MAJ (DP)', pctTop: 14 },
      { year: 2023, strat: '1/10 CAPT (DP)', pctTop: 10 }
    ],
    ropTrend: 'Upward',
    decorations: ['Meritorious Service Medal with 2 OLC'],
    deployments: 2,
    jointTours: 1,
    shortTours: 0,
    skills: [
      { cluster: 'Satellite Communications', proficiency: 92, rarity: 0.88 },
      { cluster: 'Tactical C2', proficiency: 84, rarity: 0.80 },
      { cluster: 'Commercial Integration', proficiency: 80, rarity: 0.75 }
    ],
    skillVector: [0.82, 0.64, 0.62, 0.76, 0.72, 0.82, 0.66, 0.72],
    badgeLevel: 'Master Space Operations',
    certs: ['Protected Tactical SATCOM SME', 'Space Systems Acquisition Course'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'M.S. Telecommunications Engineering',
    academicDiscipline: 'Communications Networks',
    pmeYear: 2026,
    llmFitScore: 86,
    mScore: 85,
    confidence: { soi: 'High', rops: 'High', arms: 'High', surf: 'Low' }, // Red on SURF!
    featureDrivers: [
      { feature: 'Deep enterprise Protected Tactical SATCOM experience', weight: 0.40 },
      { feature: 'Proven leader in Delta 8 with consistent top quartile strats', weight: 0.35 }
    ],
    soi: {
      text: 'Having served as Assistant Director of Operations in the Space Force’s flagship SATCOM delta, I have managed the global dissemination of jam-resistant communications to joint commanders under nuclear-stressed and electronic attack profiles. I orchestrated the deployment of next-generation protected tactical waveforms across multi-orbit constellations. I seek advanced leadership positions in SATCOM architecture, commercial satellite integration, or enterprise C2. My preference is for positions located at Schriever or Peterson where technical architecture and combat warfighter requirements merge. I am driven by the imperative to ensure our joint forces never face a silent radio or severed link in the battlespace.',
      date: '2026-10-15',
      wordCount: 142,
      tags: ['Commercial integration', 'Tactical C2', 'SDE in residence', 'Operational planning'],
      endorserQuote: 'Superb operations officer whose leadership guaranteed continuous tactical SATCOM connectivity.',
      preferences: {
        billetIds: ['BIL-008', 'BIL-001'],
        locations: ['Schriever SFB, CO'],
        willingOCONUS: false
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v08',
      summary: [
        'Recognized subject matter expert in protected tactical satellite communications.',
        'Proven squadron leadership overseeing multi-orbit constellation operations.',
        'Record holds red-flagged SURF source sync age (> 9 days); manual personnel confirmation required.'
      ],
      strengths: ['Master Space badge', 'Ideal match for BIL-008 NextGen SATCOM Architecture Lead'],
      considerations: ['SURF record sync is 9 days old, violating the 7-day hard threshold.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-15T14:00:00Z',
      rops: '2026-10-21T09:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-17T08:00:00Z', // 9.5 days ago -> RED!
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 8.5, at: '2026-10-26T17:40:00Z' },
      { panelistId: 'PANEL-03', value: 8.5, at: '2026-10-26T17:45:00Z' }
    ],
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: ['SURF record sync > 7 days (9.5d)'] },
    endorserId: 'END-07',
    endorserRank: 2,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T09:45:00Z',
      validatedAt: '2026-10-22T09:50:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T16:15:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Low',
      impactOfLoss: 'High',
      talentScore: 88,
      nBoxCell: 'Key Talent',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Candidate with TOS (Time on Station) Waiver
    id: 'PDO-009',
    dodId: '1098245520',
    name: 'Maj Al-Mansoor, Tariq',
    grade: 'MAJ',
    dafsc: '13S3',
    pasCode: 'JP30HW2T',
    currentUnit: 'USINDOPACOM / USSF PAC',
    lastAssignment: 'Theater Space Control Branch',
    tig: '4y 3m',
    tafcsd: '14y 6m',
    dor: '2022-07-15',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '1/10 MAJ in Pacific Theater (DP)', pctTop: 10 },
      { year: 2024, strat: '2/10 MAJ (P)', pctTop: 20 }
    ],
    ropTrend: 'Upward',
    decorations: ['Defense Meritorious Service Medal'],
    deployments: 2,
    jointTours: 2,
    shortTours: 1,
    skills: [
      { cluster: 'Theater Space C2', proficiency: 92, rarity: 0.90 },
      { cluster: 'Tactical C2', proficiency: 88, rarity: 0.84 },
      { cluster: 'Allied Interoperability', proficiency: 85, rarity: 0.80 }
    ],
    skillVector: [0.90, 0.62, 0.80, 0.86, 0.46, 0.82, 0.74, 0.86],
    badgeLevel: 'Master Space Operations',
    certs: ['Joint Task Force Space Operations Officer'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'M.A. Strategic Studies',
    academicDiscipline: 'Military Strategy',
    pmeYear: 2026,
    llmFitScore: 90,
    mScore: 87,
    confidence: { soi: 'High', rops: 'High', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Top-ranked INDOPACOM theater space integration officer', weight: 0.45 },
      { feature: 'Direct qualification match for critical BIL-012 Indo-Pacom C2', weight: 0.35 }
    ],
    soi: {
      text: 'Serving forward in the Indo-Pacific theater, I integrated terrestrial sensor grids with orbital space command architectures to support agile combat employment concepts. I led the combined operations cell during multi-carrier strike group exercises, ensuring resilient positioning and communications amid intense adversary GPS denial. I am dedicated to remaining in high-readiness theater space operations or expanding into senior coalition leadership roles. My preference is for billets that sustain our operational posture in the Pacific or transition into joint planning staffs in Colorado or DC. I possess an approved 1-year Time-on-Station waiver from USINDOPACOM to support immediate assignment transition to high-priority requirements.',
      date: '2026-10-15',
      wordCount: 145,
      tags: ['OCONUS willing', 'Joint staff', 'Tactical C2', 'Operational planning'],
      endorserQuote: 'Invaluable theater space officer whose operational C2 prowess maintained joint superiority.',
      preferences: {
        billetIds: ['BIL-012', 'BIL-010', 'BIL-001'],
        locations: ['JB Pearl Harbor-Hickam, HI', 'Peterson SFB, CO'],
        willingOCONUS: true
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v09',
      summary: [
        'Pacific theater space integration officer with verified operational command acumen.',
        'Led joint combatant command space posture during high-stress multi-national maritime drills.',
        'Carries an approved Time on Station (TOS) waiver enabling early release for critical enterprise needs.'
      ],
      strengths: ['Master Space badge', 'Approved TOS waiver', 'Direct match for BIL-012'],
      considerations: ['Requires verification of joint assignment release memo.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'Approved 1-Yr TOS Waiver (PACAF/CC)', limitationCode: 'W1' },
    freshness: {
      soi: '2026-10-15T15:00:00Z',
      rops: '2026-10-21T11:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 8.5, at: '2026-10-26T17:50:00Z' },
      { panelistId: 'PANEL-02', value: 8.0, at: '2026-10-26T17:55:00Z' },
      { panelistId: 'PANEL-03', value: 9.0, at: '2026-10-26T18:00:00Z' }
    ],
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: ['TOS Waiver active'] },
    endorserId: 'END-02',
    endorserRank: 2,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T10:00:00Z',
      validatedAt: '2026-10-22T10:05:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T16:30:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Low',
      impactOfLoss: 'High',
      talentScore: 91,
      nBoxCell: 'Key Talent',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Candidate with pending adverse action
    id: 'PDO-010',
    dodId: '1098245521',
    name: 'Maj Gallagher, Patrick J.',
    grade: 'MAJ',
    dafsc: '13S3',
    pasCode: 'SP40OP1K',
    currentUnit: 'Space Delta 4 (MW)',
    lastAssignment: '2nd Space Warning Sq / DO',
    tig: '5y 2m',
    tafcsd: '15y 9m',
    dor: '2021-08-01',
    lookStatus: '2nd Look',
    performance: [
      { year: 2025, strat: '5/12 MAJ in Missile Warning (P)', pctTop: 41 },
      { year: 2024, strat: '4/12 MAJ (P)', pctTop: 33 },
      { year: 2023, strat: '2/10 CAPT (DP)', pctTop: 20 }
    ],
    ropTrend: 'Mixed',
    decorations: ['Air and Space Commendation Medal with 3 OLC'],
    deployments: 1,
    jointTours: 1,
    shortTours: 0,
    skills: [
      { cluster: 'Missile Warning Ops', proficiency: 90, rarity: 0.86 },
      { cluster: 'Tactical C2', proficiency: 80, rarity: 0.75 },
      { cluster: 'Operational Planning', proficiency: 76, rarity: 0.70 }
    ],
    skillVector: [0.84, 0.52, 0.72, 0.68, 0.45, 0.84, 0.56, 0.64],
    badgeLevel: 'Senior Space Operations',
    certs: ['Strategic Missile Warning Commander'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'B.S. Mathematics',
    academicDiscipline: 'Applied Mathematics',
    pmeYear: 2026,
    llmFitScore: 78,
    mScore: 75,
    confidence: { soi: 'Med', rops: 'Med', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Extensive Strategic Missile Warning crew leadership', weight: 0.40 },
      { feature: 'Pending administrative inquiry flags assignment eligibility', weight: -0.30 }
    ],
    soi: {
      text: 'My tenure in Space Delta 4 has centered on maintaining the nation’s strategic early warning shield against ballistic and hypersonic missile strikes. I led operational crews on 24/7 alert, delivering immediate threat indications to NORAD/NORTHCOM leadership under severe time constraints. My goal is to apply this operational rigor to future missile warning constellations or integrated space domain awareness centers. I prefer assignments within Colorado that maximize my tactical command experience. I recognize the ongoing administrative inquiry regarding a minor squadron documentation audit and remain fully committed to transparent resolution while continuing to uphold the highest standard of mission execution.',
      date: '2026-10-15',
      wordCount: 142,
      tags: ['Operational planning', 'Tactical C2', 'Orbital mechanics'],
      endorserQuote: 'Competent operations director; pending administrative review must be adjudicated prior to slate lock.',
      preferences: {
        billetIds: ['BIL-007', 'BIL-001'],
        locations: ['Buckley SFB, CO', 'Peterson SFB, CO'],
        willingOCONUS: false
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v10',
      summary: [
        'Experienced missile warning flight director with deep operational space vigilance expertise.',
        'Proven record overseeing nuclear deterrence alert crews under tight timelines.',
        'Packet flagged for open administrative review (LOR rebuttal pending final determination).'
      ],
      strengths: ['Extensive strategic warning background', 'Senior Space badge'],
      considerations: ['Pending adverse action requires S1 review before promotion/slate finalization.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'Pending Admin Inquiry (LOR Rebuttal Pending S1)', waivers: 'None', limitationCode: 'A3' },
    freshness: {
      soi: '2026-10-15T16:00:00Z',
      rops: '2026-10-21T12:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 7.0, at: '2026-10-26T18:05:00Z' },
      { panelistId: 'PANEL-02', value: 6.5, at: '2026-10-26T18:10:00Z' }
    ],
    myScore: null,
    flagged: true,
    flagReason: 'Pending adverse action flag (A3 limitation code); requires BMO Lead and S1 review before slate lock.',
    packetReadiness: { eligibility: false, documents: true, complete: false, exceptions: ['Pending adverse action review (A3)'] },
    endorserId: 'END-05',
    endorserRank: 4,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T10:15:00Z',
      validatedAt: '2026-10-22T10:20:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T16:45:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Medium',
      impactOfLoss: 'Medium',
      talentScore: 73,
      nBoxCell: 'Core Talent',
      advancementReadiness: '3+ yrs'
    }
  },
  {
    // Candidate who is a strong fit for 3 billets (Contention candidate!)
    id: 'PDO-011',
    dodId: '1098245522',
    name: 'Maj Washington, Maya L.',
    grade: 'MAJ',
    dafsc: '13S3',
    pasCode: 'SP90OP1M',
    currentUnit: 'SpOC Delta 9',
    lastAssignment: 'Joint Task Force Space Defense / J33',
    tig: '4y 10m',
    tafcsd: '15y 1m',
    dor: '2021-12-15',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '1/16 MAJ in Combat Delta (DP)', pctTop: 6 },
      { year: 2024, strat: '1/15 MAJ (DP)', pctTop: 7 },
      { year: 2023, strat: '1/12 CAPT (DP)', pctTop: 8 }
    ],
    ropTrend: 'Consistent',
    decorations: ['Defense Meritorious Service Medal with 2 OLC', 'Joint Commendation Medal'],
    deployments: 3,
    jointTours: 2,
    shortTours: 1,
    skills: [
      { cluster: 'Orbital Warfare', proficiency: 95, rarity: 0.94 },
      { cluster: 'Joint Operational Planning', proficiency: 94, rarity: 0.92 },
      { cluster: 'Tactical C2', proficiency: 92, rarity: 0.90 }
    ],
    skillVector: [0.95, 0.58, 0.88, 0.92, 0.50, 0.90, 0.72, 0.88],
    badgeLevel: 'Master Space Operations',
    certs: ['Weapons Instructor Course (WIC)', 'Joint Qualified Officer (JQO 3)'],
    pmeStatus: 'ILE Eligible',
    highestDegree: 'M.S. Aeronautics & National Security Strategy',
    academicDiscipline: 'Joint Operational Art & Space Strategy',
    pmeYear: 2026,
    llmFitScore: 96, // Top across entire board!
    mScore: 95,
    confidence: { soi: 'High', rops: 'High', arms: 'High', surf: 'High' },
    featureDrivers: [
      { feature: 'Flawless #1/16 consecutive DP evaluations across all 3 review cycles', weight: 0.45 },
      { feature: 'Simultaneously #1 candidate for BIL-001, BIL-010, and BIL-012', weight: 0.35 }
    ],
    soi: {
      text: 'Having led joint space defense operations at JTF-SD and authored offensive orbital employment concepts for Space Operations Command, my goal is to guide enterprise-level warfighting formations. I have coordinated live space defense engagements against simulated adversary anti-satellite systems during multi-command tier-1 exercises. I desire command of an operational orbital warfare squadron or assignment as senior joint space planner on the Joint Staff or Combatant Command J3. I am completely willing to accept high-tempo forward OCONUS roles or crisis contingency slates. I lead with uncompromising integrity, technical precision, and a relentless focus on tactical lethal readiness. Space is no longer a benign sanctuary; our forces must be trained, equipped, and led to win decisively under contested fire.',
      date: '2026-10-15',
      wordCount: 147,
      tags: ['Operational planning', 'Orbital mechanics', 'Joint staff', 'Tactical C2', 'OCONUS willing'],
      endorserQuote: 'The premier space combat officer of her generation; absolute #1 in our entire command hierarchy.',
      preferences: {
        billetIds: ['BIL-001', 'BIL-010', 'BIL-012'],
        locations: ['Schriever SFB, CO', 'Peterson SFB, CO', 'JB Pearl Harbor-Hickam, HI'],
        willingOCONUS: true
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v11',
      summary: [
        'Consensus top-tier candidate in the entire selection pool with consecutive #1 rankings.',
        'WIC graduate with verified Joint Task Force operational combat direction credentials.',
        'High contention: ranks as the highest-scoring candidate for three distinct critical billets.'
      ],
      strengths: ['#1 ranking across 3 board years', 'Fits BIL-001, BIL-010, and BIL-012 equally well'],
      considerations: ['Requires deliberate Assignments Officer adjudication to prevent multiple billet vacancies.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-15T10:00:00Z',
      rops: '2026-10-21T09:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [
      { panelistId: 'PANEL-01', value: 10.0, at: '2026-10-26T18:15:00Z' },
      { panelistId: 'PANEL-02', value: 9.5, at: '2026-10-26T18:20:00Z' },
      { panelistId: 'PANEL-03', value: 10.0, at: '2026-10-26T18:25:00Z' }
    ],
    myScore: null,
    flagged: false,
    packetReadiness: { eligibility: true, documents: true, complete: true, exceptions: [] },
    endorserId: 'END-01',
    endorserRank: 1,
    boardId: 'BRD-001',
    flow: {
      stage: 'Scoring',
      ingestedAt: '2026-10-22T10:30:00Z',
      validatedAt: '2026-10-22T10:34:00Z',
      lockedAt: '2026-10-23T09:00:00Z',
      scoringStartedAt: '2026-10-26T17:00:00Z',
      errors: [],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Low',
      impactOfLoss: 'High',
      talentScore: 98,
      nBoxCell: 'Key Talent',
      advancementReadiness: 'Ready now'
    }
  },
  {
    // Validated record with 3 schema errors (IDEA-001 seed condition)
    id: 'PDO-012',
    dodId: '1098245523',
    name: 'Capt Lindqvist, Erik S.',
    grade: 'CAPT',
    dafsc: '17S3',
    pasCode: 'CY60OP1E',
    currentUnit: 'Space Delta 6 (Cyber)',
    lastAssignment: 'Cyber Squadron Mission Commander',
    tig: '3y 8m',
    tafcsd: '7y 6m',
    dor: '2023-02-01',
    lookStatus: '1st Look',
    performance: [
      { year: 2025, strat: '2/10 CAPT in Cyber (P)', pctTop: 20 },
      { year: 2024, strat: '3/9 CAPT (P)', pctTop: 33 }
    ],
    ropTrend: 'Consistent',
    decorations: ['Air and Space Commendation Medal'],
    deployments: 1,
    jointTours: 0,
    shortTours: 0,
    skills: [
      { cluster: 'Space Cyber Defense', proficiency: 86, rarity: 0.82 },
      { cluster: 'Tactical C2', proficiency: 78, rarity: 0.74 }
    ],
    skillVector: [0.42, 0.86, 0.52, 0.74, 0.38, 0.70, 0.84, 0.62],
    badgeLevel: 'Senior Cyber Operations',
    certs: ['DoD Cyber Warfare Operator'],
    pmeStatus: 'ILE In Progress',
    highestDegree: 'B.S. Computer Science',
    academicDiscipline: 'Software Systems',
    pmeYear: 2027,
    llmFitScore: 81,
    mScore: 79,
    confidence: { soi: 'Med', rops: 'Low', arms: 'Med', surf: 'High' },
    featureDrivers: [
      { feature: 'Proven tactical cyber defense on satellite operations ground networks', weight: 0.35 }
    ],
    soi: {
      text: 'Having completed 36 months of frontline mission command defending satellite telemetry conduits against advanced persistent threat incursions, my focus is advancing joint cyber warfighting capabilities. I directed live incident response teams isolating intrusion attempts against critical satellite ground control relays. My intent is to pursue advanced assignments in defensive space cyber or theater integration teams. I am eager to assume billets requiring rapid defensive malware analysis, telemetry encryption enforcement, or joint coalition cyber operations. I am fully prepared to relocate anywhere within the continental US or deploy forward as operational contingencies require.',
      date: '2026-10-15',
      wordCount: 140,
      tags: ['Space cyber defense', 'Tactical C2', 'Joint staff'],
      endorserQuote: 'Sharp cyber mission commander with a strong grasp of defensive tactics.',
      preferences: {
        billetIds: ['BIL-002', 'BIL-005'],
        locations: ['Schriever SFB, CO'],
        willingOCONUS: false
      }
    },
    chatSnapshot: {
      id: 'CHAT-SNAPSHOT-v12',
      summary: [
        'Tactical cyber mission commander with solid defensive incident response experience.',
        'Proven record protecting satellite command uplinks from foreign persistent threats.',
        'Record is in Validated stage with 3 schema format exceptions requiring BMO resolution.'
      ],
      strengths: ['Frontline cyber operations experience', 'Solid technical background'],
      considerations: ['Schema validation flag: missing TAFCSD day field, ROP date format, and endorser code mismatch.'],
      signedOffBy: null,
      signedOffAt: null
    },
    eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
    freshness: {
      soi: '2026-10-15T09:00:00Z',
      rops: '2026-10-21T08:00:00Z',
      arms: '2026-10-26T14:30:00Z',
      surf: '2026-10-25T08:00:00Z',
      milpds: '2026-10-25T11:00:00Z',
      myvector: '2026-10-26T19:10:00Z'
    },
    scores: [],
    myScore: null,
    flagged: false,
    packetReadiness: {
      eligibility: true,
      documents: false,
      complete: false,
      exceptions: [
        'Schema error: TAFCSD format incomplete',
        'Schema error: ROP 2024 date missing timestamp',
        'Schema error: Endorser unit code mismatch'
      ]
    },
    endorserId: 'END-04',
    endorserRank: 3,
    boardId: 'BRD-001',
    flow: {
      stage: 'Validated',
      ingestedAt: '2026-10-24T11:00:00Z',
      validatedAt: '2026-10-24T11:05:00Z',
      errors: [
        'Schema Error: Missing TAFCSD Day component in SURF field',
        'Schema Error: ROP 2024 missing ISO verification signature',
        'Schema Error: Endorser unit code mismatch between MilPDS and eBOSS'
      ],
      failedIngest: false
    },
    talent: {
      riskOfLoss: 'Medium',
      impactOfLoss: 'Medium',
      talentScore: 78,
      nBoxCell: 'Core Talent',
      advancementReadiness: '1-2 yrs'
    }
  }
];

// Generator for remaining 24 candidates (total = 36)
// Distribute stages across Ingested, Validated, Locked, Scoring, Finalized
// Ensure 2 records stuck over 24h, 1 failed ingest
export function generateRemainingCandidates(): Candidate[] {
  const result: Candidate[] = [];
  const grades: ('CAPT' | 'MAJ' | 'LT COL')[] = ['CAPT', 'MAJ', 'MAJ', 'MAJ', 'LT COL'];
  const dafscs = ['13S3', '14N3', '17S3', '63A3', '61C3'];
  const units = ['SpOC Delta 9', 'Space Delta 6 (Cyber)', 'USSPACECOM J3', 'SSC Acquisition Delta', 'Space Delta 4 (MW)', 'Space Delta 8', 'STARCOM 392d CTS'];
  const names = [
    'Maj Ramirez, Carlos A.',
    'Capt Becker, Laura T.',
    'Maj Harrison, Gregory K.',
    'Lt Col Kim, Jennifer H.',
    'Maj Dubois, Marc L.',
    'Capt Jensen, Astrid N.',
    'Maj Thornton, Keith W.',
    'Maj Patel, Rohan S.',
    'Capt Washington, Aaron B.',
    'Maj Sinclair, Fiona C.',
    'Lt Col Hoffman, Kurt R.',
    'Maj Rossi, Angela M.',
    'Capt Zhao, Wei Q.',
    'Maj Brennan, Thomas P.',
    'Maj Tanaka, Kenji J.',
    'Capt Foster, Rachel D.',
    'Maj O’Sullivan, Conor E.',
    'Lt Col Montgomery, Scott V.',
    'Maj Vasquez, Sofia G.',
    'Capt Mueller, Hans K.',
    'Maj Richardson, David L.',
    'Maj Al-Hassan, Omar N.',
    'Capt Bennett, Claire M.',
    'Maj Kowalczyk, Piotr B.'
  ];

  for (let i = 0; i < 24; i++) {
    const idx = i + 13;
    const id = `PDO-${idx.toString().padStart(3, '0')}`;
    const grade = grades[Math.floor(rng() * grades.length)];
    const dafsc = dafscs[Math.floor(rng() * dafscs.length)];
    const unit = units[Math.floor(rng() * units.length)];
    const name = names[i] || `Maj Officer, Candidate ${idx}`;

    // Seed special conditions:
    // idx 13: Stuck over 24h in Ingested (IDEA-001)
    // idx 14: Stuck over 24h in Validated (IDEA-001)
    // idx 15: Failed Ingest (hard integration error) (IDEA-001)
    let stage: StageGate;
    let failedIngest = false;
    let errors: string[] = [];
    let ingestedAt = '2026-10-24T09:00:00Z';
    let validatedAt: string | undefined = '2026-10-24T09:05:00Z';
    let lockedAt: string | undefined = '2026-10-25T10:00:00Z';
    let scoringStartedAt: string | undefined = '2026-10-26T14:00:00Z';
    let finalizedAt: string | undefined;

    if (idx === 13) {
      stage = 'Ingested'; // Stuck in Ingested > 24h
      ingestedAt = '2026-10-24T08:00:00Z'; // > 50h ago
      validatedAt = undefined;
      lockedAt = undefined;
      scoringStartedAt = undefined;
    } else if (idx === 14) {
      stage = 'Validated'; // Stuck in Validated > 24h
      ingestedAt = '2026-10-24T07:30:00Z';
      validatedAt = '2026-10-24T07:40:00Z'; // > 50h ago without moving to Locked
      lockedAt = undefined;
      scoringStartedAt = undefined;
    } else if (idx === 15) {
      stage = 'Ingested';
      failedIngest = true; // Hard ingest failure
      errors = ['HTTP 502 Bad Gateway: ARMS Roster Ingestion socket drop', 'Missing authoritative digital signature'];
      ingestedAt = '2026-10-26T18:00:00Z';
      validatedAt = undefined;
      lockedAt = undefined;
      scoringStartedAt = undefined;
    } else if (idx <= 18) {
      stage = 'Locked';
      lockedAt = '2026-10-25T12:00:00Z';
      scoringStartedAt = undefined;
    } else if (idx <= 28) {
      stage = 'Scoring';
    } else {
      stage = 'Finalized';
      finalizedAt = '2026-10-26T12:00:00Z';
    }

    // Seed talent data for at least 20 candidates whose board is finalized or active
    const triVals: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
    const nBoxCells = ['Key Talent', 'High Potential', 'Core Talent', 'Solid Professional', 'Specialist / High Impact', 'Emerging Potential'];
    const readinessVals: ('Ready now' | '1-2 yrs' | '3+ yrs')[] = ['Ready now', '1-2 yrs', '3+ yrs'];

    const talent = {
      riskOfLoss: triVals[Math.floor(rng() * triVals.length)],
      impactOfLoss: triVals[Math.floor(rng() * triVals.length)],
      talentScore: Math.floor(70 + rng() * 26),
      nBoxCell: nBoxCells[Math.floor(rng() * nBoxCells.length)],
      advancementReadiness: readinessVals[Math.floor(rng() * readinessVals.length)]
    };

    // Skills
    const v: number[] = [];
    for (let d = 0; d < 8; d++) {
      v.push(Number((0.35 + rng() * 0.60).toFixed(2)));
    }

    // Scores
    const numScores = stage === 'Scoring' || stage === 'Finalized' ? Math.floor(2 + rng() * 4) : 0;
    const scores = [];
    for (let s = 0; s < numScores; s++) {
      scores.push({
        panelistId: `PANEL-0${(s % 6) + 1}`,
        value: Number((6.5 + Math.floor(rng() * 7) * 0.5).toFixed(1)),
        at: '2026-10-26T16:00:00Z'
      });
    }

    const fit = Math.floor(70 + rng() * 25);
    const mScore = Math.floor(68 + rng() * 26);

    result.push({
      id,
      dodId: `109824${idx.toString().padStart(4, '0')}`,
      name,
      grade,
      dafsc,
      pasCode: `SP${Math.floor(10 + rng() * 80)}OP${Math.floor(1 + rng() * 9)}X`,
      currentUnit: unit,
      lastAssignment: `${unit} / Operations Staff`,
      tig: `${Math.floor(3 + rng() * 3)}y ${Math.floor(rng() * 12)}m`,
      tafcsd: `${Math.floor(10 + rng() * 7)}y ${Math.floor(rng() * 12)}m`,
      dor: '2022-04-01',
      lookStatus: rng() > 0.7 ? '2nd Look' : '1st Look',
      performance: [
        { year: 2025, strat: '2/12 MAJ (P)', pctTop: 16 },
        { year: 2024, strat: '3/12 MAJ (P)', pctTop: 25 },
        { year: 2023, strat: '2/10 CAPT (DP)', pctTop: 20 }
      ],
      ropTrend: rng() > 0.5 ? 'Upward' : 'Consistent',
      decorations: ['Air and Space Commendation Medal with 1 OLC'],
      deployments: Math.floor(rng() * 3),
      jointTours: Math.floor(rng() * 2),
      shortTours: Math.floor(rng() * 2),
      timeline: [
        { year: 2024, role: 'Flight Commander', command: 'SpOC', missionArea: 'Orbital C2' },
        { year: 2021, role: 'Mission Director', command: 'SpOC', missionArea: 'Space Operations' }
      ],
      skills: [
        { cluster: 'Operational Planning', proficiency: 85, rarity: 0.8 },
        { cluster: 'Tactical C2', proficiency: 80, rarity: 0.75 }
      ],
      skillVector: v,
      badgeLevel: grade === 'LT COL' ? 'Master Space Operations' : 'Senior Space Operations',
      certs: ['Space Professional Development Level II'],
      pmeStatus: 'ILE Eligible',
      highestDegree: 'M.S. Operational Studies',
      academicDiscipline: 'Defense Analysis',
      pmeYear: 2026,
      llmFitScore: fit,
      mScore,
      confidence: { soi: 'High', rops: 'High', arms: 'High', surf: 'High' },
      featureDrivers: [
        { feature: 'Solid operational background with proven leadership in delta operations', weight: 0.40 }
      ],
      soi: {
        text: 'With over seven years of dedicated service across combat space operations and technical staff billets, I have led operational crews through contested space maneuvers and mission assurance checkpoints. My career objective is to expand leadership in orbital operations, joint space planning, or weapon system acquisitions. I am committed to advancing US Space Force warfighting doctrine and mentoring the next generation of space operators. I am prepared for assignments that require tactical precision, clear communication, and mission-first execution under dynamic joint operational environments.',
        date: '2026-10-15',
        wordCount: 142,
        tags: ['Operational planning', 'Tactical C2', 'Joint staff'],
        endorserQuote: 'Dependable and disciplined officer with strong operational acumen.',
        preferences: {
          billetIds: ['BIL-001', 'BIL-003', 'BIL-010'],
          locations: ['Schriever SFB, CO', 'Peterson SFB, CO'],
          willingOCONUS: rng() > 0.5
        }
      },
      chatSnapshot: {
        id: `CHAT-SNAPSHOT-v${idx}`,
        summary: [
          'Solid candidate with extensive squadron operations and crew leadership experience.',
          'Consistently evaluated in top third of peer group with strong technical grounding.',
          'Record meets all prerequisites for board advancement and billet matching.'
        ],
        strengths: ['Experienced crew commander', 'Reliable mission planner'],
        considerations: ['Typical middle-third competition across dense DAFSC pool.'],
        signedOffBy: null,
        signedOffAt: null
      },
      eligibility: { adverseActions: 'None', waivers: 'None', limitationCode: '00' },
      freshness: {
        soi: '2026-10-15T10:00:00Z',
        rops: '2026-10-21T09:00:00Z',
        arms: '2026-10-26T14:30:00Z',
        surf: '2026-10-25T08:00:00Z',
        milpds: '2026-10-25T11:00:00Z',
        myvector: '2026-10-26T19:10:00Z'
      },
      scores,
      myScore: null,
      flagged: false,
      packetReadiness: {
        eligibility: true,
        documents: !failedIngest && errors.length === 0,
        complete: !failedIngest && errors.length === 0,
        exceptions: errors
      },
      endorserId: `END-0${(i % 8) + 1}`,
      endorserRank: (i % 5) + 1,
      boardId: 'BRD-001',
      flow: {
        stage,
        ingestedAt,
        validatedAt,
        lockedAt,
        scoringStartedAt,
        finalizedAt,
        errors,
        failedIngest
      },
      talent
    });
  }

  return result;
}

export const ALL_CANDIDATES_SEED: Candidate[] = [
  ...(HANDWRITTEN_CANDIDATES as Candidate[]),
  ...generateRemainingCandidates()
];

// Milestones across all cycles, 2 per phase (computed on screen)
export function generateMilestones(): Milestone[] {
  const result: Milestone[] = [];
  const phases = [
    { p: 1 as const, name: 'Cycle Stand-Up & Billet Validation' },
    { p: 2 as const, name: 'PSDM Release & SOI Window' },
    { p: 3 as const, name: 'Roster Intake & Limitation Code Review' },
    { p: 4 as const, name: 'Record Prep & Freeze' },
    { p: 5 as const, name: 'Record Scoring Window' },
    { p: 6 as const, name: 'Order of Merit Build & Certification' },
    { p: 7 as const, name: 'Matching, Placement & Waivers' },
    { p: 8 as const, name: 'Results PSDM & AAR' }
  ];

  BOARDS_SEED.forEach(b => {
    phases.forEach((ph, pIdx) => {
      // 2 milestones per phase = 16 per cycle
      for (let m = 1; m <= 2; m++) {
        const id = `MS-${b.id}-${ph.p}-${m}`;
        let status: 'Done' | 'On Track' | 'At Risk' | 'Delayed' = 'On Track';

        if (b.status === 'Complete') {
          status = 'Done';
        } else if (ph.p < 3) {
          status = 'Done';
        } else if (ph.p === 3) {
          status = b.status === 'At Risk' ? 'At Risk' : 'Done';
        } else if (ph.p === 4) {
          status = b.status === 'Delayed' ? 'Delayed' : 'On Track';
        } else if (ph.p >= 5) {
          status = b.status === 'Delayed' ? 'Delayed' : 'On Track';
        }

        result.push({
          id,
          boardId: b.id,
          phase: ph.p,
          name: `${ph.name} Part ${m}`,
          owner: ph.p <= 2 ? 'BMO Lead' : ph.p === 3 ? 'Data Engineer' : ph.p === 4 ? 'Board Recorder' : 'Scoring Engineer',
          planned: `2026-${(10 + Math.floor(pIdx / 2)).toString().padStart(2, '0')}-15`,
          actual: status === 'Done' ? `2026-${(10 + Math.floor(pIdx / 2)).toString().padStart(2, '0')}-14` : null,
          dependsOn: m === 2 ? [`MS-${b.id}-${ph.p}-1`] : pIdx > 0 ? [`MS-${b.id}-${phases[pIdx - 1].p}-2`] : [],
          status
        });
      }
    });
  });

  return result;
}

export const RISKS_SEED: Risk[] = [
  // Open items: age buckets computed on screen
  {
    id: 'RSK-001',
    boardId: 'BRD-001',
    type: 'Issue',
    title: 'ARMS Authoritative Socket Timeout During Peak Population Pull',
    owner: 'BMO Lead',
    opened: '2026-10-15', // 11 days ago (<30d)
    suspense: '2026-11-01',
    mitigation: 'Implemented automated retry daemon and fallback to cached packet manifest.',
    escalate: false,
    status: 'Open'
  },
  {
    id: 'RSK-002',
    boardId: 'BRD-002',
    type: 'Risk',
    title: 'Panelist Quorum Conflict with Space Warfighter Conference',
    owner: 'Scoring Engineer',
    opened: '2026-10-20', // 6 days ago (<30d)
    suspense: '2026-11-10',
    mitigation: 'Secured 3 alternate evaluators from STARCOM Delta 1.',
    escalate: false,
    status: 'Open'
  },
  {
    id: 'RSK-003',
    boardId: 'BRD-003',
    type: 'Change',
    title: 'DARPA Billet Re-scoping for Cislunar Orbital Defense',
    owner: 'Assignments Officer',
    opened: '2026-09-20', // 36 days ago (30-60d)
    suspense: '2026-10-30',
    mitigation: 'Updated DAFSC eligibility filter to include 61C3.',
    escalate: false,
    status: 'Open'
  },
  {
    id: 'RSK-004',
    boardId: 'BRD-002',
    type: 'Issue',
    title: 'Missing Joint Staff Endorsement Memos for 4 OCONUS Candidates',
    owner: 'Integration Lead',
    opened: '2026-09-15', // 41 days ago (30-60d) -> Attention!
    suspense: '2026-10-31',
    mitigation: 'Overdue commander notification dispatched; follow-up escalated to S1.',
    escalate: true,
    status: 'Open'
  },
  {
    id: 'RSK-005',
    boardId: 'BRD-003',
    type: 'Issue',
    title: 'eBOSS Ingestion Template Schema Divergence on Space Cyber Certs',
    owner: 'Data Engineer',
    opened: '2026-09-08', // 48 days ago (30-60d) -> Attention!
    suspense: '2026-10-25',
    mitigation: 'Manual schema alignment patch undergoing integration testing.',
    escalate: true,
    status: 'Open'
  },
  {
    id: 'RSK-006',
    boardId: 'BRD-009',
    type: 'Issue',
    title: 'Adverse Action Limitation Code Resolution Stall (Over 60 Days)',
    owner: 'BMO Lead',
    opened: '2026-08-12', // 75 days ago (>60d) -> High Attention!
    suspense: '2026-09-30',
    mitigation: 'Immediate S1 adjudication conference required; holding slate lock.',
    escalate: true,
    status: 'Open'
  },
  // Closed issues
  {
    id: 'RSK-007',
    boardId: 'BRD-004',
    type: 'Risk',
    title: 'Physical Board Chamber Secure Terminal Outage',
    owner: 'Facility Security Officer',
    opened: '2026-08-20',
    suspense: '2026-08-25',
    mitigation: 'Shifted to secondary SCIF facility.',
    resolutionDate: '2026-08-24',
    escalate: false,
    status: 'Closed'
  },
  {
    id: 'RSK-008',
    boardId: 'BRD-011',
    type: 'Issue',
    title: 'MilPDS TAFCSD Calculation Glitch on Prior Service Transfers',
    owner: 'BMO Lead',
    opened: '2026-07-10',
    suspense: '2026-07-20',
    mitigation: 'Data reconciliation completed with the ARMS data owner.',
    resolutionDate: '2026-07-18',
    escalate: false,
    status: 'Closed'
  }
];

export const STAFF_SLOTS_SEED: StaffSlot[] = [
  { boardId: 'BRD-001', role: 'Board President', assigned: true, name: 'Maj Gen Travis E. Hayes' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Col Marcus Vance' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Lt Col Elena Rostova' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Lt Col David Sterling' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Maj Sarah Lin' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Maj Kevin O’Connor' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Lt Col Rachel Hayes' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Col Gregory Adams' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Lt Col Brian Vance' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Maj Nicole Chen' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Lt Col Thomas Scott' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Col Laura Miller' },
  { boardId: 'BRD-001', role: 'Panelist', assigned: true, name: 'Maj Richard Byrd' },
  // 12/14 assigned
  { boardId: 'BRD-001', role: 'Panelist', assigned: false },
  { boardId: 'BRD-001', role: 'Panelist', assigned: false },
  { boardId: 'BRD-001', role: 'Scribe', assigned: true, name: 'MSgt Daniel Rivera' },
  { boardId: 'BRD-001', role: 'Scribe', assigned: true, name: 'TSgt Amanda Foster' }
];

export const COMMANDER_ACTIONS_SEED: CommanderAction[] = [
  { id: 'CMD-01', candidateId: 'PDO-001', commander: 'Col Vance (Delta 9/CC)', due: '2026-10-24', status: 'Done' },
  { id: 'CMD-02', candidateId: 'PDO-004', commander: 'Col Drake (SSC/CC)', due: '2026-10-20', status: 'Pending' }, // Overdue 1
  { id: 'CMD-03', candidateId: 'PDO-009', commander: 'Brig Gen Arthur (PACAF/CC)', due: '2026-10-18', status: 'Pending' }, // Overdue 2
  { id: 'CMD-04', candidateId: 'PDO-011', commander: 'Col Vance (Delta 9/CC)', due: '2026-10-28', status: 'Done' },
  { id: 'CMD-05', candidateId: 'PDO-007', commander: 'Col Reed (Delta 2/CC)', due: '2026-11-01', status: 'Pending' }
];

export const IMPROVEMENT_ACTIONS_SEED: ImprovementAction[] = [
  {
    id: 'IMP-01',
    phase: 2,
    title: 'Automate eBOSS Population Cut Notification Dispatch',
    owner: 'BMO Lead',
    due: '2026-11-15',
    done: false,
    lessonLearned: 'Manual notifications resulted in 3-day delay during CY25 Fall Board.'
  },
  {
    id: 'IMP-02',
    phase: 4,
    title: 'Standardize Multi-Source Packet Hash Verification Protocol',
    owner: 'Board Recorder',
    due: '2026-10-30',
    done: true,
    lessonLearned: 'Discrepant document hashes between ARMS and SURF slowed packet lock.'
  },
  {
    id: 'IMP-03',
    phase: 5,
    title: 'Implement Live Anti-Anchoring Guard on Evaluation Docks',
    owner: 'Scoring Engineer',
    due: '2026-10-20',
    done: true,
    lessonLearned: 'Evaluator visibility into model score prior to rating skewed initial grades.'
  },
  {
    id: 'IMP-04',
    phase: 7,
    title: 'Post-Board Slating Automated Cascade Notification Engine',
    owner: 'Assignments Officer',
    due: '2026-12-01',
    done: false,
    lessonLearned: 'Candidate declinations triggered manual phone cascades taking over 14 days.'
  }
];

export const SAMPLE_CANONICAL_FILES: CanonicalFileRecord[] = [
  {
    id: 'FILE-001',
    originalName: 'Smith SOI final v3 (1).docx',
    fileSize: 45210,
    extension: 'docx',
    detectedDocType: 'SOI',
    canonicalName: '02SOI_20261014_smith-tyler-statement-of-intent.docx',
    targetNode: '02SOI',
    checkResult: 'PASS',
    reason: 'Recognized SOI template format, valid date extracted, mapped to node 02SOI',
    committed: false
  },
  {
    id: 'FILE-002',
    originalName: 'ROP_2025.pdf',
    fileSize: 182300,
    extension: 'pdf',
    detectedDocType: 'ROPs',
    canonicalName: '03ROP_20251231_officer-performance-report-2025.pdf',
    targetNode: '03ROP',
    checkResult: 'PASS',
    reason: 'Approved evaluation record with official digital seal, mapped to node 03ROP',
    committed: false
  },
  {
    id: 'FILE-003',
    originalName: 'psdm draft.docx',
    fileSize: 84120,
    extension: 'docx',
    detectedDocType: 'PSDM',
    canonicalName: '08PUB_20261026_draft-psdm-ile-selection-memo.docx',
    targetNode: '08PUB',
    checkResult: 'WARN',
    reason: 'Draft publication missing final releasing authority signature; human sign-off required',
    committed: false
  },
  {
    id: 'FILE-004',
    originalName: 'SURF export 10-14.xlsx',
    fileSize: 312000,
    extension: 'xlsx',
    detectedDocType: 'SURF',
    canonicalName: '04SURF_20261014_single-unified-record-export.xlsx',
    targetNode: '04SURF',
    checkResult: 'PASS',
    reason: 'Authoritative data schema matches ARMS standard tables',
    committed: false
  },
  {
    id: 'FILE-005',
    originalName: 'unsupported_binary_dump.bin',
    fileSize: 524000,
    extension: 'bin',
    detectedDocType: 'UNKNOWN',
    canonicalName: '00SRT_20261026_unsupported-binary-dump.bin',
    targetNode: '00SRT',
    checkResult: 'FAIL',
    reason: 'Unapproved file extension (.bin) rejected by eBOSS security gateway',
    committed: false
  },
  {
    id: 'FILE-006',
    originalName: 'Smith SOI final v3 (1).docx', // Duplicate!
    fileSize: 45210,
    extension: 'docx',
    detectedDocType: 'SOI',
    canonicalName: '02SOI_20261014_smith-tyler-statement-of-intent-dup.docx',
    targetNode: '02SOI',
    checkResult: 'WARN',
    reason: 'Duplicate file hash detected in incoming queue; potential overwrite risk',
    committed: false
  },
  {
    id: 'FILE-007',
    originalName: 'arms_flight_qual_log_2026.pdf',
    fileSize: 94000,
    extension: 'pdf',
    detectedDocType: 'ARMS',
    canonicalName: '05ARMS_20261026_arms-flight-qual-log-2026.pdf',
    targetNode: '05ARMS',
    checkResult: 'PASS',
    reason: 'Valid aviation/ops credential record verified against ARMS gateway',
    committed: false
  },
  {
    id: 'FILE-008',
    originalName: 'scoring_summary_sheet.csv',
    fileSize: 22100,
    extension: 'csv',
    detectedDocType: 'UNKNOWN',
    canonicalName: '06SCR_20261026_scoring-summary-sheet.csv',
    targetNode: '06SCR',
    checkResult: 'PASS',
    reason: 'Score matrix ingested for reconciliation',
    committed: false
  }
];
