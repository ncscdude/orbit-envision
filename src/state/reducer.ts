/**
 * Project ORBIT - Application State Reducer & Delta Ledger Dispatcher
 * Persists to localStorage with try/catch; all meaningful actions log to DELTA
 */

import { AppState, Role, DeltaEntry, MatchPair, MatchScenarioWeights, Milestone, Risk } from '../types';
import type { Identity } from '../auth/identity';
import { ALL_CANDIDATES_SEED, BILLETS_SEED, BOARDS_SEED, generateMilestones, RISKS_SEED, SOURCE_PIPELINES_SEED, ENDORSERS_SEED, STAFF_SLOTS_SEED, COMMANDER_ACTIONS_SEED, IMPROVEMENT_ACTIONS_SEED, SAMPLE_CANONICAL_FILES } from '../data/seed';
import { INITIAL_KPIS } from '../data/kpis';
import { createDeltaEntry } from './delta';
import { DEFAULT_WEIGHTS, generateAllCandidateBilletScores, computeSensitivityHolds } from '../lib/match';
import { runGreedyMatching } from '../lib/stable';

export function getDefaultLandingForRole(role: Role): string {
  switch (role) {
    case 'Panelist':
      return 'VIEW-CandidateQueue';
    case 'Board Recorder':
      return 'VIEW-OpsRegisters';
    case 'BMO Lead':
      return 'VIEW-CommandCenter';
    case 'Assignments Officer':
      return 'VIEW-MatchLab';
    case 'HQ Strategic Viewer':
      return 'VIEW-CommandCenter';
    case 'CFM / Career Planner':
      return 'VIEW-CareerPlanner';
    default:
      return 'VIEW-CommandCenter';
  }
}

// Applies a role to the signed-in actor and logs ROLE_CHANGE when the role or the
// identity changes. Re-reading the same identity is a no-op.
function applyRole(state: AppState, role: Role, actorName: string, userId: string): AppState {
  const changed = role !== state.currentRole || userId !== state.userId || state.accessDenial !== null;
  if (!changed) return state;

  const oldRole = state.userId ? state.currentRole : null;
  const delta = createDeltaEntry(
    state.ledger,
    actorName,
    role,
    userId || 'ORBIT-APP',
    'ROLE_CHANGE',
    oldRole ? `Role changed from ${oldRole} to ${role} for ${actorName}` : `Role ${role} assigned to ${actorName} at sign-in`,
    { oldRole, newRole: role, userId, previousActor: state.userId ? state.actorName : null }
  );

  return {
    ...state,
    currentRole: role,
    actorName,
    userId,
    accessDenial: null,
    activeViewId: role !== state.currentRole || state.accessDenial ? getDefaultLandingForRole(role) : state.activeViewId,
    ledger: [...state.ledger, delta]
  };
}

function applyIdentity(state: AppState, identity: Identity | null): AppState {
  if (identity && identity.role) {
    return applyRole(state, identity.role, identity.displayName, identity.userId);
  }

  const reason = identity ? 'UNMAPPED_ROLE' : 'UNKNOWN_IDENTITY';
  const actorName = identity?.displayName ?? 'UNKNOWN IDENTITY';
  const delta = createDeltaEntry(
    state.ledger,
    actorName,
    'Unmapped',
    'ORBIT-APP',
    'ACCESS_DENIED',
    identity
      ? `Access denied: ${actorName} has no ORBIT role in the role table`
      : 'Access denied: signed-in identity was not recognized',
    { reason, userId: identity?.userId ?? null }
  );

  return {
    ...state,
    actorName,
    userId: identity?.userId ?? '',
    accessDenial: reason,
    ledger: [...state.ledger, delta]
  };
}

