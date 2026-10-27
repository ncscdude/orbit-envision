# ORBIT Envision Path: Provenance Record
Internal record. Keep with the repository and share with approvers.

## Who and what produced this code
| Date | Step | Tool | Human |
|---|---|---|---|
| 2026-10-26 | Build specification and backlog drafted | Claude (Anthropic) | ORBIT Gov Lead directed and reviewed |
| 2026-10-26 to 27 | Prototype 4.2 to 4.3 generated | Gemini in Google AI Studio | ORBIT Gov Lead directed and tested |
| 2026-10-27 | Rename pass, cleanup, test gates, INTENT-001 | Claude (Anthropic), Claude Code | ORBIT Gov Lead approved scope |

Commits made with AI assistance carry a `Co-Authored-By` trailer.

## Comparison material
- A contractor concept mockup for a boards KPI dashboard was reviewed on 2026-10-26 and 2026-10-27, for comparison only.
- Some of its wording and structure labels had entered the prototype through the build specification.
- On 2026-10-27, all identified wording from that mockup was replaced with ORBIT vocabulary (see `docs/TERM_ORIGINS.md`). Reference numbers and colors were changed. Values that had been typed in are now computed from seed data.
- A hashed term guard test now blocks that wording from returning.
- Remaining similarity: the count of phases (8) and KPI rows (11). Labels and definitions are ORBIT's own.

## Data
All people, IDs, PAS codes, and values in this repository are fictional.

## Branches
| Branch | Content |
|---|---|
| `prototype-4.3.0` | Untouched export of the prototype source, kept for the record |
| `envision-path` | Cleaned code, test gates, and INTENT files for Envision |
| `cloudflare-host` | `envision-path` plus Cloudflare hosting config, security headers, and hosting tests |

Decide before pushing to web.git.mil whether to push only `envision-path`. Its history includes the baseline commit.
