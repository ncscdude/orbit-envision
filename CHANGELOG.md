# Changelog

## cloudflare-host 0.5.2 (2026-10-27)
- Hostname set to orbit.ncscdude.com and pinned by the hosting test.
- Added scripts/deploy-orbit.ps1 one-step deploy.

## cloudflare-host 0.5.1 (2026-10-27)
- Branch from envision-path for hosting on Cloudflare.
- Worker with static assets (`wrangler.jsonc`), custom domain only, workers.dev and preview URLs off.
- Security headers (`public/_headers`), robots block, hosting guard tests (22 unit tests total).
- `npm run deploy` and `npm run deploy:check`. Playwright accepts `BASE_URL` to test a running server.
- Guide: `docs/DEPLOY_CLOUDFLARE.md`.

## envision-path

## 0.5.0 (2026-10-27)
- Branch created from prototype 4.3.0.
- Rename pass: ORBIT vocabulary for phases, KPI catalog, owners, cards, charts, and data logs. See `docs/TERM_ORIGINS.md`.
- Computed values replace typed values for cycle status, schedule adherence, and item age. Seed now has 13 cycles.
- Removed unused dependencies and outside font calls.
- Fixed hook order in Career Planner (role check moved below hooks).
- Added gates: ESLint, Vitest (18 tests), Playwright (5 tests). Added term guard.
- Added `INTENT.md` (INTENT-001), Copilot instructions, provenance record.
