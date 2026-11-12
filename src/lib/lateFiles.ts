/**
 * Project ORBIT - Late files
 * A late file is one that arrives after the record freeze. It is tracked from the DELTA
 * ledger (FILE_ROUTED entries with payload.late), so the list is exactly what was logged.
 */

import { AppState, CanonicalFileRecord } from '../types';

export interface LateFile {
  fileId: string;
  candidateId: string;
  receivedAt: string;
  receivedBy: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  file: CanonicalFileRecord | undefined;
}

export function lateFiles(state: Pick<AppState, 'ledger' | 'canonicalFiles'>): LateFile[] {
  const out = new Map<string, LateFile>();
  for (const e of state.ledger) {
    if (e.type !== 'FILE_ROUTED' || e.payload.late !== true) continue;
    const fileId = String(e.payload.fileId);
    if (e.payload.accepted === true) {
      const row = out.get(fileId);
      if (row) {
        row.acceptedAt = e.timestamp;
        row.acceptedBy = e.actor;
      }
    } else {
      out.set(fileId, {
        fileId,
        candidateId: String(e.payload.candidateId),
        receivedAt: e.timestamp,
        receivedBy: e.actor,
        acceptedAt: null,
        acceptedBy: null,
        file: state.canonicalFiles.find(f => f.id === fileId)
      });
    }
  }
  return [...out.values()];
}
