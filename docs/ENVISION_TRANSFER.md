# ORBIT Envision Transfer Package

Version: ORBIT 0.7.0 (branch `cloudflare-host`) · Prepared: 2026-10-28 · Owner: ORBIT Gov Lead

This file is written for an AI coding agent (Gemini in Envision, or VS Code Copilot) and for the developers who supervise it. It is the brief. The companion file `orbit-source-context.md` holds this brief, the test inventory, and every source file in one Markdown file, so the agent can read the whole program in one pass.

All names, IDs, and records in the source are fictional. Do not load real personnel data until the platform team approves the data path.

---

## 1. Intent

ORBIT (Operational Repository for Boards & Talent) runs USSF selection boards end to end: building each board's roster, panel review and scoring, scoring audit, matching people to billets, and a tamper-evident audit trail. It replaces eBOSS, which today is mostly a document store with a few panel functions.

The goal in Envision is the same product on the platform's identity, data, and hosting, with the same rules.

| Rule | Setting |
|---|---|
| Hosting | Envision |
| Code storage | web.git.mil |
| Allowed data | CUI and PII, only as needed |
| Never allowed | PHI, passwords, API keys, tokens, secrets, sensitive operational details |
| Dev and test data | Fictional seed only (`src/data/seed.ts`) |
| Network | No calls to outside hosts. No CDNs, web fonts, or analytics |
| AI content | Anything model-generated carries the AI badge, is advisory, and needs a human sign-off logged to the ledger |
| Decisions | People make every decision (scores, matches, Order of Merit). AI and formulas propose |

**The 3 gated checks.** All three must pass before any change goes to human review.

| Gate | Command | Pass rule |
|---|---|---|
| 1. Lint | `npx eslint .` | 0 errors |
| 2. Unit | `npx vitest run` | All pass (64 today) |
| 3. Acceptance | `npx playwright test` | All pass (68 today) |

---

## 2. Roles and permissions

Eight roles. One file, `src/auth/permissions.ts`, is the single source of truth. The menu, links inside pages, the catalog, the demo guide, and the Field Guide table all read from it. Change access there and nowhere else.

| Tool | Admin | BMO Lead | Board President | Panelist | Board Recorder | Assignments | HQ Viewer | CFM / Career Planner |
|---|---|---|---|---|---|---|---|---|
| Access Admin | Owns | Uses (approves roles) | · | · | · | · | · | · |
| Panel Oversight | Full | View | Owns | · | View | · | · | · |
| Command Center | Full | Owns | View | · | View | View | View | View |
| Candidate Queue | Full | View | Votes | Votes | View | · | · | · |
| Panel Workspace | Full | View | Votes | Votes | View (reads chat) | · | · | · |
| HELIOS Command | Full | Owns | · | · | Uses | · | View | · |
| Scoring Audit | Full | Uses | Owns | · | View | · | · | · |
| Match Lab | Full | View | · | · | · | Owns | · | View |
| Cross Analytics | Full | Owns | View | · | View | · | View | · |
| Career Planner N-Box | Full | · | · | · | · | View | · | Owns |
| Operations Registers | Full | Uses | · | · | Owns | · | View | · |
| DELTA Ledger | Full | View | View (own board) | Limited (own entries) | Owns | View | View | View |
| Board Statistics & Roles | Full | Owns | View (own board) | Limited (no scoring tab until certified) | View | View | View | View |

Levels: **Full** = Admin sees everything, diagnoses and repairs, never votes or overrides. **Owns** = runs the tool. **Votes** = scores records. **Uses** = acts within its lane. **View** = read only. **Limited** = read only with parts hidden.

Hard rules the agent must keep:

1. **Rule 5 firewall:** talent and loss data (Career Planner) never reach the Panelist or Board President, and never feed scoring or the Order of Merit.
2. **The Admin never decides.** Votes, flags, sign-offs, match approvals, adjudication, rollback, population lock, OoM certification, register edits, chat posts, and AI visibility changes are refused for the Admin and logged as `ACCESS_DENIED` with reason `ADMIN_NO_DECISION`.
3. **Two-person rule for roles:** the Admin requests, the BMO Lead approves, and no one changes their own role. Temporary access ends after 24 hours.
4. **One Board President per board.** The President votes like a panel member, plus oversight.
5. **Each view checks the role itself** (`RequireRole`). Hiding menu items is a convenience, not the control.

