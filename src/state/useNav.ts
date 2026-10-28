/**
 * Project ORBIT - Permission-aware navigation
 * Links inside pages use this so a role is never offered a tool it cannot open.
 */
import { useCallback } from 'react';
import { useOrbit } from './context';
import { canOpen } from '../auth/permissions';

export function useNav() {
  const { state, dispatch } = useOrbit();
  const may = useCallback((viewId: string) => canOpen(state.currentRole, viewId), [state.currentRole]);
  const go = useCallback(
    (viewId: string) => {
      if (canOpen(state.currentRole, viewId)) dispatch({ type: 'SET_VIEW', viewId });
    },
    [state.currentRole, dispatch]
  );
  return { may, go };
}
