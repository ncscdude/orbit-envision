# ORBIT MVP Scope

Branch `mvp-scope` · 2026-11-11 · Owner: ORBIT Gov Lead

The MVP is the smallest ORBIT that runs one board start to finish and shows how it tests for failure. It is the same application as the full demo, built with a narrower scope. All data is fictional.

## What is in

| Step | Tool | Who |
|---|---|---|
| Data in and gates | HELIOS Command | BMO Lead, Board Recorder |
| Records to review | Candidate Queue | Panelist, Board President |
| Scoring | Panel Workspace | Panelist, Board President |
| AI visibility and panel progress | Panel Oversight | Board President |
| Divergent scores | Scoring Audit | Board President |
| Lock and Order of Merit | Board Statistics & Roles | BMO Lead |
| Audit trail and late files | DELTA Ledger | Board Recorder, BMO Lead |
| How ORBIT tests for failure | Failure Tests | ORBIT Admin |

One board: `BRD-001`. Five roles: ORBIT Admin, BMO Lead, Board President, Panelist, Board Recorder.

## What waits for the next increment

Already built in the full demo and listed in the MVP catalog as "Built · next increment": Command Center, Match Lab, Cross Analytics, Career Planner N-Box, Operations Registers, Access Admin.

## How the scope works

| Item | Where |
|---|---|
| Scope setting, tool list, role list, board | `src/scope.ts` |
| Permission table filtered by scope | `src/auth/permissions.ts` |
| Menu and catalog filtered by scope | `src/registry/experiences.ts` |
| One-board starting state, separate saved state | `src/state/reducer.ts` |
| Build to `dist/mvp`, served at `/mvp/` | `vite.config.ts` (`--mode mvp`) |

No type was changed. Late files use the existing `CanonicalFileRecord` and `FILE_ROUTED`.

## Run it

| Goal | Command |
|---|---|
| MVP on your machine | `npm run dev:mvp` then open `http://localhost:3001/mvp/` |
| Record the three gates for the Failure Tests screen | `npm run gates:record` |
| Build the full demo and the MVP | `npm run build` |
| Deploy both | `npm run deploy` (MVP is at `/mvp/` on the same hostname, behind the same Access gate) |

## Not yet synced from the production decisions

These decisions are recorded for production and are not applied to the demo or the MVP: AI on by default, ledger entries limited to the actor's own for non-audit roles, and rollback needing two approvals.

## Method sources

`src/data/methodSources.ts` lists where each failure-testing method came from. Edit that file to correct a source.
