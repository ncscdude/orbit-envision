/**
 * Project ORBIT - View Guard (INTENT-001)
 * Wraps each view so the view itself enforces its allowed roles, however it was opened
 * (nav, catalog, demo guide, saved state). Navigation filtering is convenience, not the control.
 * Allowed roles come from the experience registry; a view not in the registry allows no one.
 */

import React, { useEffect, useRef } from 'react';
import { useOrbit } from '../state/context';
import { getDefaultLandingForRole } from '../state/reducer';
import { EXPERIENCES } from '../registry/experiences';
import { Role } from '../types';
import { AccessDenied } from './AccessDenied';

const NO_ROLES: Role[] = [];

export function allowedRolesForView(viewId: string): Role[] {
  return EXPERIENCES.find(e => e.viewId === viewId && e.status === 'Live')?.roles ?? NO_ROLES;
}

export const RequireRole: React.FC<{ viewId: string; children: React.ReactNode }> = ({ viewId, children }) => {
  const { state, dispatch } = useOrbit();
  const allowedRoles = allowedRolesForView(viewId);
  const permitted = state.accessDenial === null && allowedRoles.includes(state.currentRole);
  const loggedFor = useRef<string | null>(null);

  useEffect(() => {
    if (permitted) {
      loggedFor.current = null;
      return;
    }
    const key = `${viewId}|${state.currentRole}|${state.userId}`;
    if (loggedFor.current === key) return; // one entry per denied attempt
    loggedFor.current = key;
    dispatch({ type: 'LOG_ACCESS_DENIED', viewId, allowedRoles });
  }, [permitted, viewId, allowedRoles, state.currentRole, state.userId, dispatch]);

  if (permitted) return <>{children}</>;

  return (
    <AccessDenied
      actor={state.actorName}
      role={state.currentRole}
      detail={`The ${state.currentRole} role is not permitted to open ${viewId}.`}
      onReturn={() => dispatch({ type: 'SET_VIEW', viewId: getDefaultLandingForRole(state.currentRole) })}
    />
  );
};
