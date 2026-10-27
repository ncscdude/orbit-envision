# Project ORBIT: Envision Path
Operational Repository for Boards and Talent. Demo build with fictional data, prepared for Envision.

## Run it
1. `npm install`
2. `npm run dev` then open http://localhost:3000

## Gates (run before any review)
| Gate | Command |
|---|---|
| Lint | `npx eslint .` |
| Unit | `npx vitest run` |
| Acceptance | `npx playwright test` |
| All three | `npm run gates` |

Playwright needs Chromium. On a new machine run `npx playwright install chromium` once, if your network allows it.

## Working with an agent
Open `INTENT.md`. Section 6 has the exact prompt for VS Code Copilot.

## Key files
| File | Purpose |
|---|---|
| `INTENT.md` | Current feature intent, guardrails, acceptance tests, gates |
| `docs/TERM_ORIGINS.md` | Where ORBIT's wording comes from |
| `docs/PROVENANCE.md` | Who and what produced this code |
| `docs/DEPLOY_CLOUDFLARE.md` | Hosting on Cloudflare behind Access |
| `CHANGELOG.md` | Changes by branch |
