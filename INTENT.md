# INTENT-001: Identity, Role Enforcement, and Audit Logging
Branch: `envision-path` · Status: Ready for agent · Owner: ORBIT Gov Lead · Date: 2026-10-27

---

## 1. Feature Intent and Goal
Make ORBIT ready to run inside Envision with real user identity.

| In scope | Out of scope |
|---|---|
| Read the signed-in user's identity (CAC-backed) from Envision through one adapter | Building any login screen or handling CAC certificates in app code |
| Map identity to one ORBIT role from an approved role table | Changing scoring, matching, or metric logic |
| Enforce the role inside every view, not only in the navigation | New screens or dashboards |
| Write every role change, view denial, and data-changing action to the DELTA ledger with actor, role, and timestamp | Moving the ledger to a server (later INTENT) |
| Keep a dev adapter so the demo still runs locally with fictional users | Real personnel data in dev or test |

Done means: a user's role comes from the adapter, a blocked view shows a denial screen and logs it, and every logged entry names who and which role.

---

## 2. Platform and Data Guardrails
| Rule | Setting |
|---|---|
| Hosting | Envision |
| Code storage | web.git.mil |
| Allowed data | CUI and PII, only as needed for the feature |
| Never allowed | PHI, passwords, API keys, tokens, secrets, sensitive operational details |
| Dev and test data | Fictional seed only (`src/data/seed.ts`) |
| Network | No calls to outside hosts. No CDNs, web fonts, or analytics |
| Wording | ORBIT vocabulary only. `src/guardrails/termGuard.test.ts` must pass |
| AI content | Anything model-generated carries the AI badge and needs a human sign-off logged to DELTA |

Open items to confirm with the Envision platform team before merge:
- How Envision passes identity to a hosted app (header, token, or platform API).
- Approved runtime dependency list.
- Where the role table lives and who approves it.

---

## 3. Testable Acceptance Criteria
Each criterion maps to one test file. "Exists" tests pass today and must keep passing. "Add" tests are written first by the agent, then the code.

| ID | Criterion | Test file | Tool | State |
|---|---|---|---|---|
| AC-1 | App loads with no outside network calls and no console errors | `e2e/smoke.spec.ts` | Playwright | Exists |
| AC-2 | Every tab for a role renders without errors | `e2e/smoke.spec.ts` | Playwright | Exists |
| AC-3 | Panelist never gets the Career Planner tab | `e2e/role-firewall.spec.ts`, `src/registry/experiences.test.ts` | Playwright, Vitest | Exists |
| AC-4 | A logged action shows actor, role, and type in the ledger | `e2e/role-firewall.spec.ts` | Playwright | Exists |
| AC-5 | Ledger hash chain verifies and detects tampering | `src/lib/metrics.test.ts` | Vitest | Exists |
| AC-6 | No outside-source wording in source | `src/guardrails/termGuard.test.ts` | Vitest | Exists |
| AC-7 | `IdentityProvider` interface returns `{ userId, displayName, role }`; the dev adapter returns a fictional user | `src/auth/identity.test.ts` | Vitest | Add |
| AC-8 | Unknown identity or unmapped role lands on a "No access" screen and logs `ACCESS_DENIED` | `src/auth/identity.test.ts`, `e2e/access-denied.spec.ts` | Vitest, Playwright | Add |
| AC-9 | Each view checks the role itself; opening a view by state change for a forbidden role shows the denial screen and logs `ACCESS_DENIED` | `e2e/view-guard.spec.ts` | Playwright | Add |
| AC-10 | Role changes log `ROLE_CHANGE` with old role, new role, and actor | `src/state/reducer.test.ts` | Vitest | Add |
| AC-11 | No value matching a secret pattern exists in source | `eslint.config.js` rule `no-restricted-syntax` | ESLint | Exists |

---

## 4. Architectural Constraints
- **Stack:** TypeScript, React 19, Vite, Tailwind, Recharts, Lucide. Nothing else at runtime without approval.
- **No new runtime dependencies.** Dev dependencies for tests and lint are fine.
- **No hardcoded secrets, keys, or URLs to outside hosts.**
- **Identity through one adapter:** `src/auth/identity.ts` exports `IdentityProvider` and `devIdentityProvider`. Views never read identity directly.
- **Roles:** use the existing `Role` type. The role table maps identity to role and lives in `src/auth/roleMap.ts`.
- **View guard:** one `RequireRole` component wraps each view. Navigation filtering stays, but it is not the control.
- **Ledger:** new delta types `ROLE_CHANGE` and `ACCESS_DENIED` are added to `DeltaType`. Existing types stay unchanged.
- **Additive only:** do not rename or remove existing fields, IDs, or metric definitions.
- **Files:** keep new files under 300 lines.

---

## 5. The 3 Gated Checks
Run in this order. All three must pass before showing the diff for human review.

| Gate | Command | Pass rule |
|---|---|---|
| 1. Lint | `npx eslint .` | 0 errors |
| 2. Unit | `npx vitest run` | All tests pass |
| 3. Acceptance | `npx playwright test` | All tests pass |

Shortcut: `npm run gates` runs all three in order.
If a gate fails, fix and rerun from Gate 1. Do not weaken or delete a test to pass a gate.

---

## 6. Agent Prompt Directive
Paste this into VS Code Copilot Chat in Agent mode, with this repo open:

```
Read #file:INTENT.md and #file:.github/copilot-instructions.md. Implement INTENT-001 only. Write the "Add" tests in Section 3 first and confirm they fail, then implement until they pass. Follow every rule in Sections 2 and 4. Run the 3 gated checks in Section 5 in order and show me the results table. Do not show the diff until all three pass. List any open item from Section 2 you could not resolve.
```
