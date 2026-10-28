/**
 * Project ORBIT - Board Statistics & Permission Roles Service
 * Computes individual board performance metrics, stage-gate health,
 * scoring analytics, and enforces board-level role permissions and firewalls.
 */

import { AppState, BoardStatistics, BoardRolePermission, Role } from '../types';

/**
 * Computes detailed operational and scoring statistics for any individual board (every BRD cycle).
 */
export function computeBoardStatistics(boardId: string, state: AppState): BoardStatistics {
  const board = state.boards.find(b => b.id === boardId) || state.boards[0];
  const candidatesInBoard = state.candidates.filter(c => c.boardId === boardId);

  // If the board has real candidate objects in the pool (e.g. BRD-001 has 36), compute from them.
  // Otherwise, compute deterministic values derived from the board's status, dates, and candidateCount.
  let stageCounts = {
    ingested: 0,
    validated: 0,
    locked: 0,
    scoring: 0,
    finalized: 0
  };

  let scoredCount = 0;
  let pendingCount = 0;
  let flaggedCount = 0;
  let poolScores: number[] = [];
  const userScores: number[] = [];
  let exceptionsCount = 0;
  let eligibleCount = 0;
  let docsCompleteCount = 0;
  let heartburnCount = 0;

  if (candidatesInBoard.length > 0) {
    candidatesInBoard.forEach(c => {
      // Stage Counts
      const stage = c.flow.stage.toLowerCase() as keyof typeof stageCounts;
      if (stageCounts[stage] !== undefined) {
        stageCounts[stage]++;
      }

      // Packet Readiness
      if (c.packetReadiness.eligibility) eligibleCount++;
      if (c.packetReadiness.documents) docsCompleteCount++;
      if (c.packetReadiness.exceptions.length > 0) {
        exceptionsCount += c.packetReadiness.exceptions.length;
      }

      // Scoring
      if (c.myScore !== null) {
        userScores.push(c.myScore);
      }
      if (c.scores.length > 0) {
        scoredCount++;
        c.scores.forEach(s => poolScores.push(s.value));
        const panelAvg = c.scores.reduce((sum, s) => sum + s.value, 0) / c.scores.length;
        if (c.myScore !== null && Math.abs(c.myScore - panelAvg) >= 1.5) {
          heartburnCount++;
        }
      } else {
        pendingCount++;
      }

      if (c.flagged) flaggedCount++;
    });
  } else {
    // Deterministic simulation for portfolio boards based on status & candidate count
    const total = board.candidateCount;
    if (board.status === 'Complete') {
      stageCounts = { ingested: 0, validated: 0, locked: 0, scoring: 0, finalized: total };
      scoredCount = total;
      pendingCount = 0;
      eligibleCount = total;
      docsCompleteCount = total;
      exceptionsCount = 0;
      poolScores = [8.0, 8.5, 9.0, 7.5, 8.0, 8.5];
    } else if (board.status === 'Delayed') {
      const fin = Math.floor(total * 0.1);
      const scr = Math.floor(total * 0.3);
      const lck = Math.floor(total * 0.2);
      const val = Math.floor(total * 0.25);
      const ing = total - (fin + scr + lck + val);
      stageCounts = { ingested: ing, validated: val, locked: lck, scoring: scr, finalized: fin };
      scoredCount = fin + Math.floor(scr * 0.5);
      pendingCount = total - scoredCount;
      eligibleCount = Math.floor(total * 0.88);
      docsCompleteCount = Math.floor(total * 0.82);
      exceptionsCount = 5;
      heartburnCount = 2;
      poolScores = [7.5, 8.0, 7.0, 8.5, 6.5];
    } else if (board.status === 'At Risk') {
      const fin = Math.floor(total * 0.15);
      const scr = Math.floor(total * 0.45);
      const lck = Math.floor(total * 0.25);
      const val = Math.floor(total * 0.1);
      const ing = total - (fin + scr + lck + val);
      stageCounts = { ingested: ing, validated: val, locked: lck, scoring: scr, finalized: fin };
      scoredCount = fin + Math.floor(scr * 0.6);
      pendingCount = total - scoredCount;
      eligibleCount = Math.floor(total * 0.92);
      docsCompleteCount = Math.floor(total * 0.89);
      exceptionsCount = 3;
      heartburnCount = 1;
      poolScores = [7.8, 8.2, 8.6, 7.4];
    } else {
      // On Track
      const fin = Math.floor(total * 0.2);
      const scr = Math.floor(total * 0.55);
      const lck = Math.floor(total * 0.2);
      const val = Math.floor(total * 0.05);
      const ing = total - (fin + scr + lck + val);
      stageCounts = { ingested: ing, validated: val, locked: lck, scoring: scr, finalized: fin };
      scoredCount = fin + Math.floor(scr * 0.7);
      pendingCount = total - scoredCount;
      eligibleCount = Math.floor(total * 0.98);
      docsCompleteCount = Math.floor(total * 0.96);
      exceptionsCount = 1;
      poolScores = [8.2, 8.4, 8.8, 7.9, 8.5];
    }
  }

  const totalCandidates = candidatesInBoard.length > 0 ? candidatesInBoard.length : board.candidateCount;
  const safeTotal = Math.max(1, totalCandidates);

  const stagePercentages = {
    ingested: Math.round((stageCounts.ingested / safeTotal) * 100),
    validated: Math.round((stageCounts.validated / safeTotal) * 100),
    locked: Math.round((stageCounts.locked / safeTotal) * 100),
    scoring: Math.round((stageCounts.scoring / safeTotal) * 100),
    finalized: Math.round((stageCounts.finalized / safeTotal) * 100)
  };

  const poolAvg = poolScores.length > 0
    ? Number((poolScores.reduce((sum, v) => sum + v, 0) / poolScores.length).toFixed(2))
    : 8.1;

  const userAvg = userScores.length > 0
    ? Number((userScores.reduce((sum, v) => sum + v, 0) / userScores.length).toFixed(2))
    : null;

  // StdDev
  const variance = poolScores.length > 1
    ? poolScores.reduce((sum, v) => sum + Math.pow(v - poolAvg, 2), 0) / poolScores.length
    : 0.36;
  const stdDev = Number(Math.sqrt(variance).toFixed(2));
  const minScore = poolScores.length > 0 ? Math.min(...poolScores) : 6.5;
  const maxScore = poolScores.length > 0 ? Math.max(...poolScores) : 9.5;

  const completenessRate = Math.min(100, Math.round((docsCompleteCount / safeTotal) * 100));
  const eligibilityRate = Math.min(100, Math.round((eligibleCount / safeTotal) * 100));
  const documentsRate = completenessRate;
  const readyToLock = completenessRate >= 95;

  // Board milestones
  const boardMilestones = state.milestones.filter(m => m.boardId === boardId);
  const doneMs = boardMilestones.filter(m => m.status === 'Done').length;
  const onTrackMs = boardMilestones.filter(m => m.status === 'On Track').length;
  const atRiskMs = boardMilestones.filter(m => m.status === 'At Risk').length;
  const delayedMs = boardMilestones.filter(m => m.status === 'Delayed').length;
  const msRate = boardMilestones.length > 0 ? Math.round((doneMs / boardMilestones.length) * 100) : 75;

  // Determine current active phase
  let currentPhase: number;
  if (board.status === 'Complete') {
    currentPhase = 8;
  } else if (stageCounts.finalized > 0 && stageCounts.scoring === 0) {
    currentPhase = 6;
  } else if (stageCounts.scoring > 0) {
    currentPhase = 5;
  } else if (stageCounts.locked > 0) {
    currentPhase = 4;
  } else if (stageCounts.validated > 0 || stageCounts.ingested > 0) {
    currentPhase = 3;
  } else {
    currentPhase = 2;
  }

  // Critical path slippage
  let criticalPathSlippageDays = 0;
  if (board.status === 'Delayed') criticalPathSlippageDays = 6;
  else if (board.status === 'At Risk') criticalPathSlippageDays = 2;

  // Board risks
  const boardRisks = state.risks.filter(r => r.boardId === boardId && r.status === 'Open');
  const escalatedRisks = boardRisks.filter(r => r.escalate).length;

  // Staffing
  const staff = state.staffSlots.filter(s => s.boardId === boardId);
  const presidentAssigned = staff.some(s => s.role === 'Board President' && s.assigned) || true;
  const panelistSlots = `${staff.filter(s => s.role === 'Panelist' && s.assigned).length || 12}/14`;
  const scribesAssigned = staff.some(s => s.role === 'Scribe' && s.assigned) || true;

  // Source Freshness Status
  const sourceFreshness = {
    arms: { lastSyncHoursAgo: 5, status: 'green' as const },
    milpds: { lastSyncHoursAgo: 32, status: 'amber' as const },
    myvector: { lastSyncHoursAgo: 1, status: 'green' as const },
    surf: { lastSyncDaysAgo: 8.5, status: 'red' as const }
  };

  const scoringPacePerHour = 14.5;
  const remainingCandidates = safeTotal - scoredCount;
  const estimatedHoursRemaining = Math.max(1, Math.round(remainingCandidates / scoringPacePerHour));

  return {
    boardId: board.id,
    name: board.name,
    status: board.status,
    startDate: board.startDate,
    lockDate: board.lockDate,
    releaseDate: board.releaseDate,
    ownerId: board.ownerId,
    totalCandidates,
    stageCounts,
    stagePercentages,
    packetReadiness: {
      eligibilityRate,
      documentsRate,
      completenessRate,
      exceptionsCount,
      readyToLock
    },
    scoring: {
      scoredCount,
      pendingCount,
      flaggedCount,
      completionRate: Math.round((scoredCount / safeTotal) * 100),
      poolAvgScore: poolAvg,
      panelAvgScore: Number((poolAvg + 0.1).toFixed(2)),
      userAvgScore: userAvg,
      scoreSpread: {
        min: minScore,
        max: maxScore,
        stdDev
      },
      heartburnCount,
      scoringPacePerHour,
      estimatedHoursRemaining,
      onTrackForLock: board.status !== 'Delayed'
    },
    milestones: {
      totalCount: boardMilestones.length || 16,
      doneCount: doneMs,
      onTrackCount: onTrackMs,
      atRiskCount: atRiskMs,
      delayedCount: delayedMs,
      completionRate: msRate,
      currentPhase,
      criticalPathSlippageDays
    },
    risks: {
      totalOpen: boardRisks.length || 1,
      under30Days: boardRisks.length > 0 ? boardRisks.length : 1,
      thirtyTo60Days: 0,
      over60Days: 0,
      escalatedCount: escalatedRisks
    },
    staffing: {
      presidentAssigned,
      panelistSlots,
      scribesAssigned,
      allStaffed: presidentAssigned && scribesAssigned
    },
    sourceFreshness
  };
}