---

## 3. Data model

All types are in `src/types.ts`. Key objects:

| Object | Purpose | Key fields |
|---|---|---|
| `Candidate` | One record before a board | id, name, grade, DAFSC, look status, performance history, SOI (text, tags, preferences), endorser, eligibility, packet readiness, flow stage, scores, flags, boardId |
| `CandidateScore` | One vote | panelistId, value (6.0 to 10.0 in 0.5 steps), at |
| `Board` | One board cycle | id, name, status, start, lock, release dates |
| `Billet` | A position to fill | id, title, unit, DAFSC required, grade range, priority |
| `StaffSlot` | A seat on a board | boardId, role (Board President, Panelist, Scribe), assigned, name |
| `DeltaEntry` | One ledger entry | id, timestamp, actor, role, targetId, type, summary, payload, prevHash, hash |
| `ChatMessage` | Panel chat | boardId, channel (`PANEL` or a record ID), author, role, text, pinned |
| `AiVisibility` | President's AI settings, per board | llmFit, modelScore, scribe, similar, panelAvg, endorser, each Before / During / After / Off |
| `RoleRequest` | Role change workflow | userId, fromRole, toRole, reason, temporary, status, decidedBy, expiresAt |
| `Risk` | Risk, issue, and change log | type, title, owner, suspense, status (President record issues land here) |

The ledger is a SHA-256 hash chain (`src/state/delta.ts`). Every data-changing action appends one entry. Entries are never edited or deleted.

---

## 4. Data sources

| Source | What it feeds in ORBIT | Status |
|---|---|---|
| **MilPDS** | Roster population (grade, DAFSC, DOR, look status), eligibility, education, training, SEI, medical clearance flag, wartime role codes, DEROS, gains and losses | Confirmed as the roster source; feed method to confirm |
| **MyVector** | SOI text and preferences, endorser, endorsement comments | Confirmed for SOI; endorser feed to confirm |
| **ARMS / myEval** | Appraisals (OPR/EPR text and stratification) | To confirm |
| **SURF** | Single record summary for the panel | To confirm |
| **MPES** | Billets for Match Lab | Candidate source; to confirm |
| **AFFMS II** | Deployment availability flags only (never health detail) | Candidate source; PHI must not cross |
| **eBOSS** | Legacy board history for import, then retired | Legacy |

The "ORBIT Source File Inventory for Envision" document lists each input (F-01 to F-18), output (O-01 to O-08), and the 17 open owner questions. In the demo, every source is simulated by `src/data/seed.ts` and `src/data/fullText.ts`.

---

## 5. Tool specs

What each tool does for the board process, in build order. The "ORBIT Tool Reference" document has a section-by-section table for every tool (purpose, data, source, AI).

