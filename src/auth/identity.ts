/**
 * Project ORBIT - Identity Adapter (INTENT-001)
 * The only place ORBIT learns who the signed-in user is. Views never read identity
 * directly; the resolved identity is applied to app state via SET_IDENTITY.
 */

import { Role } from '../types';
import { DEV_USERS_SEED } from '../data/seed';
import { lookupRole } from './roleMap';

export interface Identity {
  userId: string;
  displayName: string;
  role: Role | null; // null when the identity has no entry in the role table
}

export interface IdentityProvider {
  readonly kind: 'dev' | 'envision';
  /** Returns null when no signed-in identity is recognized. */
  getIdentity(): Identity | null;
}

export interface DevIdentityProvider extends IdentityProvider {
  readonly kind: 'dev';
  listUsers(): { userId: string; displayName: string; role: Role | null }[];
  selectUser(userId: string): void;
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const DEV_USER_STORAGE_KEY = 'orbit_dev_user';
const DEFAULT_DEV_USER_ID = 'DEV-BMO-01';

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Local demo adapter: fictional users from the seed, roles from the role table. */
export function createDevIdentityProvider(storage: KeyValueStorage | null = browserStorage()): DevIdentityProvider {
  let fallbackUserId = DEFAULT_DEV_USER_ID; // used when storage is unavailable

  const selectedUserId = (): string => {
    try {
      return storage?.getItem(DEV_USER_STORAGE_KEY) ?? fallbackUserId;
    } catch {
      return fallbackUserId;
    }
  };

  return {
    kind: 'dev',
    getIdentity() {
      const user = DEV_USERS_SEED.find(u => u.userId === selectedUserId());
      if (!user) return null;
      return { userId: user.userId, displayName: user.displayName, role: lookupRole(user.userId) };
    },
    listUsers() {
      return DEV_USERS_SEED.map(u => ({ ...u, role: lookupRole(u.userId) }));
    },
    selectUser(userId: string) {
      fallbackUserId = userId;
      try {
        storage?.setItem(DEV_USER_STORAGE_KEY, userId);
      } catch {
        // storage unavailable; fallback keeps the selection for this session
      }
    }
  };
}

export const devIdentityProvider: DevIdentityProvider = createDevIdentityProvider();

/**
 * Envision adapter. Fails closed (no identity, so "No access") until the platform
 * team confirms how Envision passes identity to a hosted app (open item in INTENT-001).
 */
export const envisionIdentityProvider: IdentityProvider = {
  kind: 'envision',
  getIdentity() {
    return null;
  }
};

/** Selected at build time. Set VITE_IDENTITY_ADAPTER=envision for Envision builds. */
export const identityProvider: IdentityProvider =
  import.meta.env.VITE_IDENTITY_ADAPTER === 'envision' ? envisionIdentityProvider : devIdentityProvider;
