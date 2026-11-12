/**
 * Project ORBIT - Build scope
 * 'full' is the whole demo. 'mvp' is one board from data in to audit, with only the tools
 * and roles that board needs. Chosen at build time (npm run build:mvp, or vite --mode mvp).
 * Same code, same data model, same rules: the MVP hides tools, it does not fork them.
 */

import { Role } from './types';

export type OrbitScope = 'full' | 'mvp';

// `?.` because tools that load this file outside Vite (the acceptance test runner) have no import.meta.env.
export const SCOPE: OrbitScope = import.meta.env?.VITE_ORBIT_SCOPE === 'mvp' ? 'mvp' : 'full';
export const IS_MVP = SCOPE === 'mvp';

/** The one board the MVP runs start to finish. */
export const MVP_BOARD_ID = 'BRD-001';

export const MVP_ROLES: readonly Role[] = ['ORBIT Admin', 'BMO Lead', 'Board President', 'Panelist', 'Board Recorder'];

/** MVP tools, in the order a board moves through them. This is also the menu order. */
export const MVP_VIEW_IDS: readonly string[] = [
  'VIEW-HeliosCommand',
  'VIEW-CandidateQueue',
  'VIEW-PanelReview',
  'VIEW-PanelOversight',
  'VIEW-ScoringAudit',
  'VIEW-BoardDetail',
  'VIEW-DeltaLedger',
  'VIEW-FailureTests'
];

/** Tools that exist only in the MVP build. */
export const MVP_ONLY_VIEW_IDS: readonly string[] = ['VIEW-FailureTests'];

export const MVP_LANDING: Record<Role, string> = {
  'ORBIT Admin': 'VIEW-FailureTests',
  'BMO Lead': 'VIEW-HeliosCommand',
  'Board President': 'VIEW-PanelOversight',
  Panelist: 'VIEW-CandidateQueue',
  'Board Recorder': 'VIEW-DeltaLedger',
  'Assignments Officer': 'VIEW-HeliosCommand',
  'HQ Strategic Viewer': 'VIEW-HeliosCommand',
  'CFM / Career Planner': 'VIEW-HeliosCommand'
};
