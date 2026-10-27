/**
 * Project ORBIT - Operational Repository for Boards & Talent
 * TypeScript Core Domain Types
 */

export type Role =
  | 'Panelist'
  | 'Board Recorder'
  | 'BMO Lead'
  | 'Assignments Officer'
  | 'HQ Strategic Viewer'
  | 'CFM / Career Planner';

export type Lvl = 'High' | 'Med' | 'Low';
export type Tri = 'High' | 'Medium' | 'Low';
export type StageGate = 'Ingested' | 'Validated' | 'Locked' | 'Scoring' | 'Finalized';

export interface PerformanceRating {
  year: number;
  strat: string;
  pctTop: number;
}

export interface CareerMilestone {
  year: number;
  role: string;
  command: string;
  missionArea: string;
}

export interface CandidateSkill {
  cluster: string;
  proficiency: number; // 0-100
  rarity: number; // 0-1
}

export interface CandidateScore {
  panelistId: string;
  value: number; // 6.0 to 10.0, 0.5 steps
  at: string;
}

export interface Candidate {
  id: string; // e.g. PDO-001
  dodId: string;
  name: string;
  grade: 'CAPT' | 'MAJ' | 'LT COL' | 'MSGT' | 'SMSGT';
  dafsc: string;
  pasCode: string; // 8 chars XX#XX#X#
  currentUnit: string;
  lastAssignment: string;
  tig: string; // e.g. 4y 2m
  tafcsd: string; // e.g. 14y 7m
  dor: string; // Date of Rank
  lookStatus: '1st Look' | '2nd Look' | 'Below Zone';
  performance: PerformanceRating[];
  ropTrend: 'Upward' | 'Consistent' | 'Mixed';
  decorations: string[];
  deployments: number;
  jointTours: number;
  shortTours: number;
  timeline: CareerMilestone[];
  skills: CandidateSkill[];
  skillVector: number[]; // 8 dims (0.0 to 1.0)
  badgeLevel: string; // Basic, Senior, Master Space Ops
  certs: string[];
  pmeStatus: 'SDE Complete' | 'ILE Eligible' | 'ILE In Progress';
  highestDegree: string;
  academicDiscipline: string;
  pmeYear: number;
  llmFitScore: number; // 0 to 100
  mScore: number;
  confidence: {
    soi: Lvl;
    rops: Lvl;
    arms: Lvl;
    surf: Lvl;
  };
  featureDrivers: { feature: string; weight: number }[];
  soi: {
    text: string;
    date: string;
    wordCount: number;
    tags: string[];
    endorserQuote: string;
    preferences: {
      billetIds: string[];
      locations: string[];
      willingOCONUS: boolean;
    };
  };
  chatSnapshot: {
    id: string;
    summary: [string, string, string];
    strengths: string[];
    considerations: string[];
    signedOffBy: string | null;
    signedOffAt: string | null;
  };
  eligibility: {
    adverseActions: string;
    waivers: string;
    limitationCode: string;
  };
  freshness: {
    soi: string;
    rops: string;
    arms: string;
    surf: string;
    milpds: string;
    myvector: string;
  };
  scores: CandidateScore[];
  myScore: number | null;
  flagged: boolean;
  flagReason?: string;
  packetReadiness: {
    eligibility: boolean;
    documents: boolean;
    complete: boolean;
    exceptions: string[];
  };
  endorserId: string;
  endorserRank: number | null; // rank within endorser's unit list
  boardId: string;
  flow: {
    stage: StageGate;
    ingestedAt: string;
    validatedAt?: string;
    lockedAt?: string;
    scoringStartedAt?: string;
    finalizedAt?: string;
    errors: string[];
    failedIngest: boolean;
  };
  // Firewalled Talent Data (Rule 5)
  talent?: {
    riskOfLoss: Tri;
    impactOfLoss: Tri;
    talentScore: number;
    nBoxCell: string;
    advancementReadiness: 'Ready now' | '1-2 yrs' | '3+ yrs';
    talentNote?: string;
  };
}

export interface Billet {
  id: string; // BIL-001
  title: string;
  unit: string;
  location: string;
  oconus: boolean;
  dafscRequired: string[];
  gradeRange: [string, string];
  requiredSkills: { cluster: string; minProficiency: number }[];
  preferredTags: string[];
  priority: 'Critical' | 'High' | 'Routine';
  fillByDate: string;
  skillVector: number[]; // 8 dims
}

export interface Board {
  id: string; // BRD-001
  name: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Complete';
  startDate: string;
  lockDate: string;
  releaseDate: string;
  ownerId: string;
  candidateCount: number;
}

export interface Milestone {
  id: string;
  boardId: string;
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  name: string;
  owner: string;
  planned: string;
  actual: string | null;
  dependsOn: string[];
  status: 'Done' | 'On Track' | 'At Risk' | 'Delayed';
}

