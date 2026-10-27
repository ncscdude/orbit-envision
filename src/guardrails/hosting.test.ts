/**
 * Hosting guardrails for the Cloudflare branch.
 * The only public address must be the Access-protected custom domain,
 * and the site must not load anything from outside hosts.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

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
  assert.equal(wrangler.routes[0].pattern, 'orbit.ncscdude.com');
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

test('Field Guide is self-contained so the CSP does not block it', () => {
  const guide = readFileSync('public/guide/index.html', 'utf8');
  assert.doesNotMatch(guide, /<script>(?!<\/script>)/, 'no inline scripts (CSP script-src self)');
  assert.match(guide, /<script src="guide\.js"/);
  assert.doesNotMatch(guide, /https?:\/\//, 'no outside hosts');
  const js = readFileSync('public/guide/guide.js', 'utf8');
  const shots = [...js.matchAll(/img: '([a-z0-9-]+)'/g)].map(m => m[1]);
  assert.ok(shots.length >= 6, 'guide references its screenshots');
  for (const name of shots) {
    assert.ok(existsSync(`public/guide/img/${name}.jpg`), `missing screenshot ${name}`);
  }
});
