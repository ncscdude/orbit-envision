/**
 * Project ORBIT - AppContext & Custom Hooks
 * Handles localStorage hydration, role-based guards, and metric bindings
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, MetricValue } from '../types';
import { appReducer, createInitialState, Action } from './reducer';
import { getMetric } from '../registry/metrics';
import { identityProvider } from '../auth/identity';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  useMetric: (id: string) => MetricValue;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'orbit_demo_state_v4';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    const loadSaved = (): AppState => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Ensure candidates and required structures are intact
          if (parsed.candidates && parsed.ledger && parsed.kpis) {
            return { userId: '', accessDenial: null, ...parsed };
          }
        }
      } catch {
        // fallback to pristine initial state
      }
      return createInitialState();
    };
    // Role always comes from the identity adapter, never from saved state.
    return appReducer(loadSaved(), { type: 'SET_IDENTITY', identity: identityProvider.getIdentity() });
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // handle storage quota or privacy mode errors gracefully
    }
  }, [state]);

  const useMetricFn = (id: string): MetricValue => {
    return getMetric(state, id);
  };

  return (
    <AppContext.Provider value={{ state, dispatch, useMetric: useMetricFn }}>
      {children}
    </AppContext.Provider>
  );
};

export function useOrbit(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useOrbit must be used within an AppProvider');
  }
  return ctx;
}
