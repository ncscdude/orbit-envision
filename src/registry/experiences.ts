/**
 * Project ORBIT - Experience Registry
 * Navigation is generated dynamically from this registry, filtered by current role.
 * Roadmap experiences appear in the Experience Catalog drawer only.
 */

import { ExperienceDef } from '../types';

export const EXPERIENCES: ExperienceDef[] = [
  // Live Experiences
  {
    id: 'EXP-001',
    ideaId: null,
    viewId: 'VIEW-CommandCenter',
    title: 'Command Center',
    group: 'Leadership',
    roles: ['Panelist', 'Board Recorder', 'BMO Lead', 'Assignments Officer', 'HQ Strategic Viewer', 'CFM / Career Planner'],
    question: 'How is the entire board portfolio performing across phases, milestones, and risks?',
    metricIds: ['M-501', 'M-502', 'M-504', 'K-01', 'K-02', 'K-03', 'K-05', 'K-10'],
    status: 'Live',
    demoStep: 'Review executive KPI cards, 8-phase workflow bar, and drill down to candidate records.'
  },
  {
    id: 'EXP-002',
    ideaId: null,
    viewId: 'VIEW-CandidateQueue',
    title: 'Candidate Queue',
    group: 'Board',
    roles: ['Panelist', 'Board Recorder', 'BMO Lead', 'Assignments Officer'],
    question: 'Which candidates in the active cycle are pending, scored, or flagged for review?',
    metricIds: ['M-401', 'M-402', 'M-403', 'M-204'],
    status: 'Live',
    demoStep: 'Select a board cycle, filter candidates, or perform a cryptographically seeded random shuffle.'
  },
  {
    id: 'EXP-003',
    ideaId: null,
    viewId: 'VIEW-PanelReview',
    title: 'Panel Workspace',
    group: 'Board',
    roles: ['Panelist', 'Board Recorder', 'BMO Lead'],
    question: 'What is the full evidence package for this candidate across all eight analytical lenses?',
    metricIds: ['M-406', 'M-301', 'M-302', 'M-303', 'M-304', 'M-404', 'M-405'],
    status: 'Live',
    demoStep: 'Examine candidate SOI & ROPs, review AI synthesis snapshot, and submit an anti-anchored score.'
  },
  {
    id: 'EXP-004',
    ideaId: 'IDEA-001', // covers IDEA-001, IDEA-002, IDEA-003
    viewId: 'VIEW-HeliosCommand',
    title: 'HELIOS Command',
    group: 'Leadership',
    roles: ['BMO Lead', 'Board Recorder', 'HQ Strategic Viewer'],
    question: 'Are ingestion pipelines flowing, authoritative sources fresh, and cycles staffed to lock?',
    metricIds: ['M-101', 'M-102', 'M-103', 'M-104', 'M-105', 'M-106', 'M-201', 'M-202', 'M-203', 'M-204', 'M-205', 'M-301', 'M-302', 'M-303', 'M-304', 'M-501', 'M-502', 'M-503', 'M-504', 'M-505'],
    status: 'Live',
    demoStep: 'Inspect the 5-stage funnel, test pipeline retries, view source latency bars, and verify staffing lock gates.'
  },
  {
    id: 'EXP-005',
    ideaId: null,
    viewId: 'VIEW-ScoringAudit',
    title: 'Scoring Audit',
    group: 'Audit',
    roles: ['BMO Lead', 'Board Recorder'],
    question: 'Where do panel evaluators diverge severely (>1.5 pts) and how are heartburn cases resolved?',
    metricIds: ['M-401', 'M-402', 'M-403'],
    status: 'Live',
    demoStep: 'Adjudicate heartburn outliers or run the 4-step Parity Breach Rollback Playbook.'
  },
  {
    id: 'EXP-006',
    ideaId: null,
    viewId: 'VIEW-MatchLab',
    title: 'Match Lab',
    group: 'Assignments',
    roles: ['Assignments Officer', 'BMO Lead', 'CFM / Career Planner'],
    question: 'Which candidate best fits each critical billet and what happens if weights or availability change?',
    metricIds: ['M-504'],
    status: 'Live',
    demoStep: 'Adjust match weight sliders, test Gale-Shapley stability, explore near-fit gaps, and export a draft PSDM.'
  },
  {
    id: 'EXP-007',
    ideaId: 'IDEA-004',
    viewId: 'VIEW-CrossAnalytics',
    title: 'Cross Analytics',
    group: 'Leadership',
    roles: ['BMO Lead', 'Board Recorder', 'Panelist', 'HQ Strategic Viewer'],
    question: 'How does candidate talent distribute across radar attributes, 2D constellations, and endorser scale?',
    metricIds: ['M-404', 'M-405'],
    status: 'Live',
    demoStep: 'Compare 2-4 candidates on radar, inspect the scatter quadrant, and evaluate endorser top-3 scale.'
  },
  {
    id: 'EXP-008',
    ideaId: 'IDEA-005',
    viewId: 'VIEW-CareerPlanner',
    title: 'Career Planner N-Box',
    group: 'Talent',
    roles: ['CFM / Career Planner', 'Assignments Officer'], // Firewalled from Panelist!
    question: 'Who is key talent, who might leave, and what is the operational impact if they do?',
    metricIds: ['M-601', 'M-602', 'M-603', 'M-604', 'M-605'],
    status: 'Live',
    demoStep: 'Analyze the 3x3 Performance-Potential N-Box grid, Risk-Impact matrix, and advancement readiness horizons.'
  },
  {
    id: 'EXP-009',
    ideaId: null,
    viewId: 'VIEW-OpsRegisters',
    title: 'Operations Registers',
    group: 'Leadership',
    roles: ['Board Recorder', 'BMO Lead', 'HQ Strategic Viewer'],
    question: 'What are the planned vs actual milestone timelines, open risks, and phase 8 improvement actions?',
    metricIds: ['K-01', 'K-10', 'K-11'],
    status: 'Live',
    demoStep: 'Edit milestone suspense dates, review risk aging buckets, and log phase 8 lessons learned.'
  },
  {
    id: 'EXP-010',
    ideaId: null,
    viewId: 'VIEW-DeltaLedger',
    title: 'DELTA Ledger',
    group: 'Audit',
    roles: ['Panelist', 'Board Recorder', 'BMO Lead', 'Assignments Officer', 'HQ Strategic Viewer', 'CFM / Career Planner'],
    question: 'Is the cryptographic chain of human and algorithmic decisions intact and auditable?',
    metricIds: [],
    status: 'Live',
    demoStep: 'Verify cryptographic SHA-256 chain, replay historical states, and canonicalize unformatted incoming files.'
  },
  {
    id: 'EXP-011',
    ideaId: null,
    viewId: 'VIEW-BoardDetail',
    title: 'Board Statistics & Roles',
    group: 'Board',
    roles: ['Panelist', 'Board Recorder', 'BMO Lead', 'Assignments Officer', 'HQ Strategic Viewer', 'CFM / Career Planner'],
    question: 'What are the individual board statistics, stage-gate health, scoring velocity, and role permission boundaries?',
    metricIds: ['M-501', 'M-504', 'M-401', 'M-402', 'M-403'],
    status: 'Live',
    demoStep: 'Drill down into individual board statistics, review role governance matrix, and verify Rule 5 firewalls.'
  },

  // Roadmap Experiences (Proposed / Parked - shown only in Experience Catalog Drawer)
  {
    id: 'EXP-012',
    ideaId: 'IDEA-006',
    viewId: 'VIEW-PanelistWorkload',
    title: 'Panelist Workload Balancer',
    group: 'Board',
    roles: ['BMO Lead', 'Board Recorder'],
    question: 'Are records spread fairly across panelists, and will scoring finish inside the execution window?',
    metricIds: ['K-06'],
    status: 'Roadmap'
  },
  {
    id: 'EXP-012',
    ideaId: 'IDEA-007',
    viewId: 'VIEW-BoardCalendar',
    title: 'Board Calendar & Conflict Detector',
    group: 'Leadership',
    roles: ['BMO Lead', 'HQ Strategic Viewer'],
    question: 'Do overlapping cycles collide on people, dates, or data refreshes?',
    metricIds: ['M-504'],
    status: 'Roadmap'
  },
  {
    id: 'EXP-013',
    ideaId: 'IDEA-008',
    viewId: 'VIEW-SuccessionBench',
    title: 'Succession Bench by Billet',
    group: 'Assignments',
    roles: ['Assignments Officer', 'CFM / Career Planner'],
    question: 'For each critical billet, who is ready now, ready in 1 to 2 years, and ready in 3 or more?',
    metricIds: ['M-605'],
    status: 'Roadmap'
  },
  {
    id: 'EXP-014',
    ideaId: 'IDEA-009',
    viewId: 'VIEW-DataConflictFinder',
    title: 'Data Conflict Finder',
    group: 'Leadership',
    roles: ['BMO Lead', 'Board Recorder'],
    question: 'Where do two authoritative sources disagree about the same person (e.g. TIG in ARMS vs MilPDS)?',
    metricIds: [],
    status: 'Roadmap'
  },
  {
    id: 'EXP-015',
    ideaId: 'IDEA-010',
    viewId: 'VIEW-CascadeTracker',
    title: 'Activation & Declination Cascade Tracker',
    group: 'Assignments',
    roles: ['Assignments Officer'],
    question: 'When a candidate declines or defers, what happens downstream and how long are cases open?',
    metricIds: ['K-09'],
    status: 'Roadmap'
  },
  {
    id: 'EXP-016',
    ideaId: 'IDEA-011',
    viewId: 'VIEW-ExecutiveBriefGen',
    title: 'Executive Brief Generator',
    group: 'Leadership',
    roles: ['HQ Strategic Viewer', 'BMO Lead'],
    question: 'What does leadership need to know this week, in one structured page?',
    metricIds: ['M-501', 'M-504'],
    status: 'Roadmap'
  },
  {
    id: 'EXP-017',
    ideaId: 'IDEA-012',
    viewId: 'VIEW-LessonsLibrary',
    title: 'Lessons Learned Library',
    group: 'Leadership',
    roles: ['BMO Lead', 'Board Recorder'],
    question: 'What did earlier cycles learn that applies to the cycle we are about to run?',
    metricIds: ['K-11'],
    status: 'Roadmap'
  },
  {
    id: 'EXP-018',
    ideaId: 'IDEA-013',
    viewId: 'VIEW-PanelistRehearsal',
    title: 'Panelist Rehearsal Mode',
    group: 'Board',
    roles: ['Panelist', 'BMO Lead'],
    question: 'Can a new panelist practice scoring on sample records and see how they compare before the real board?',
    metricIds: [],
    status: 'Roadmap'
  }
];

