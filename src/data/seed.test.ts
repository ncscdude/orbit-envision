/**
 * Seed shape: every record carries the list fields the Panel Workspace lenses read.
 * A missing list crashed lens 3 (Experience & Command) for the hand-written records.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createInitialState } from '../state/reducer';

const LIST_FIELDS = ['performance', 'decorations', 'timeline', 'skills', 'skillVector', 'certs', 'featureDrivers', 'scores'] as const;

test('every record has every list field a lens reads', () => {
  const missing: string[] = [];
  for (const c of createInitialState().candidates) {
    for (const f of LIST_FIELDS) {
      if (!Array.isArray((c as unknown as Record<string, unknown>)[f])) missing.push(`${c.id}.${f}`);
    }
    if (!Array.isArray(c.soi?.tags)) missing.push(`${c.id}.soi.tags`);
    if (!Array.isArray(c.chatSnapshot?.strengths)) missing.push(`${c.id}.chatSnapshot.strengths`);
    if (!Array.isArray(c.chatSnapshot?.considerations)) missing.push(`${c.id}.chatSnapshot.considerations`);
    if (!Array.isArray(c.packetReadiness?.exceptions)) missing.push(`${c.id}.packetReadiness.exceptions`);
    if (!Array.isArray(c.flow?.errors)) missing.push(`${c.id}.flow.errors`);
  }
  assert.deepEqual(missing, []);
});
