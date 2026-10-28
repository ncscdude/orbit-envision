/**
 * Project ORBIT - Permission table (single source of truth)
 * Every role's tools and access level. The menu, links inside pages, the Experience Catalog,
 * the Demo Guide, the Board Statistics role matrix, and the Field Guide permissions table all
 * read from here. Change access here and nowhere else.
 *
 * Levels:
 *   Full     - ORBIT Admin: sees everything; may diagnose and repair, never votes or overrides
 *   Owns     - runs the tool and its actions
 *   Votes    - scores records (Panelist, Board President)
 *   Uses     - takes actions within its lane
 *   View     - read only
 *   Limited  - read only, with sections hidden (see note)
 */

import { Role } from '../types';

export type AccessLevel = 'Full' | 'Owns' | 'Votes' | 'Uses' | 'View' | 'Limited';

export interface ToolAccess {
  level: AccessLevel;
  note?: string;
}

export const ROLE_ORDER: Role[] = [
  'ORBIT Admin',
  'BMO Lead',
  'Board President',
  'Panelist',
  'Board Recorder',
  'Assignments Officer',
  'HQ Strategic Viewer',
  'CFM / Career Planner'
];

export interface ToolPermission {
  viewId: string;
  title: string;
  purpose: string;
  access: Partial<Record<Role, ToolAccess>>;
}

const ADMIN: ToolAccess = { level: 'Full' }; // diagnose and repair; never votes or overrides

export const PERMISSIONS: ToolPermission[] = [
  {
    viewId: 'VIEW-AccessAdmin',
    title: 'Access Admin',
    purpose: 'Roles, board seating, access review, diagnostics and repair',
    access: {
      'ORBIT Admin': { level: 'Owns' },
      'BMO Lead': { level: 'Uses', note: 'Approves role changes' }
    }
  },
  {
    viewId: 'VIEW-PanelOversight',
    title: 'Panel Oversight',
    purpose: 'Panel progress, AI visibility settings, re-votes, record issues, data freshness',
    access: {
      'ORBIT Admin': ADMIN,
      'Board President': { level: 'Owns' },
      'BMO Lead': { level: 'View' },
      'Board Recorder': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-CommandCenter',
    title: 'Command Center',
    purpose: 'Portfolio view of every board: phases, milestones, KPIs, risks',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'Owns' },
      'Board President': { level: 'View' },
      'Board Recorder': { level: 'View' },
      'Assignments Officer': { level: 'View' },
      'HQ Strategic Viewer': { level: 'View' },
      'CFM / Career Planner': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-CandidateQueue',
    title: 'Candidate Queue',
    purpose: "The board's roster of records to review and score",
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'View' },
      'Board President': { level: 'Votes', note: 'Plus panel oversight' },
      Panelist: { level: 'Votes' },
      'Board Recorder': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-PanelReview',
    title: 'Panel Workspace',
    purpose: 'One record in 8 lenses, full text, panel chat, and the scoring dock',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'View' },
      'Board President': { level: 'Votes', note: 'Plus re-vote, pin, close thread' },
      Panelist: { level: 'Votes' },
      'Board Recorder': { level: 'View', note: 'Reads chat' }
    }
  },
  {
    viewId: 'VIEW-HeliosCommand',
    title: 'HELIOS Command',
    purpose: 'Data pipeline: stage gates, failed records, source freshness',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'Owns' },
      'Board Recorder': { level: 'Uses' },
      'HQ Strategic Viewer': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-ScoringAudit',
    title: 'Scoring Audit',
    purpose: 'Score outliers, adjudication, rollback playbook',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'Uses' },
      'Board President': { level: 'Owns' },
      'Board Recorder': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-MatchLab',
    title: 'Match Lab',
    purpose: 'Proposes record-to-billet matches; approvals and draft PSDM',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'View' },
      'Assignments Officer': { level: 'Owns' },
      'CFM / Career Planner': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-CrossAnalytics',
    title: 'Cross Analytics',
    purpose: 'Scoring fairness: panelist calibration, endorser context, fit vs panel',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'Owns' },
      'Board President': { level: 'View' },
      'Board Recorder': { level: 'View' },
      'HQ Strategic Viewer': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-CareerPlanner',
    title: 'Career Planner N-Box',
    purpose: 'Talent grid, loss risk, retention options (never shown to the panel)',
    access: {
      'ORBIT Admin': ADMIN,
      'Assignments Officer': { level: 'View' },
      'CFM / Career Planner': { level: 'Owns' }
    }
  },
  {
    viewId: 'VIEW-OpsRegisters',
    title: 'Operations Registers',
    purpose: 'Milestones, risks and issues, AAR items, cycle log, packet check, results',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'Uses' },
      'Board Recorder': { level: 'Owns' },
      'HQ Strategic Viewer': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-DeltaLedger',
    title: 'DELTA Ledger',
    purpose: 'Hash-chained audit trail of every action; file canonicalizer',
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'View' },
      'Board President': { level: 'View', note: 'Own board' },
      Panelist: { level: 'Limited', note: 'Own entries only' },
      'Board Recorder': { level: 'Owns' },
      'Assignments Officer': { level: 'View' },
      'HQ Strategic Viewer': { level: 'View' },
      'CFM / Career Planner': { level: 'View' }
    }
  },
  {
    viewId: 'VIEW-BoardDetail',
    title: 'Board Statistics & Roles',
    purpose: "One board's population, pace, packets, schedule, and role rights",
    access: {
      'ORBIT Admin': ADMIN,
      'BMO Lead': { level: 'Owns' },
      'Board President': { level: 'View', note: 'Own board' },
      Panelist: { level: 'Limited', note: 'Scoring tab and other members’ scores hidden until the Order of Merit is certified' },
      'Board Recorder': { level: 'View' },
      'Assignments Officer': { level: 'View' },
      'HQ Strategic Viewer': { level: 'View' },
      'CFM / Career Planner': { level: 'View' }
    }
  }
];

export function permissionFor(viewId: string): ToolPermission | undefined {
  return PERMISSIONS.find(p => p.viewId === viewId);
}

/** Roles allowed to open a view. A view not in the table allows no one. */
export function rolesFor(viewId: string): Role[] {
  const p = permissionFor(viewId);
  return p ? ROLE_ORDER.filter(r => p.access[r] !== undefined) : [];
}

export function canOpen(role: Role, viewId: string): boolean {
  return permissionFor(viewId)?.access[role] !== undefined;
}

export function accessFor(role: Role, viewId: string): ToolAccess | undefined {
  return permissionFor(viewId)?.access[role];
}

/** Plain data for the Field Guide (public/guide/permissions.js). Kept in sync by a test. */
export function permissionsForGuide() {
  return {
    roles: ROLE_ORDER,
    tools: PERMISSIONS.map(p => ({
      title: p.title,
      purpose: p.purpose,
      access: Object.fromEntries(ROLE_ORDER.map(r => [r, p.access[r] ? { level: p.access[r]!.level, note: p.access[r]!.note ?? '' } : null]))
    }))
  };
}
