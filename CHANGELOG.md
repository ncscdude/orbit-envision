# Changelog

## 0.8.0 · mvp-scope (2026-11-12)
- MVP scope build: one board (BRD-001) from data in to audit, served at `/mvp/` beside the full demo. Same source, data model, and rules; the scope hides tools, it does not fork them (`src/scope.ts`).
- MVP tools, in board order: HELIOS Command, Candidate Queue, Panel Workspace, Panel Oversight, Scoring Audit, Board Statistics & Roles, DELTA Ledger, Failure Tests. Five roles: ORBIT Admin, BMO Lead, Board President, Panelist, Board Recorder.
- New Failure Tests screen (MVP only): recorded results of the three gates, live health checks with logged repairs, record and file gates read from the metric registry, and decision-guard drills that write to DELTA.
- Late files after record freeze (MVP only, DELTA Ledger screen): received, renamed, held at WARN, filed only after BMO Lead acceptance. Logged as `FILE_ROUTED` with `late: true`. No type changes.
- `npm run build` now builds both; `npm run build:mvp`, `npm run dev:mvp`, and `npm run gates:record` added.
- Tests: 8 unit tests and 6 acceptance tests added. The full demo is unchanged.
- 2026-11-13: Match Lab numbers are now computed. Fragility on every match comes from 200 real perturbation runs (+/- 10% on each non-zero weight, rerunning the same greedy assignment); it was a fixed 88% on the board and a check that did not match the assignment method. The rerank panel computes records moved, critical billets filled and top-3 preferences met against the official proposal (it showed fixed values). The greedy blocking-pair count is no longer capped at 4. The draft PSDM no longer cites an invented instruction number; the authority line is a placeholder for S1 to set. The capability degradation popup now shows the rule it actually applies (fixed points), not a weighted formula it did not compute. 1 unit test added.
- 2026-11-12: Full build display fixes. Milestone dates past December roll into 2027 (no more "2026-13-15"). Career Planner N-Box uses nine distinct cells, so the grid totals 36, not 43. Cross Analytics calibration takeaway is written from the computed stats, so it matches the Harsh/Balanced/Lenient badges. The quadrant takeaway counts Hidden Talent records from the plotted data. The Command Center forecast is labeled as a sample projection (it was labeled as an algorithm it does not run). 1 unit test added.
- 2026-11-12: Source age now comes from one function (`src/lib/sourceFreshness.ts`), measured to the data snapshot time, so HELIOS Command, Panel Oversight, Panel Workspace, Board Statistics and metrics M-301 to M-304 show the same value and status. Packet completeness on Board Statistics now uses the M-504 definition (whole packet complete), so it matches HELIOS Command and Failure Tests. 2 unit tests added.

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
