# Repository rules for coding agents

- Work only on the INTENT named in the request. Read `INTENT.md` first.
- Write tests first. Never delete or weaken a test to make a gate pass.
- Gates, in order: `npx eslint .`, `npx vitest run`, `npx playwright test`. All must pass before you present a diff.
- No new runtime dependencies. No secrets, keys, tokens, or passwords. No calls to outside hosts.
- Use ORBIT vocabulary. `src/guardrails/termGuard.test.ts` must pass. See `docs/TERM_ORIGINS.md`.
- Data in this repo is fictional. Do not add real names, DoD IDs, or PAS codes.
- Model-generated content must carry the AI badge and need a logged human sign-off.
- Changes are additive. Do not rename or remove existing types, IDs, or metric definitions.
