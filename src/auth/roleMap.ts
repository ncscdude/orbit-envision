/**
 * Project ORBIT - Role Table (INTENT-001)
 * Maps an identity's userId to exactly one ORBIT role. Anything not listed has no access.
 *
 * Open item: the approved production role table location and approver are not yet
 * confirmed with the Envision platform team. Entries below are fictional dev users only.
 */

import { Role } from '../types';
import { IS_MVP, MVP_ROLES } from '../scope';

const FULL_ROLE_TABLE: ReadonlyArray<{ userId: string; role: Role }> = [
  { userId: 'DEV-ADMIN-01', role: 'ORBIT Admin' },
  { userId: 'DEV-BMO-01', role: 'BMO Lead' },
  { userId: 'DEV-PRES-01', role: 'Board President' },
  { userId: 'DEV-PANEL-01', role: 'Panelist' },
  { userId: 'DEV-REC-01', role: 'Board Recorder' },
  { userId: 'DEV-ASG-01', role: 'Assignments Officer' },
  { userId: 'DEV-HQ-01', role: 'HQ Strategic Viewer' },
  { userId: 'DEV-CFM-01', role: 'CFM / Career Planner' }
];

/** The MVP build carries only the roles one board needs; other dev users have no entry. */
export const ROLE_TABLE: ReadonlyArray<{ userId: string; role: Role }> = IS_MVP
  ? FULL_ROLE_TABLE.filter(e => MVP_ROLES.includes(e.role))
  : FULL_ROLE_TABLE;

export function lookupRole(userId: string): Role | null {
  return ROLE_TABLE.find(e => e.userId === userId)?.role ?? null;
}
