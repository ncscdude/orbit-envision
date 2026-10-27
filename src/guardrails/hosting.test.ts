/**
 * Hosting guardrails for the Cloudflare branch.
 * The only public address must be the Access-protected custom domain,
 * and the site must not load anything from outside hosts.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stripComments = (s: string) => s.replace(/^\s*\/\/.*$/gm, '');
const wrangler = JSON.parse(stripComments(readFileSync('wrangler.jsonc', 'utf8')));
const headers = readFileSync('public/_headers', 'utf8');

test('workers.dev and preview URLs are disabled', () => {
  assert.equal(wrangler.workers_dev, false);
  assert.equal(wrangler.preview_urls, false);
});

test('site is served only on a custom domain', () => {
  assert.ok(Array.isArray(wrangler.routes) && wrangler.routes.length === 1);
  assert.equal(wrangler.routes[0].custom_domain, true);
});

test('assets-only Worker with single-page fallback', () => {
  assert.equal(wrangler.main, undefined);
  assert.equal(wrangler.assets.directory, './dist');
  assert.equal(wrangler.assets.not_found_handling, 'single-page-application');
});

test('security headers block outside hosts and search indexing', () => {
  assert.match(headers, /default-src 'self'/);
  assert.match(headers, /script-src 'self';/);
  assert.match(headers, /connect-src 'self'/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /X-Robots-Tag: noindex/);
});