| Tool | What it does | AI or formula |
|---|---|---|
| Access Admin | Roles (request and approve), board seating, access review, diagnostics with logged repairs | Formula (health checks) |
| Candidate Queue | The board's roster; "How this list was built" shows the roster rules (`src/lib/roster.ts`) | AI fit value, shown per the President's setting |
| Panel Workspace | One record in 8 lenses, full-text reader (SOI, commander's comments, appraisals), panel chat, scoring dock | Scribe summary, fit, similar records, billet fits, endorser insights; each per the President's setting |
| Panel Oversight | President's AI visibility settings, panel progress and divergence, re-votes, record issues, data freshness | None |
| Scoring Audit | Outliers 1.5+ points from the panel average; reconcile, uphold, escalate; rollback playbook | Formula |
| Cross Analytics | Panelist calibration (harsh/lenient at 0.4 points), z-score preview, endorser context | Formula; shows AI fit |
| HELIOS Command | Pipeline stage gates, failed loads, source freshness, population lock at 95% packets | Formula |
| Match Lab | Weighted match score (OoM 60%, SOI tags 25%, DAFSC/grade 15%), greedy or stable matching, sensitivity, draft PSDM | Formula; talent overlay advisory |
| Career Planner N-Box | Talent grid, loss risk, retention options | Rule-based score; cost figures need an official source |
| Operations Registers | Milestones, risks and issues, AAR items, cycle log, packet check, results | None |
| DELTA Ledger | Hash-chained audit trail, file canonicalizer | None |
| Board Statistics & Roles | One board's numbers, gates, and role rights | None |
| Command Center | Portfolio of every board | Several values still typed (see gaps) |

Known gaps to close in Envision (do not copy them): typed values in Command Center, the Match Lab fixed 88% fragility, Cross Analytics takeaway lines, canonicalizer results, and Career Planner cost constants. Replace each with a computed value or an approved source.

---

## 6. Acceptance tests

The test inventory in `orbit-source-context.md` lists every test by name. Groups:

| Area | Files | What they prove |
|---|---|---|
| Identity and roles | `src/auth/identity.test.ts`, `src/auth/permissions.test.ts`, `e2e/view-guard.spec.ts`, `e2e/access-denied.spec.ts` | Role comes from one adapter; every role and view pair is allowed or denied and logged; menus match the table; the Field Guide matches the app |
| Admin | `src/auth/permissions.test.ts`, `e2e/admin-access.spec.ts` | Admin decisions refused and logged; role changes need BMO approval; temporary access expires; diagnostics find and repair a glitch without touching a vote |
| Panel | `src/lib/panel.test.ts`, `e2e/panel-features.spec.ts` | President votes under own seat; chat logged and PHI blocked; full text opens and logs; rosters per board; AI visibility follows the President |
| Ledger | `src/state/reducer.test.ts`, `src/lib/metrics.test.ts` | Hash chain verifies and detects tampering; role changes logged |
| Matching | `src/lib/matchboard.test.ts` | Matches are made; constraint failures never assigned |
| Guardrails | `src/guardrails/*.test.ts` | No outside wording; hosting locked down; guide self-contained |

---

## 7. Full source

See `orbit-source-context.md` (generated by `node scripts/build-transfer.mjs`). It contains this brief, the test inventory, and every source file with its path.

---

## 8. Build order and agent prompts

Give the agent one prompt at a time. Do not start the next until the gates pass and a person reviews the diff.

**Prompt 0: read and question**
> Read `orbit-source-context.md` in full. Do not write code. Summarize ORBIT in 10 lines, list the 8 roles and what each can open, and list every question you need answered about Envision identity, data access, and hosting before building. Flag anything in the source that would break the guardrails in section 1.

**Prompt 1: data model**
> Create the data objects in section 3 on the Envision platform, using fictional seed data from `src/data/seed.ts`. Keep field names. No real data. Write tests that load the seed and check counts. Run the 3 gates.

**Prompt 2: identity and the permission table**
> Port `src/auth/permissions.ts`, `src/auth/identity.ts` (replace the dev adapter with the Envision identity source), and `RequireRole`. Every view checks the role itself. Port `src/auth/permissions.test.ts` and `e2e/view-guard.spec.ts`. Run the 3 gates.

**Prompt 3: ledger**
> Port the DELTA hash chain (`src/state/delta.ts`) so every data-changing action appends one entry. Entries are never edited or deleted. Port the ledger tests. Run the 3 gates.

**Prompt 4: board tools**
> Build Candidate Queue, Panel Workspace, Panel Oversight, and Scoring Audit in that order, one per pull request, matching section 5 and the role table. Port each tool's tests. Run the 3 gates after each.

**Prompt 5: AI features under the President's control**
> Connect the approved Envision model for the Scribe summary and fit value. Every AI output carries the AI badge, shows only as the Board President's setting allows (`aiVisible` in `src/lib/panel.ts`), and needs a logged human sign-off. Send no PHI to the model. Run the 3 gates.

**Prompt 6: remaining tools**
> Build HELIOS Command, Match Lab, Cross Analytics, Operations Registers, Board Statistics, Command Center, Career Planner, and Access Admin. Replace each known gap in section 5 with a computed value or flag it. Run the 3 gates after each.

**Prompt 7: source feeds**
> For each source in section 4 with an approved data path, replace the seed with the platform feed behind one adapter per source. Log each load to the ledger. Run the 3 gates.

Rules for every prompt: no new runtime dependencies without approval; no secrets; ORBIT wording only; files under 300 lines; additive changes only.