export const ASSUMPTIONS_AND_QUESTIONS = [
  {
    id: 1,
    topic: 'Stratification Percentages Discrepancy',
    text: 'Stratification reference values in catalog (DP 29%, P 62%, Non-Strat 18%) sum to 109%. Model normalizes active seed shares to 100% (DP 29%, P 53%, Non-Strat 18%) and documents the variance.'
  },
  {
    id: 2,
    topic: 'N-Box Grid Dimensions & Labels',
    text: 'N-Box axes are not formally codified in raw specifications. Implemented as standard DoD 3x3 Performance by Potential grid with configurable cell designations (e.g., Key Talent, High Potential, Core Talent).'
  },
  {
    id: 3,
    topic: 'ARMS Acronym Expansion',
    text: 'The catalog references ARMS as "Aviation Resource Management". We retain the authoritative designation "ARMS" and notify data owners to confirm space qualification expansion.'
  },
  {
    id: 4,
    topic: 'Open Issues Requiring Attention Definition',
    text: 'Open Issues Requiring Attention is computed as open items aged 30 days or more beyond suspense (seed contains 2 between 30-60d and 1 over 60d = 3 total requiring attention).'
  },
  {
    id: 5,
    topic: 'Talent Score Scaling',
    text: 'Talent Score scale is undefined in source; normalized to 0 to 100 advisory range.'
  },
  {
    id: 6,
    topic: 'Authoritative Screenshot Grounding',
    text: 'Visual layouts faithfully reproduce metric definitions and workflow models directly from catalog specifications.'
  }
];
