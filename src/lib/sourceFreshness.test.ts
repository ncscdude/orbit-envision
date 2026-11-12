import { test } from 'vitest';
import assert from 'node:assert/strict';
import { sourceAge, DATA_AS_OF } from './sourceFreshness';
import { SOURCE_PIPELINES_SEED } from '../data/seed';

test('source age is measured against the snapshot time, not the wall clock', () => {
  const arms = sourceAge({ id: 'ARMS', lastSyncAt: '2026-10-26T14:30:00Z' });
  assert.equal(arms.text, '5.2h');
  assert.equal(arms.status, 'green');
  assert.equal(DATA_AS_OF, '2026-10-26T19:42:00Z');
});

test('each source lands in the band its own limits define', () => {
  const by = Object.fromEntries(SOURCE_PIPELINES_SEED.map(s => [s.id, sourceAge(s)]));
  assert.equal(by.ARMS.status, 'green');
  assert.equal(by.MilPDS.status, 'amber');
  assert.equal(by.MyVector.status, 'green');
  assert.equal(by.SURF.status, 'red');
  assert.equal(by.SURF.text, '8.5 days');
});