export function createInitialState(): AppState {
  // Generate initial matches
  const matrix = generateAllCandidateBilletScores(ALL_CANDIDATES_SEED, BILLETS_SEED, DEFAULT_WEIGHTS);
  const greedyRes = runGreedyMatching(
    ALL_CANDIDATES_SEED,
    BILLETS_SEED,
    matrix as unknown as Record<string, Record<string, number>>
  );

  const officialMatches: MatchPair[] = greedyRes.matches.map((m, idx) => ({
    candidateId: m.candidateId,
    billetId: m.billetId,
    score: matrix[m.billetId]?.[m.candidateId]?.totalScore || 75,
    isAiProposed: idx < 3, // Top 20% machine matched
    approved: idx === 0, // 1 pre-approved
    overridden: false,
    fragilityPercent: 88
  }));

  // Initial DELTA entries
  const initialLedger: DeltaEntry[] = [];
  const init1 = createDeltaEntry(
    initialLedger,
    'SYSTEM',
    'BMO Lead',
    'BRD-001',
    'POPULATION_LOCK',
    'Board ILE AY 26-27 candidate population validated and stage gate initialized.',
    { candidateCount: 36 }
  );
  initialLedger.push(init1);

  const init2 = createDeltaEntry(
    initialLedger,
    'Col Marcus Vance',
    'Panelist',
    'PDO-001',
    'SCORE_SUBMIT',
    'Initial evaluation score 9.0 submitted for Maj Tyler K. Vance.',
    { score: 9.0 }
  );
  initialLedger.push(init2);

  return {
    currentRole: 'BMO Lead',
    actorName: 'Col Vance (BMO Lead)',
    userId: '',
    accessDenial: null,
    activeViewId: 'VIEW-CommandCenter',
    selectedBoardId: 'BRD-001',
    selectedCandidateId: 'PDO-001',
    timeDisplay: 'zulu',

    candidates: ALL_CANDIDATES_SEED,
    billets: BILLETS_SEED,
    boards: BOARDS_SEED,
    milestones: generateMilestones(),
    risks: RISKS_SEED,
    sources: SOURCE_PIPELINES_SEED,
    endorsers: ENDORSERS_SEED,
    staffSlots: STAFF_SLOTS_SEED,
    commanderActions: COMMANDER_ACTIONS_SEED,
    improvementActions: IMPROVEMENT_ACTIONS_SEED,
    kpis: INITIAL_KPIS,
    canonicalFiles: SAMPLE_CANONICAL_FILES,

    activeProposalMode: 'Official',
    officialMatches,
    sandboxMatches: [...officialMatches],
    matchWeights: { ...DEFAULT_WEIGHTS },
    savedScenarios: [],
    matchingAlgorithm: 'greedy',
    showTalentOverlayInMatchLab: false,

    ledger: initialLedger,
    chainTampered: false,
    replayIndex: null,

    candidateFilterText: '',
    candidateFilterStatus: 'All',
    candidateFilterMinFit: 0,
    candidateFilterPme: 'All',
    candidateFilterPacket: 'All',
    lastShuffleSeed: null
  };
}