export interface Risk {
  id: string;
  boardId: string;
  type: 'Risk' | 'Issue' | 'Change';
  title: string;
  owner: string;
  opened: string;
  suspense: string;
  mitigation: string;
  resolutionDate?: string;
  escalate: boolean;
  status: 'Open' | 'Closed';
}

export interface SourcePipeline {
  id: 'ARMS' | 'MilPDS' | 'MyVector' | 'SURF';
  authoritativeSource: string;
  lastSyncAt: string;
}

export interface Endorser {
  id: string;
  name: string;
  unit: string;
  top3SharePct: number;
  stratMix: { dpPct: number; pPct: number; nonStratPct: number };
}

export interface StaffSlot {
  boardId: string;
  role: 'Board President' | 'Panelist' | 'Scribe';
  assigned: boolean;
  name?: string;
}

export interface CommanderAction {
  id: string;
  candidateId: string;
  commander: string;
  due: string;
  status: 'Pending' | 'Done';
}

export interface ImprovementAction {
  id: string;
  phase: number;
  title: string;
  owner: string;
  due: string;
  done: boolean;
  lessonLearned?: string;
}

export type DeltaType =
  | 'SCORE_SUBMIT'
  | 'SCORE_REVISE'
  | 'FLAG'
  | 'SNAPSHOT_SIGNOFF'
  | 'SNAPSHOT_REVOKE'
  | 'SHUFFLE'
  | 'MATCH_APPROVE'
  | 'MATCH_OVERRIDE'
  | 'MATCH_UNMATCH'
  | 'SCENARIO_RUN'
  | 'SCENARIO_PROMOTE'
  | 'HEARTBURN_ADJUDICATE'
  | 'ROLLBACK'
  | 'PSDM_EXPORT'
  | 'FILE_ROUTED'
  | 'MILESTONE_UPDATE'
  | 'RISK_UPDATE'
  | 'KPI_EDIT'
  | 'IMPROVEMENT_ACTION'
  | 'PIPELINE_RETRY'
  | 'POPULATION_LOCK'
  | 'COMMANDER_ACTION_UPDATE'
  | 'TALENT_NOTE'
  | 'BOARD_OOM_CERTIFY'
  | 'BOARD_EXCEPTIONS_CLEAR'
  | 'BOARD_ROLE_OVERRIDE'
  | 'ROLE_CHANGE'
  | 'ACCESS_DENIED';

// Role recorded on a DELTA entry. 'Unmapped' is used only when access is denied
// because the identity has no ORBIT role.
export type LedgerRole = Role | 'Unmapped';

export type AccessDenialReason = 'UNKNOWN_IDENTITY' | 'UNMAPPED_ROLE';

export interface BoardRolePermission {
  role: Role;
  accessLevel: 'FULL_ADMIN' | 'OPERATIONS_AUDIT' | 'EVALUATOR_FIREWALLED' | 'SLATING_ASSIGNMENTS' | 'EXECUTIVE_READONLY' | 'TALENT_MANAGEMENT';
  title: string;
  badgeColor: string;
  canLockPopulation: boolean;
  canCertifyOom: boolean;
  canScoreCandidates: boolean;
  canEditMilestones: boolean;
  canManageRisks: boolean;
  canViewTalentLossData: boolean;
  canExportAuditPackage: boolean;
  canRebalanceDocket: boolean;
  firewallActive: boolean;
  description: string;
  restrictions: string[];
  allowedActions: string[];
}

export interface BoardStatistics {
  boardId: string;
  name: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Complete';
  startDate: string;
  lockDate: string;
  releaseDate: string;
  ownerId: string;
  totalCandidates: number;
  stageCounts: {
    ingested: number;
    validated: number;
    locked: number;
    scoring: number;
    finalized: number;
  };
  stagePercentages: {
    ingested: number;
    validated: number;
    locked: number;
    scoring: number;
    finalized: number;
  };
  packetReadiness: {
    eligibilityRate: number;
    documentsRate: number;
    completenessRate: number;
    exceptionsCount: number;
    readyToLock: boolean;
  };
  scoring: {
    scoredCount: number;
    pendingCount: number;
    flaggedCount: number;
    completionRate: number;
    poolAvgScore: number;
    panelAvgScore: number;
    userAvgScore: number | null;
    scoreSpread: { min: number; max: number; stdDev: number };
    heartburnCount: number;
    scoringPacePerHour: number;
    estimatedHoursRemaining: number;
    onTrackForLock: boolean;
  };
  milestones: {
    totalCount: number;
    doneCount: number;
    onTrackCount: number;
    atRiskCount: number;
    delayedCount: number;
    completionRate: number;
    currentPhase: number;
    criticalPathSlippageDays: number;
  };
  risks: {
    totalOpen: number;
    under30Days: number;
    thirtyTo60Days: number;
    over60Days: number;
    escalatedCount: number;
  };
  staffing: {
    presidentAssigned: boolean;
    panelistSlots: string;
    scribesAssigned: boolean;
    allStaffed: boolean;
  };
  sourceFreshness: {
    arms: { lastSyncHoursAgo: number; status: 'green' | 'amber' | 'red' };
    milpds: { lastSyncHoursAgo: number; status: 'green' | 'amber' | 'red' };
    myvector: { lastSyncHoursAgo: number; status: 'green' | 'amber' | 'red' };
    surf: { lastSyncDaysAgo: number; status: 'green' | 'amber' | 'red' };
  };
}