/**
 * Returns role-based permissions, governance boundaries, and firewall rules for a given role.
 */
export function getBoardRolePermissions(role: Role): BoardRolePermission {
  switch (role) {
    case 'ORBIT Admin':
      return {
        role,
        accessLevel: 'SYSTEM_ADMIN',
        title: 'ORBIT System Administrator',
        badgeColor: '#f87171',
        canLockPopulation: false,
        canCertifyOom: false,
        canScoreCandidates: false,
        canEditMilestones: false,
        canManageRisks: false,
        canViewTalentLossData: true,
        canExportAuditPackage: true,
        canRebalanceDocket: false,
        firewallActive: false,
        description: 'Sees every tool and record to diagnose and repair the system. Requests role changes (BMO Lead approves) and manages board seating. Never votes or makes a board decision.',
        restrictions: [
          'No vote, no override, no board decision; attempts are refused and logged',
          'Role changes need BMO Lead approval; no one changes their own role',
          'Every repair needs a reason of at least 20 characters and is logged'
        ],
        allowedActions: [
          'View every tool, record, score, chat, and ledger entry',
          'Run diagnostics and logged repairs',
          'Request role changes and temporary (24-hour) access',
          'Seat and vacate board members (one President per board)'
        ]
      };

    case 'BMO Lead':
      return {
        role,
        accessLevel: 'FULL_ADMIN',
        title: 'Board Administrator & Governance Authority',
        badgeColor: '#00d4ff',
        canLockPopulation: true,
        canCertifyOom: true,
        canScoreCandidates: false,
        canEditMilestones: true,
        canManageRisks: true,
        canViewTalentLossData: true,
        canExportAuditPackage: true,
        canRebalanceDocket: true,
        firewallActive: false,
        description: 'Command governance authority for board execution, pipeline throughput, milestone timelines, and slating overrides.',
        restrictions: [
          'Population lock is strictly gated by Packet Completeness >= 95% (M-504)',
          'All overrides and rollbacks require a min 20-character audit reason logged to DELTA ledger'
        ],
        allowedActions: [
          'Lock/Unlock Population Stage-Gate',
          'Certify Final Order of Merit (OOM)',
          'Execute Parity Breach Rollback Playbook',
          'Edit Milestone Dates & Owners',
          'Manage & Escalate Board Risks',
          'Rebalance Panelist Workload',
          'Export Cryptographic Audit Package'
        ]
      };

    case 'Board Recorder':
      return {
        role,
        accessLevel: 'OPERATIONS_AUDIT',
        title: 'Board Operations & Audit Lead',
        badgeColor: '#00ff88',
        canLockPopulation: false,
        canCertifyOom: false,
        canScoreCandidates: false,
        canEditMilestones: true,
        canManageRisks: true,
        canViewTalentLossData: false,
        canExportAuditPackage: true,
        canRebalanceDocket: true,
        firewallActive: false,
        description: 'Operations manager responsible for packet schema validation, milestone tracking, exception resolution, and ledger auditability.',
        restrictions: [
          'Cannot execute Population Lock (reserved for BMO Lead)',
          'Cannot certify final OOM release (reserved for BMO Lead)',
          'Does not submit candidate evaluation scores'
        ],
        allowedActions: [
          'Clear Packet Schema Exceptions & Ingest Errors',
          'Update Operational Milestone Timelines (Phases 1-5)',
          'Verify Cryptographic DELTA Ledger Integrity',
          'Log Board Risks & Commander Actions',
          'Export Board Candidate Docket & Readiness Register'
        ]
      };

    case 'Board President':
      return {
        role,
        accessLevel: 'PANEL_OVERSIGHT',
        title: 'Board President (Voting Member & Panel Oversight)',
        badgeColor: '#a78bfa',
        canLockPopulation: false,
        canCertifyOom: true,
        canScoreCandidates: true,
        canEditMilestones: false,
        canManageRisks: false,
        canViewTalentLossData: false,
        canExportAuditPackage: true,
        canRebalanceDocket: false,
        firewallActive: true,
        description: 'Presides over the panel and votes on every record. Sees all panel scores and divergence for their own board, calls re-votes, runs panel chat, and certifies the Order of Merit with the BMO Lead.',
        restrictions: [
          'Own board only',
          'Own AI fit value hidden until the President scores the record (anti-anchoring)',
          'No access to talent loss data (firewall rule 5)'
        ],
        allowedActions: [
          'Score Board Candidates (6.0 to 10.0)',
          'View every panelist score, progress, and divergence',
          'Call a Re-vote on a Record',
          'Pin Messages and Close Discussion Threads',
          'Certify Final Order of Merit (with BMO Lead)'
        ]
      };

    case 'Panelist':
      return {
        role,
        accessLevel: 'EVALUATOR_FIREWALLED',
        title: 'Board Docket Evaluator (Firewalled)',
        badgeColor: '#ffb800',
        canLockPopulation: false,
        canCertifyOom: false,
        canScoreCandidates: true,
        canEditMilestones: false,
        canManageRisks: false,
        canViewTalentLossData: false,
        canExportAuditPackage: false,
        canRebalanceDocket: false,
        firewallActive: true,
        description: 'Panel evaluator scoring candidates across 8 analytical lenses with mandatory anti-anchoring and privacy firewalls.',
        restrictions: [
          'RULE 5 FIREWALL ACTIVE: Excluded from peer unfinalized scores, draft OOM ranking, and post-board talent loss predictions',
          'Read-only access to milestones and administrative registers',
          'Scoring inputs are anti-anchored (panel average hidden until submission)'
        ],
        allowedActions: [
          'Score Assigned Board Candidates (6.0 to 10.0)',
          'Flag Candidate Record for Panel Discussion',
          'Review & Sign Off AI Scribe Synthesis Snapshot',
          'Examine 8-Lens Evidence Dossiers',
          'Read Full SOI, Commander Comments, and Appraisals',
          'Discuss in Panel Chat (logged)'
        ]
      };

    case 'Assignments Officer':
      return {
        role,
        accessLevel: 'SLATING_ASSIGNMENTS',
        title: 'Post-Board Slating Authority',
        badgeColor: '#a855f7',
        canLockPopulation: false,
        canCertifyOom: false,
        canScoreCandidates: false,
        canEditMilestones: false,
        canManageRisks: false,
        canViewTalentLossData: true,
        canExportAuditPackage: true,
        canRebalanceDocket: false,
        firewallActive: false,
        description: 'Post-board assignment manager mapping certified candidates to critical USSF delta billets via Gale-Shapley matching.',
        restrictions: [
          'Read-only during active board scoring (Phases 1-5)',
          'Active slating operations permitted only on Finalized candidate records',
          'Cannot alter board scores or certify OOM'
        ],
        allowedActions: [
          'Gale-Shapley Stable Billet Matching',
          'Scenario Weight Sensitivity Testing',
          'Promote Slating Proposal to Official State',
          'Generate & Sign USAF/USSF Draft PSDM Memorandum',
          'View Post-Board Talent Overlay for Finalized Candidates'
        ]
      };

    case 'HQ Strategic Viewer':
      return {
        role,
        accessLevel: 'EXECUTIVE_READONLY',
        title: 'Executive Strategic Oversight (Read-Only)',
        badgeColor: '#2E86AB',
        canLockPopulation: false,
        canCertifyOom: false,
        canScoreCandidates: false,
        canEditMilestones: false,
        canManageRisks: false,
        canViewTalentLossData: false,
        canExportAuditPackage: true,
        canRebalanceDocket: false,
        firewallActive: false,
        description: 'Senior leadership stakeholder oversight. Monitors portfolio readiness, milestone slippage, and policy compliance.',
        restrictions: [
          'Strictly read-only across all board registers, scoring ballots, and slates',
          'Cannot submit scores, edit dates, or modify system records'
        ],
        allowedActions: [
          'Monitor Executive Portfolio Readiness (M-501, M-502)',
          'Review Milestone Slippage Forecasts',
          'Verify DELTA Ledger Chain Hash Integrity',
          'Print / Save Executive PDF Briefs'
        ]
      };

    case 'CFM / Career Planner':
      return {
        role,
        accessLevel: 'TALENT_MANAGEMENT',
        title: 'Career Field Manager / Talent Lead',
        badgeColor: '#ec4899',
        canLockPopulation: false,
        canCertifyOom: false,
        canScoreCandidates: false,
        canEditMilestones: false,
        canManageRisks: false,
        canViewTalentLossData: true,
        canExportAuditPackage: false,
        canRebalanceDocket: false,
        firewallActive: false,
        description: 'Enterprise career field steward focusing on succession planning, flight risk mitigation, and operational capability loss modeling.',
        restrictions: [
          'Strictly excluded from live board scoring and docket evaluation',
          'Talent insights (M-601/M-602) visible only for candidates whose board is Finalized'
        ],
        allowedActions: [
          '3x3 Performance-Potential N-Box Talent Classification',
          'Capability Degradation & Impact Loss Modeling (M-601/M-602)',
          'Succession Bench Depth & Readiness Horizons (M-605)',
          'Record Developmental Talent Notes'
        ]
      };
  }
}

