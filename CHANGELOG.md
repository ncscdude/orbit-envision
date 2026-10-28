# Changelog

## cloudflare-host 0.7.0 (2026-10-28)
- One permission table (`src/auth/permissions.ts`) drives the menu, in-page links, Catalog, Demo Guide, and the Field Guide table. A role is never offered a tool it cannot open.
- ORBIT Admin role (DEV-ADMIN-01): sees every tool and record; Access Admin page with diagnostics and logged repairs, role requests (BMO Lead approves, no self-changes, 24-hour temporary access), board seating (one President per board), and access review. No vote or board decision: refused and logged (`ADMIN_NO_DECISION`).
- Panel Oversight page (Board President lands here): sets when panel members see each AI item (Before, During, After, Off) for the LLM Fit value, model score, Scribe summary, similar records and billet fits, panel average, and endorser insights; panel progress; re-votes and flags; record issues sent to the Board Recorder's log; data freshness.
- Panelist can open Board Statistics in limited form (scoring tab and other members' scores hidden until the Order of Merit is certified).
- Header link "Roles & Access" opens the Field Guide permission table, generated from the app (`public/guide/permissions.js`, checked by a test).
- Field Guide: ORBIT Admin walkthrough, Board President AI controls, tabs derived from the permission table, 4 new screenshots.
- Envision transfer: `docs/ENVISION_TRANSFER.md` and `scripts/build-transfer.mjs` (one-file source context for Gemini or Copilot).
- Demo storage key v6. Tests: 64 unit, 68 acceptance.

## cloudflare-host 0.6.0 (2026-10-28)
Approved role map (ORBIT Tool Reference, section 1). Board President votes.
- A-1 Board President role (DEV-PRES-01): votes under its own seat, panel oversight table, call re-vote, pin and close threads, owns Scoring Audit, certifies OoM with the BMO Lead. Rule 5 still applies.
- A-2 Panel chat: record threads (shared with Flag) and a board-wide panel channel. Panelist and President post; Board Recorder reads. Every post, pin, and close logged to DELTA. Health-information words blocked in the composer and the reducer.
- A-3 Full-text reader: complete SOI, commander's comments, and appraisals with numbered paragraphs; Scribe lines link to their source. Opening is logged (RECORD_OPEN).
- A-4 Per-board rosters: queue and Panel Workspace show only the selected board's records; "How this list was built" shows the roster rules, source, and BMO-review records.
- A-5 AI fit hidden from voters until they score (queue, Panel Workspace, Cross Analytics for the President). Voters' queue sorts by record ID so order does not leak the value.
- A-7 Panelist removed from Command Center, Cross Analytics, Board Statistics, Scoring Audit; DELTA shows a Panelist only their own entries. BMO Lead no longer scores.
- Assignments Officer removed from Candidate Queue. Demo storage key moved to v5.
- Field Guide: Board President walkthrough, updated Panelist steps and role tabs, 7 new screenshots.
- Tests: 12 new unit tests, 4 new acceptance tests; Board President added to the view-guard matrix.
- Not yet done: A-6 (replace typed values with computed ones).

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
