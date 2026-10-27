# Project ORBIT — Changelog & Build Register

## [4.3.0] - 2026-10-27 (Board Statistics Drill-Down & Multi-Role Governance Matrix)

### Individual Board Statistics & Role Governance
- **Board Statistics Drill-Down (`VIEW-BoardDetail` / EXP-011)**:
  - Enabled deep drill-down for all 12 board cycles (`BRD-001` through `BRD-012`) with quick-switch dropdown selector.
  - Interactive multi-tab board view:
    - **Overview & 5-Stage Funnel**: Visual stage-gate counts (Ingested, Validated, Locked, Scoring, Finalized), authoritative source freshness badges (ARMS, MilPDS, MyVector, SURF), and board quorum staffing (President, 12/14 Panelists, Scribes).
    - **Scoring & Evaluator Analytics**: Score distribution histogram (6.0-10.0), score variance / StdDev metrics, evaluator consensus/heartburn divergence list (>1.5 pts), and scoring velocity pace tracker.
    - **Candidate Docket**: Filterable docket (All, Pending, Scored, Exceptions) with real-time status badges and direct navigation to candidate evidence review.
    - **Milestones & Risks Register**: 16 milestones across 8 phases with planned vs. actual dates, critical path slippage days, and board risk items with mitigations.
    - **Board Governance & Role Permissions Matrix**: Multi-role security table defining explicit capabilities and restrictions for all 6 roles.
- **Role Permission Roles & Enforcement Model**:
  - Implemented `src/lib/boardStats.ts` and automated unit tests `src/lib/boardStats.test.ts` (4/4 tests passing).
  - Explicit role boundaries:
    - `BMO Lead`: FULL_ADMIN (Can execute Population Lock with M-504 >= 95% gate, certify OOM, edit milestones, rebalance panelist workloads).
    - `Board Recorder`: OPERATIONS_AUDIT (Can clear packet schema exceptions, update operational milestones, verify cryptographic hash chain).
    - `Panelist`: EVALUATOR_FIREWALLED (Can score candidates and flag records; Rule 5 firewall strictly redacts peer unfinalized scores, draft OOM ranking, and post-board talent predictions).
    - `Assignments Officer`: SLATING_ASSIGNMENTS (Billet matching and Gale-Shapley slating on finalized candidates; read-only during active scoring).
    - `HQ Strategic Viewer`: EXECUTIVE_READONLY (Portfolio readiness monitoring, milestone slippage tracking, cryptographic audit verification).
    - `CFM / Career Planner`: TALENT_MANAGEMENT (Post-board N-Box placement, retention loss modeling, and DAFSC succession tracking).
  - Linked drill-down triggers from Command Center (Active Boards card, Board Health Forecast cards) and Candidate Queue.

## [4.2.0] - 2026-10-26 (Initial Comprehensive Build)

### Implemented Approved Dashboard Experiences
- **IDEA-001 (Priority 1): Pipeline Health & Stage Gate**
  - Integrated 5-stage funnel (Ingested, Validated, Locked, Scoring, Finalized) summing to 36 candidates.
  - Added KPI strip for M-101 through M-105 with amber/red threshold states.
  - Added 7-day rolling throughput chart with topological slope indicator (M-106).
  - Added Stuck (>24h) and Failed Ingestion lists with interactive BMO Lead Retry button logging `PIPELINE_RETRY`.
- **IDEA-002 (Priority 2): Source Freshness Monitor**
  - Integrated source latency monitor covering ARMS, MilPDS, MyVector, and SURF with authoritative sync markers.
  - Enforced registry thresholds (M-301 to M-304) with amber (MilPDS) and red (SURF >7d) states.
  - Added click-to-filter affected candidate inspector.
- **IDEA-003 (Priority 3): Portfolio Readiness & Staffing**
  - Added active cycle cards with start dates, M-501 and M-502 gauges.
  - Enforced 95% Packet Completeness gate (M-504) on population lock action (`POPULATION_LOCK`).
  - Added staffing block (President, 12/14 Panelists, Scribes) and Commander Actions list with overdue items.
- **IDEA-004 (Priority 4): Endorser & Stratification Insights**
  - Added Endorsee Scale donut (Top 3 vs Other) per endorser with selector in Cross Analytics.
  - Added unit stratification stacked distribution bar (DP, P, Non-Strat) normalized to 100%.
  - Embedded contextual endorser insights in Panel Review Lens 7 labeled "Context, not a score".
- **IDEA-005 (Priority 5): Career Planner N-Box & Strategic Loss Calculator**
  - Created `VIEW-CareerPlanner` in Talent group with 3x3 Performance-Potential N-Box grid and counts.
  - Added dedicated **Loss Calculator & Comparative Flight Risk Analyzer**:
    - Lifecycle replacement cost calculator (Training Pipeline, TS/SCI clearance reinvestment, vacancy lag, lateral acquisition: $500k-$1.4M).
    - Comparative peer flight risk drivers explaining why an officer is at acute risk of departure over others (Commercial Defense Tech market pull, TIG stagnation >4y, 2nd Look tension, and geographic SOI friction).
    - Operational succession vulnerability highlighting primary successors to Critical Billets.
    - Interactive **What-If Retention Mitigation Simulator** (CSRB bonus, SOI priority slating, SDE fellowship, joint path) with live preserved capability value ($).
  - Added **Impact Loss Calculator Overlay** on candidate cards with direct departure simulation trigger.
  - Implemented **Capability Degradation Modal** calculating potential readiness degradation scores (M-601/M-602) if an officer (including 'Key Talent') departs or is removed from the active personnel roster.
  - Implemented **Comparative Risk Toggle** comparing selected candidate's flight hazard, operational consequence, capability loss, replacement cost, and backfill lag against cohort average benchmarks with visual delta markers.
  - Added dedicated **Key Talent Roster Strip** with instant capability degradation buttons.
  - Implemented Candidate Talent Dossier drawer with CFM notes logging `TALENT_NOTE`.
  - Strictly enforced Firewall Rule 5: concealed completely from Panelist role and unfinalized cycles.

### Core Architecture & Foundation
- Established types in `types.ts`, PRNG seed in `data/seed.ts`, and initial KPI definitions in `data/kpis.ts`.
- Built dynamic registries `registry/metrics.ts` and `registry/experiences.ts`.
- Implemented cryptographic DELTA ledger with SHA-256 chain verification, replay scrubber, and BMO Lead tamper simulation.
- Implemented ORBIT-NIPR File Canonicalizer (`00SRT` gate) with deterministic PASS/WARN/FAIL rules and SharePoint tree routing.
- Built Match Lab with weight sliders, Gale-Shapley stability mode, sensitivity testing (200 runs), near-fit finder, and PSDM export.
- Built Scoring Audit with heartburn detection (|myScore - panelAvg| >= 1.5) and 4-step Parity Breach Rollback Playbook.
- Added interactive Demo Guide walkthrough drawer with 10 guided evaluation steps.