export interface DeltaEntry {
  id: string; // DELTA-000123
  timestamp: string; // Zulu ISO
  actor: string;
  role: LedgerRole;
  targetId: string;
  type: DeltaType;
  summary: string;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export interface MatchPair {
  candidateId: string;
  billetId: string;
  score: number;
  isAiProposed: boolean;
  approved: boolean;
  overridden: boolean;
  overrideReason?: string;
  fragilityPercent: number; // Sensitivity % holds
}

export interface MatchScenarioWeights {
  oomRank: number; // 0.0 - 1.0
  soiOverlap: number;
  skillFit: number;
  dafscGradeFit: number;
  candidatePref: number;
  billetPriority: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  weights: MatchScenarioWeights;
  matches: MatchPair[];
}

export interface KpiCatalogItem {
  id: string; // K-01 to K-11
  phase: string;
  kpi: string;
  numerator: string;
  denominator: string;
  timeframe: string;
  likelyDataSource: string;
  accountableDataOwner: string;
  computedValue?: string;
  drillFilter?: string;
}

export interface CanonicalFileRecord {
  id: string;
  originalName: string;
  fileSize: number;
  extension: string;
  detectedDocType: 'SOI' | 'ROPs' | 'SURF' | 'ARMS' | 'PSDM' | 'UNKNOWN';
  canonicalName: string;
  targetNode: string; // 00SRT, 01INT, etc.
  checkResult: 'PASS' | 'WARN' | 'FAIL';
  reason: string;
  routedAt?: string;
  committed: boolean;
}

export interface ExperienceDef {
  id: string;
  ideaId: string | null;
  viewId: string;
  title: string;
  group: 'Leadership' | 'Board' | 'Assignments' | 'Talent' | 'Audit';
  roles: Role[];
  question: string;
  metricIds: string[];
  status: 'Live' | 'Roadmap';
  demoStep?: string;
}

export interface MetricDef {
  id: string;
  name: string;
  unit: string;
  formula: string;
  target?: string;
  thresholds?: { amber: number; red: number; direction: 'above' | 'below' };
  owner: string;
  sourceRef: string;
  compute: (state: AppState) => MetricValue;
}

export interface MetricValue {
  raw: number | string | boolean;
  formatted: string;
  status: 'green' | 'amber' | 'red' | 'neutral';
  tooltip?: string;
  details?: string;
}

export interface AppState {
  currentRole: Role;
  actorName: string;
  userId: string; // from the identity adapter; '' until first resolved
  accessDenial: AccessDenialReason | null; // set when the identity has no ORBIT access
  activeViewId: string;
  selectedBoardId: string;
  selectedCandidateId: string | null;
  timeDisplay: 'zulu' | 'local';

  // Core Data
  candidates: Candidate[];
  billets: Billet[];
  boards: Board[];
  milestones: Milestone[];
  risks: Risk[];
  sources: SourcePipeline[];
  endorsers: Endorser[];
  staffSlots: StaffSlot[];
  commanderActions: CommanderAction[];
  improvementActions: ImprovementAction[];
  kpis: KpiCatalogItem[];
  canonicalFiles: CanonicalFileRecord[];

  // Match Lab State
  activeProposalMode: 'Official' | 'Sandbox';
  officialMatches: MatchPair[];
  sandboxMatches: MatchPair[];
  matchWeights: MatchScenarioWeights;
  savedScenarios: SavedScenario[];
  matchingAlgorithm: 'greedy' | 'stable';
  showTalentOverlayInMatchLab: boolean;

  // Ledger & Verification
  ledger: DeltaEntry[];
  chainTampered: boolean;
  replayIndex: number | null; // For timeline scrubber

  // UI state
  candidateFilterText: string;
  candidateFilterStatus: 'All' | 'Pending' | 'Scored' | 'Flagged';
  candidateFilterMinFit: number;
  candidateFilterPme: string;
  candidateFilterPacket: 'All' | 'Complete' | 'Exceptions';
  lastShuffleSeed: string | null;
}