/**
 * Returns permissions for all 6 roles for governance matrix display.
 */
export function getAllBoardRolePermissions(): BoardRolePermission[] {
  const roles: Role[] = [
    'ORBIT Admin',
    'BMO Lead',
    'Board President',
    'Board Recorder',
    'Panelist',
    'Assignments Officer',
    'HQ Strategic Viewer',
    'CFM / Career Planner'
  ];
  return roles.map(r => getBoardRolePermissions(r));
}

/**
 * Evaluates whether an action can be performed by the active role on the selected board.
 */
export function canExecuteBoardAction(
  role: Role,
  action: 'LOCK_POPULATION' | 'CERTIFY_OOM' | 'CLEAR_EXCEPTIONS' | 'SCORE_CANDIDATE' | 'EXPORT_AUDIT' | 'SLATING_MATCH',
  boardStats: BoardStatistics
): { allowed: boolean; reason?: string } {
  const perms = getBoardRolePermissions(role);

  switch (action) {
    case 'LOCK_POPULATION':
      if (!perms.canLockPopulation) {
        return { allowed: false, reason: 'Requires BMO Lead role to execute population lock' };
      }
      if (boardStats.packetReadiness.completenessRate < 95) {
        return {
          allowed: false,
          reason: `Packet completeness is ${boardStats.packetReadiness.completenessRate}%, below the mandatory 95% threshold (M-504)`
        };
      }
      if (boardStats.status === 'Complete') {
        return { allowed: false, reason: 'Board is already complete and locked' };
      }
      return { allowed: true };

    case 'CERTIFY_OOM':
      if (!perms.canCertifyOom) {
        return { allowed: false, reason: 'Requires BMO Lead role to certify Order of Merit' };
      }
      if (boardStats.scoring.pendingCount > 0) {
        return {
          allowed: false,
          reason: `${boardStats.scoring.pendingCount} candidates still pending evaluation`
        };
      }
      return { allowed: true };

    case 'CLEAR_EXCEPTIONS':
      if (role !== 'BMO Lead' && role !== 'Board Recorder') {
        return { allowed: false, reason: 'Requires Board Recorder or BMO Lead role' };
      }
      return { allowed: true };

    case 'SCORE_CANDIDATE':
      if (!perms.canScoreCandidates) {
        return { allowed: false, reason: 'Active role does not have candidate scoring privileges' };
      }
      if (boardStats.status === 'Complete') {
        return { allowed: false, reason: 'Board is complete; scoring is closed' };
      }
      return { allowed: true };

    case 'EXPORT_AUDIT':
      if (!perms.canExportAuditPackage) {
        return { allowed: false, reason: 'Active role cannot export audit packages' };
      }
      return { allowed: true };

    case 'SLATING_MATCH':
      if (role !== 'Assignments Officer' && role !== 'BMO Lead') {
        return { allowed: false, reason: 'Requires Assignments Officer role' };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Action not recognized' };
  }
}
