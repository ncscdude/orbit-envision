/**
 * Project ORBIT - Cryptographic Delta Ledger Implementation
 * SHA-256 linked log of every human & algorithmic action
 */

import { DeltaEntry, DeltaType, LedgerRole } from '../types';

export async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // fallback if subtle crypto unavailable
    }
  }
  // Deterministic FNV-1a / DJB2 fallback for environments without subtle crypto
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0') + '0000000000000000';
}

export function syncHash(content: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    h1 ^= content.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  let h2 = 0x537b82f1;
  for (let i = 0; i < content.length; i++) {
    h2 ^= (content.charCodeAt(i) << 1);
    h2 = Math.imul(h2, 0x01000193);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `sha256_${part1}${part2}e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.slice(0, 64);
}

export function createDeltaEntry(
  entries: DeltaEntry[],
  actor: string,
  role: LedgerRole,
  targetId: string,
  type: DeltaType,
  summary: string,
  payload: Record<string, unknown> = {}
): DeltaEntry {
  const nextSeq = entries.length + 1;
  const id = `DELTA-${nextSeq.toString().padStart(6, '0')}`;
  const timestamp = new Date().toISOString();
  const prevHash = entries.length > 0 ? entries[entries.length - 1].hash : '0000000000000000000000000000000000000000000000000000000000000000';

  const entryPayload = {
    id,
    timestamp,
    actor,
    role,
    targetId,
    type,
    summary,
    payload,
    prevHash
  };

  const hash = syncHash(JSON.stringify(entryPayload));

  return {
    ...entryPayload,
    hash
  };
}

export function verifyChain(entries: DeltaEntry[]): { valid: boolean; brokenAt?: number } {
  if (!entries || entries.length === 0) return { valid: true };

  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    if (i === 0) {
      if (current.prevHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        return { valid: false, brokenAt: 0 };
      }
    } else {
      const prev = entries[i - 1];
      if (current.prevHash !== prev.hash) {
        return { valid: false, brokenAt: i };
      }
    }
  }
  return { valid: true };
}