export type Action =
  | { type: 'SET_ROLE'; role: Role; actorName?: string }
  | { type: 'SET_IDENTITY'; identity: Identity | null }
  | { type: 'LOG_ACCESS_DENIED'; viewId: string; allowedRoles: Role[] }
  | { type: 'SET_VIEW'; viewId: string }
  | { type: 'SET_BOARD'; boardId: string }
  | { type: 'SELECT_CANDIDATE'; candidateId: string | null }
  | { type: 'TOGGLE_TIME_DISPLAY' }
  | { type: 'SET_FILTER_TEXT'; text: string }
  | { type: 'SET_FILTER_STATUS'; status: 'All' | 'Pending' | 'Scored' | 'Flagged' }
  | { type: 'SET_FILTER_MIN_FIT'; minFit: number }
  | { type: 'SET_FILTER_PME'; pme: string }
  | { type: 'SET_FILTER_PACKET'; packet: 'All' | 'Complete' | 'Exceptions' }
  | { type: 'RESET_FILTERS' }
  | { type: 'SUBMIT_SCORE'; candidateId: string; score: number }
  | { type: 'REVISE_SCORE'; candidateId: string; score: number; reason: string }
  | { type: 'TOGGLE_FLAG'; candidateId: string; reason?: string }
  | { type: 'SIGN_OFF_SNAPSHOT'; candidateId: string }
  | { type: 'REVOKE_SNAPSHOT'; candidateId: string }
  | { type: 'RANDOM_SHUFFLE' }
  | { type: 'APPROVE_MATCH'; candidateId: string; billetId: string }
  | { type: 'OVERRIDE_MATCH'; candidateId: string; billetId: string; newCandidateId: string; reason: string }
  | { type: 'UNMATCH_PAIR'; candidateId: string; billetId: string }
  | { type: 'SET_MATCH_WEIGHTS'; weights: MatchScenarioWeights }
  | { type: 'SET_MATCH_MODE'; mode: 'Official' | 'Sandbox' }
  | { type: 'SET_MATCHING_ALGO'; algo: 'greedy' | 'stable' }
  | { type: 'SAVE_SCENARIO'; name: string }
  | { type: 'LOAD_SCENARIO'; scenarioId: string }
  | { type: 'PROMOTE_SCENARIO' }
  | { type: 'TOGGLE_TALENT_OVERLAY' }
  | { type: 'EXPORT_PSDM'; memoText: string }
  | { type: 'ADJUDICATE_HEARTBURN'; candidateId: string; action: 'Reconcile' | 'Uphold' | 'Escalate'; newScore?: number; note: string }
  | { type: 'ROLLBACK_PLAYBOOK' }
  | { type: 'ROUTE_FILE'; fileId: string; targetNode: string }
  | { type: 'COMMIT_ROUTING' }
  | { type: 'RETRY_INGEST'; candidateId: string }
  | { type: 'LOCK_POPULATION'; boardId: string }
  | { type: 'UPDATE_MILESTONE'; milestoneId: string; updates: Partial<Milestone> }
  | { type: 'UPDATE_RISK'; riskId: string; updates: Partial<Risk> }
  | { type: 'EDIT_KPI'; kpiId: string; field: 'kpi' | 'numerator' | 'denominator' | 'accountableDataOwner'; value: string }
  | { type: 'ADD_IMPROVEMENT_ACTION'; action: { phase: number; title: string; owner: string; due: string; lessonLearned?: string } }
  | { type: 'UPDATE_COMMANDER_ACTION'; actionId: string; status: 'Pending' | 'Done' }
  | { type: 'SAVE_TALENT_NOTE'; candidateId: string; note: string }
  | { type: 'TAMPER_CHAIN'; tamper: boolean }
  | { type: 'SET_REPLAY_INDEX'; index: number | null }
  | { type: 'CERTIFY_OOM'; boardId: string }
  | { type: 'CLEAR_BOARD_EXCEPTIONS'; boardId: string }
  | { type: 'RESET_DEMO' };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE': {
      const actorName = action.actorName || `${action.role} User`;
      return applyRole(state, action.role, actorName, state.userId);
    }

    case 'SET_IDENTITY': {
      return applyIdentity(state, action.identity);
    }

    case 'LOG_ACCESS_DENIED': {
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.viewId,
        'ACCESS_DENIED',
        `Access denied: ${state.currentRole} may not open ${action.viewId}`,
        { reason: 'VIEW_ROLE_FORBIDDEN', viewId: action.viewId, allowedRoles: action.allowedRoles, userId: state.userId }
      );
      return { ...state, ledger: [...state.ledger, delta] };
    }

    case 'SET_VIEW': {
      return { ...state, activeViewId: action.viewId };
    }

    case 'SET_BOARD': {
      return { ...state, selectedBoardId: action.boardId };
    }

    case 'SELECT_CANDIDATE': {
      return { ...state, selectedCandidateId: action.candidateId };
    }

    case 'TOGGLE_TIME_DISPLAY': {
      return { ...state, timeDisplay: state.timeDisplay === 'zulu' ? 'local' : 'zulu' };
    }

    case 'SET_FILTER_TEXT':
      return { ...state, candidateFilterText: action.text };
    case 'SET_FILTER_STATUS':
      return { ...state, candidateFilterStatus: action.status };
    case 'SET_FILTER_MIN_FIT':
      return { ...state, candidateFilterMinFit: action.minFit };
    case 'SET_FILTER_PME':
      return { ...state, candidateFilterPme: action.pme };
    case 'SET_FILTER_PACKET':
      return { ...state, candidateFilterPacket: action.packet };
    case 'RESET_FILTERS':
      return {
        ...state,
        candidateFilterText: '',
        candidateFilterStatus: 'All',
        candidateFilterMinFit: 0,
        candidateFilterPme: 'All',
        candidateFilterPacket: 'All'
      };

    case 'SUBMIT_SCORE': {
      const { candidateId, score } = action;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (!cand) return state;

      const newScores = [...cand.scores, { panelistId: 'USER-ME', value: score, at: new Date().toISOString() }];
      const updatedCandidates = state.candidates.map(c =>
        c.id === candidateId ? { ...c, myScore: score, scores: newScores } : c
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        candidateId,
        'SCORE_SUBMIT',
        `Evaluator submitted score ${score.toFixed(1)} for ${cand.name}`,
        { candidateId, score }
      );

      return {
        ...state,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'REVISE_SCORE': {
      const { candidateId, score, reason } = action;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (!cand) return state;

      const newScores = cand.scores.map(s => (s.panelistId === 'USER-ME' ? { ...s, value: score } : s));
      const updatedCandidates = state.candidates.map(c =>
        c.id === candidateId ? { ...c, myScore: score, scores: newScores } : c
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        candidateId,
        'SCORE_REVISE',
        `Revised score to ${score.toFixed(1)} for ${cand.name}. Rationale: ${reason}`,
        { candidateId, score, reason }
      );

      return {
        ...state,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'TOGGLE_FLAG': {
      const { candidateId, reason } = action;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (!cand) return state;

      const newFlagState = !cand.flagged;
      const updatedCandidates = state.candidates.map(c =>
        c.id === candidateId ? { ...c, flagged: newFlagState, flagReason: newFlagState ? (reason || 'Flagged for discussion') : undefined } : c
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        candidateId,
        'FLAG',
        newFlagState
          ? `Flagged ${cand.name} for panel adjudication: ${reason || 'General review'}`
          : `Unflagged ${cand.name}`,
        { candidateId, flagged: newFlagState, reason }
      );

      return {
        ...state,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'SIGN_OFF_SNAPSHOT': {
      const { candidateId } = action;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (!cand) return state;

      const timestamp = new Date().toISOString();
      const updatedCandidates = state.candidates.map(c =>
        c.id === candidateId
          ? {
              ...c,
              chatSnapshot: {
                ...c.chatSnapshot,
                signedOffBy: state.actorName,
                signedOffAt: timestamp
              }
            }
          : c
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        candidateId,
        'SNAPSHOT_SIGNOFF',
        `Human sign-off completed for AI narrative synthesis (${cand.chatSnapshot.id}) on ${cand.name}`,
        { candidateId, snapshotId: cand.chatSnapshot.id }
      );

      return {
        ...state,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'REVOKE_SNAPSHOT': {
      const { candidateId } = action;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (!cand) return state;

      const updatedCandidates = state.candidates.map(c =>
        c.id === candidateId
          ? {
              ...c,
              chatSnapshot: {
                ...c.chatSnapshot,
                signedOffBy: null,
                signedOffAt: null
              }
            }
          : c
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        candidateId,
        'SNAPSHOT_REVOKE',
        `Revoked sign-off on AI narrative synthesis for ${cand.name}`,
        { candidateId }
      );

      return {
        ...state,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'RANDOM_SHUFFLE': {
      // Fisher-Yates shuffle using crypto.getRandomValues
      const array = [...state.candidates];
      const randomValues = new Uint32Array(array.length);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomValues);
      } else {
        for (let i = 0; i < randomValues.length; i++) randomValues[i] = Math.floor(Math.random() * 0xffffffff);
      }

      for (let i = array.length - 1; i > 0; i--) {
        const j = randomValues[i] % (i + 1);
        [array[i], array[j]] = [array[j], array[i]];
      }

      const seedHex = '0x' + (randomValues[0] || 0x12345678).toString(16).padStart(8, '0');

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        state.selectedBoardId,
        'SHUFFLE',
        `DELTA-ShuffleSeed: True random Fisher-Yates candidate queue reorder executed (Seed: ${seedHex})`,
        { seed: seedHex, candidateCount: array.length }
      );

      return {
        ...state,
        candidates: array,
        lastShuffleSeed: seedHex,
        ledger: [...state.ledger, delta]
      };
    }

    case 'APPROVE_MATCH': {
      const { candidateId, billetId } = action;
      const targetMatches = state.activeProposalMode === 'Official' ? state.officialMatches : state.sandboxMatches;
      const updated = targetMatches.map(m =>
        m.candidateId === candidateId && m.billetId === billetId ? { ...m, approved: true } : m
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        billetId,
        'MATCH_APPROVE',
        `Approved assignment match: Candidate ${candidateId} to Billet ${billetId}`,
        { candidateId, billetId }
      );

      return state.activeProposalMode === 'Official'
        ? { ...state, officialMatches: updated, ledger: [...state.ledger, delta] }
        : { ...state, sandboxMatches: updated, ledger: [...state.ledger, delta] };
    }

    case 'OVERRIDE_MATCH': {
      const { candidateId, billetId, newCandidateId, reason } = action;
      const targetMatches = state.activeProposalMode === 'Official' ? state.officialMatches : state.sandboxMatches;
      const updated = targetMatches.map(m =>
        m.billetId === billetId
          ? {
              ...m,
              candidateId: newCandidateId,
              overridden: true,
              overrideReason: reason,
              approved: true
            }
          : m
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        billetId,
        'MATCH_OVERRIDE',
        `Human assignment override: Swapped ${candidateId} -> ${newCandidateId} for ${billetId}. Justification: ${reason}`,
        { oldCandidateId: candidateId, newCandidateId, billetId, reason }
      );

      return state.activeProposalMode === 'Official'
        ? { ...state, officialMatches: updated, ledger: [...state.ledger, delta] }
        : { ...state, sandboxMatches: updated, ledger: [...state.ledger, delta] };
    }

    case 'UNMATCH_PAIR': {
      const { candidateId, billetId } = action;
      const targetMatches = state.activeProposalMode === 'Official' ? state.officialMatches : state.sandboxMatches;
      const updated = targetMatches.filter(m => !(m.candidateId === candidateId && m.billetId === billetId));

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        billetId,
        'MATCH_UNMATCH',
        `Removed match between Candidate ${candidateId} and Billet ${billetId}`,
        { candidateId, billetId }
      );

      return state.activeProposalMode === 'Official'
        ? { ...state, officialMatches: updated, ledger: [...state.ledger, delta] }
        : { ...state, sandboxMatches: updated, ledger: [...state.ledger, delta] };
    }

    case 'SET_MATCH_WEIGHTS': {
      const matrix = generateAllCandidateBilletScores(state.candidates, state.billets, action.weights);
      const greedyRes = runGreedyMatching(
        state.candidates,
        state.billets,
        matrix as unknown as Record<string, Record<string, number>>
      );

      const newMatches: MatchPair[] = greedyRes.matches.map((m, idx) => ({
        candidateId: m.candidateId,
        billetId: m.billetId,
        score: matrix[m.billetId]?.[m.candidateId]?.totalScore || 70,
        isAiProposed: idx < 3,
        approved: false,
        overridden: false,
        fragilityPercent: 85
      }));

      // Compute sensitivity holds
      const holds = computeSensitivityHolds(state.candidates, state.billets, action.weights, newMatches, 50);
      newMatches.forEach(m => {
        m.fragilityPercent = holds[`${m.candidateId}_${m.billetId}`] || 80;
      });

      return {
        ...state,
        matchWeights: action.weights,
        sandboxMatches: newMatches
      };
    }

    case 'SET_MATCH_MODE': {
      return { ...state, activeProposalMode: action.mode };
    }

    case 'SET_MATCHING_ALGO': {
      return { ...state, matchingAlgorithm: action.algo };
    }

    case 'SAVE_SCENARIO': {
      const newScenario = {
        id: `SCENARIO-${Date.now().toString().slice(-4)}`,
        name: action.name,
        createdAt: new Date().toISOString(),
        weights: { ...state.matchWeights },
        matches: [...state.sandboxMatches]
      };
      const scenarios = [newScenario, ...state.savedScenarios].slice(0, 5);

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        newScenario.id,
        'SCENARIO_RUN',
        `Saved Match Lab sandbox scenario: "${action.name}"`,
        { scenarioName: action.name }
      );

      return {
        ...state,
        savedScenarios: scenarios,
        ledger: [...state.ledger, delta]
      };
    }

    case 'LOAD_SCENARIO': {
      const scen = state.savedScenarios.find(s => s.id === action.scenarioId);
      if (!scen) return state;
      return {
        ...state,
        matchWeights: { ...scen.weights },
        sandboxMatches: [...scen.matches]
      };
    }

    case 'PROMOTE_SCENARIO': {
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        'SLATE-OFFICIAL',
        'SCENARIO_PROMOTE',
        `Assignments Officer promoted sandbox matching scenario to Official Board Proposal (${state.sandboxMatches.length} slates)`,
        { matchCount: state.sandboxMatches.length, weights: state.matchWeights }
      );

      return {
        ...state,
        officialMatches: [...state.sandboxMatches],
        activeProposalMode: 'Official',
        ledger: [...state.ledger, delta]
      };
    }

    case 'TOGGLE_TALENT_OVERLAY': {
      return { ...state, showTalentOverlayInMatchLab: !state.showTalentOverlayInMatchLab };
    }

    case 'EXPORT_PSDM': {
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        'PSDM-EXPORT-001',
        'PSDM_EXPORT',
        `Generated Draft Personnel Services Delivery Memorandum (PSDM) & Exported Cryptographic Audit Package`,
        { matchCount: state.officialMatches.length }
      );
      return { ...state, ledger: [...state.ledger, delta] };
    }

    case 'ADJUDICATE_HEARTBURN': {
      const { candidateId, action: act, newScore, note } = action;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (!cand) return state;

      let updatedCandidates = state.candidates;
      if (act === 'Reconcile' && newScore !== undefined) {
        updatedCandidates = state.candidates.map(c =>
          c.id === candidateId ? { ...c, myScore: newScore, flagged: false, flagReason: undefined } : c
        );
      } else if (act === 'Uphold') {
        updatedCandidates = state.candidates.map(c =>
          c.id === candidateId ? { ...c, flagged: false } : c
        );
      }

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        candidateId,
        'HEARTBURN_ADJUDICATE',
        `Heartburn Adjudication (${act}) for ${cand.name}. Note: ${note}`,
        { candidateId, action: act, newScore, note }
      );

      return {
        ...state,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'ROLLBACK_PLAYBOOK': {
      // Revert candidate scores to clean state
      const reverted = state.candidates.map(c => ({
        ...c,
        myScore: null,
        scores: c.scores.filter(s => s.panelistId !== 'USER-ME')
      }));

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        'PARITY-PLAYBOOK',
        'ROLLBACK',
        'Parity Breach Rollback Playbook executed: Scoring frozen, affected PDO records reverted to verified DELTA-000001 checkpoint.',
        { state: 'ROLLED_BACK' }
      );

      return {
        ...state,
        candidates: reverted,
        ledger: [...state.ledger, delta]
      };
    }

    case 'ROUTE_FILE': {
      const updatedFiles = state.canonicalFiles.map(f =>
        f.id === action.fileId ? { ...f, targetNode: action.targetNode, routedAt: new Date().toISOString() } : f
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.fileId,
        'FILE_ROUTED',
        `Routed canonicalized file ${action.fileId} to SharePoint branch: ${action.targetNode}`,
        { fileId: action.fileId, node: action.targetNode }
      );
      return {
        ...state,
        canonicalFiles: updatedFiles,
        ledger: [...state.ledger, delta]
      };
    }

    case 'COMMIT_ROUTING': {
      const updated = state.canonicalFiles.map(f => ({ ...f, committed: true }));
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        'ORBIT-BMO-ROOT',
        'FILE_ROUTED',
        `BMO Lead committed batch file routing to authoritative SharePoint ORBIT-BMO tree.`,
        { committedCount: updated.length }
      );
      return {
        ...state,
        canonicalFiles: updated,
        ledger: [...state.ledger, delta]
      };
    }

    case 'RETRY_INGEST': {
      const updated = state.candidates.map(c =>
        c.id === action.candidateId
          ? {
              ...c,
              flow: {
                ...c.flow,
                failedIngest: false,
                errors: [],
                stage: 'Validated' as const,
                validatedAt: new Date().toISOString()
              },
              packetReadiness: {
                ...c.packetReadiness,
                complete: true,
                exceptions: []
              }
            }
          : c
      );

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.candidateId,
        'PIPELINE_RETRY',
        `BMO Lead triggered pipeline retry for ${action.candidateId}. Ingestion socket re-established; packet verified.`,
        { candidateId: action.candidateId }
      );

      return {
        ...state,
        candidates: updated,
        ledger: [...state.ledger, delta]
      };
    }

    case 'LOCK_POPULATION': {
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.boardId,
        'POPULATION_LOCK',
        `BMO Lead locked candidate population for ${action.boardId}. Ingestion pipeline closed; population sealed for board scoring.`,
        { boardId: action.boardId }
      );
      return {
        ...state,
        ledger: [...state.ledger, delta]
      };
    }

    case 'CERTIFY_OOM': {
      const updatedBoards = state.boards.map(b =>
        b.id === action.boardId ? { ...b, status: 'Complete' as const } : b
      );
      const updatedCandidates = state.candidates.map(c =>
        c.boardId === action.boardId
          ? {
              ...c,
              flow: {
                ...c.flow,
                stage: 'Finalized' as const,
                finalizedAt: new Date().toISOString()
              }
            }
          : c
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.boardId,
        'BOARD_OOM_CERTIFY',
        `BMO Lead officially certified Order of Merit (OOM) for ${action.boardId}. Results validated and published.`,
        { boardId: action.boardId }
      );
      return {
        ...state,
        boards: updatedBoards,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'CLEAR_BOARD_EXCEPTIONS': {
      const updatedCandidates = state.candidates.map(c =>
        c.boardId === action.boardId
          ? {
              ...c,
              packetReadiness: {
                ...c.packetReadiness,
                eligibility: true,
                documents: true,
                complete: true,
                exceptions: []
              },
              flow: {
                ...c.flow,
                errors: []
              }
            }
          : c
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.boardId,
        'BOARD_EXCEPTIONS_CLEAR',
        `Resolved and cleared packet schema exceptions for candidate roster in ${action.boardId}.`,
        { boardId: action.boardId }
      );
      return {
        ...state,
        candidates: updatedCandidates,
        ledger: [...state.ledger, delta]
      };
    }

    case 'UPDATE_MILESTONE': {
      const updated = state.milestones.map(m =>
        m.id === action.milestoneId ? { ...m, ...action.updates } : m
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.milestoneId,
        'MILESTONE_UPDATE',
        `Updated milestone ${action.milestoneId}: Status=${action.updates.status || 'Updated'}`,
        action.updates
      );
      return { ...state, milestones: updated, ledger: [...state.ledger, delta] };
    }

    case 'UPDATE_RISK': {
      const updated = state.risks.map(r =>
        r.id === action.riskId ? { ...r, ...action.updates } : r
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.riskId,
        'RISK_UPDATE',
        `Updated risk ${action.riskId}: Mitigation/status updated`,
        action.updates
      );
      return { ...state, risks: updated, ledger: [...state.ledger, delta] };
    }

    case 'EDIT_KPI': {
      const updated = state.kpis.map(k =>
        k.id === action.kpiId ? { ...k, [action.field]: action.value } : k
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.kpiId,
        'KPI_EDIT',
        `BMO Lead edited KPI definition ${action.kpiId} (${action.field} = "${action.value}")`,
        { kpiId: action.kpiId, field: action.field, value: action.value }
      );
      return { ...state, kpis: updated, ledger: [...state.ledger, delta] };
    }

    case 'ADD_IMPROVEMENT_ACTION': {
      const newAction = {
        id: `IMP-${(state.improvementActions.length + 1).toString().padStart(2, '0')}`,
        phase: action.action.phase,
        title: action.action.title,
        owner: action.action.owner,
        due: action.action.due,
        done: false,
        lessonLearned: action.action.lessonLearned
      };

      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        newAction.id,
        'IMPROVEMENT_ACTION',
        `Added Phase 8 AAR item: "${newAction.title}"`,
        newAction
      );

      return {
        ...state,
        improvementActions: [...state.improvementActions, newAction],
        ledger: [...state.ledger, delta]
      };
    }

    case 'UPDATE_COMMANDER_ACTION': {
      const updated = state.commanderActions.map(a =>
        a.id === action.actionId ? { ...a, status: action.status } : a
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.actionId,
        'COMMANDER_ACTION_UPDATE',
        `Commander action ${action.actionId} status set to ${action.status}`,
        { actionId: action.actionId, status: action.status }
      );
      return { ...state, commanderActions: updated, ledger: [...state.ledger, delta] };
    }

    case 'SAVE_TALENT_NOTE': {
      const updated = state.candidates.map(c =>
        c.id === action.candidateId && c.talent
          ? { ...c, talent: { ...c.talent, talentNote: action.note } }
          : c
      );
      const delta = createDeltaEntry(
        state.ledger,
        state.actorName,
        state.currentRole,
        action.candidateId,
        'TALENT_NOTE',
        `CFM / Career Planner logged talent development note for ${action.candidateId}`,
        { candidateId: action.candidateId, note: action.note }
      );
      return { ...state, candidates: updated, ledger: [...state.ledger, delta] };
    }

    case 'TAMPER_CHAIN': {
      return { ...state, chainTampered: action.tamper };
    }

    case 'SET_REPLAY_INDEX': {
      return { ...state, replayIndex: action.index };
    }

    case 'RESET_DEMO': {
      try {
        localStorage.removeItem('orbit_demo_state_v4');
      } catch {
        // ignore
      }
      // Identity and role come from the adapter, so a demo reset keeps them.
      return {
        ...createInitialState(),
        currentRole: state.currentRole,
        actorName: state.actorName,
        userId: state.userId,
        accessDenial: state.accessDenial,
        activeViewId: getDefaultLandingForRole(state.currentRole)
      };
    }

    default:
      return state;
  }
}
