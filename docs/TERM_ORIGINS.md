# ORBIT Term Origins
Purpose: show where each term in the app comes from, so ORBIT's wording is traceable to its own sources.

## Sources
| ID | Source | Date |
|---|---|---|
| SRC-A | ORBIT-BMO System schedule sheet (`12SCH_GSHEET_ORBIT-BMO-System`) | 2026-05-10 |
| SRC-B | Project Helios ORBIT-BMO schedule sheet (`12SCH_GSHEET_Project-Helios-ORBIT-BMO`) | 2026-02-03 |
| SRC-C | Sheet references: "Actual process overlayed with HELIOS aspiration" and "ORBIT BMO CY26 Modernization and Implementation Blueprint" | As cited in SRC-A and SRC-B |
| SRC-D | ORBIT Dashboard Metrics Catalog (M-101 to M-605) | 2026 |
| SRC-E | BMO board lifecycle (team process notes) | 2026 |
| SRC-F | ORBIT original build specification (Gemini-drafted, ORBIT-owned) | 2026-10-26 |
| NEW | Coined for ORBIT in the Envision Path rename pass | 2026-10-27 |

Note: SRC-A and SRC-B carry identical tables despite different dates.

## Native ORBIT terms (keep)
| Term | Source |
|---|---|
| PIPE-Ingest-Roster, PIPE-MyVector-SOI, PIPE-Ingest-ROPE, PIPE-Brief-Generator, PIPE-Match-Run | SRC-A, SRC-B |
| PDO-Scoring-Rubric, VIEW-ScoringAudit, VIEW-MatchReview, VIEW-PostBoardAudit | SRC-A, SRC-B |
| AGENT-Publisher, CHAT-SNAPSHOT, DELTA ledger, Heartburn Review (top 1%) | SRC-A, SRC-B |
| Req 083, Req 145, Req 147, Req 149, Req 150 | SRC-A, SRC-B |
| PSDM, SOI, SOI Opt-In, limitation codes, ROPs, audit package | SRC-A, SRC-B |
| Data Engineer, Integration Lead, Briefing Owner, Scoring Engineer, Matching Lead, Program Manager, AI Lead | SRC-A, SRC-B (owner titles) |
| ARMS, MilPDS, MyVector, SURF, eBOSS | SRC-D, SRC-E |
| Stage gate: Ingested, Validated, Locked, Scoring, Finalized | SRC-D |
| Packet Completeness (95% lock gate), Portfolio Readiness, Commander Actions | SRC-D |
| Order of Merit, matching and placement, waivers, results PSDM, AAR, record prep and freeze | SRC-E |
| ORBIT roles: BMO Lead, Board Recorder, Panelist, Assignments Officer, HQ Strategic Viewer, CFM / Career Planner | SRC-F |

## Terms coined in this pass (NEW)
| Area | Terms |
|---|---|
| Phase names | Cycle Stand-Up, Solicitation & Planning, Roster Intake, Record Prep & Freeze, Record Scoring, Order of Merit, Matching & Placement, Results Release & AAR |
| Cards and charts | Schedule On Track, Packet Check, Items Needing Action, Cycle Status, Schedule Adherence, Item Age |
| Data logs | Cycle Log, Milestone Log, Packet Check, Action Items, Risk & Issue Log, Results & Placement |
| KPI names | Cycle Plan On Schedule, Eligibility Called On Time, Packet Completeness, Record Request Turnaround, Scoring Window Met, Records Scored per Hour, Order of Merit Certified On Time, Results Transfer On Time, Placement Cases Closed On Time, Items Past Suspense, AAR Items Closed On Time |

## Native targets available for future KPIs (from SRC-A, SRC-B)
| Target | Value |
|---|---|
| Roster ingest success | 99% or higher |
| Duplicate detection | under 1% |
| SOI Opt-In reflected | within 5 minutes |
| ROP auto-ingest | 100% |
| Scribe time reduction | 40% target |
| Match accuracy | 98% or higher, exceptions to human review |
| Traceability | All results traceable to PDO versions; re-runnable audit |

## Excluded wording
Wording from outside concept materials is blocked by `src/guardrails/termGuard.test.ts`. The test stores only hashes of the excluded phrases, so the repo does not contain them.

## Open item
The phase bar still has 8 phases and the KPI catalog has 11 rows. Labels and definitions are ORBIT's, but the counts match an outside concept. Option for a later INTENT: re-base the bar on the native program phases in SRC-A (Analyze, Prepare, Consider, Output, Actions) and the KPI catalog on the native targets above.
