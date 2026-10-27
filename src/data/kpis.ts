/**
 * Project ORBIT - KPI Catalog (K-01 to K-11)
 * Wording drawn from ORBIT sources: ORBIT-BMO schedule sheet, ORBIT metrics catalog, BMO lifecycle.
 */

import { KpiCatalogItem } from '../types';

export const INITIAL_KPIS: KpiCatalogItem[] = [
  { id: 'K-01', phase: 'Solicitation & Planning', kpi: 'Cycle Plan On Schedule',
    numerator: 'Cycles with planning milestones met by their due date', denominator: 'Cycles with planning milestones due',
    timeframe: 'Monthly / FYTD', likelyDataSource: 'ORBIT milestone log; MyVector and eBOSS records',
    accountableDataOwner: 'BMO Lead', computedValue: '91%', drillFilter: 'Preparation' },
  { id: 'K-02', phase: 'Roster Intake', kpi: 'Eligibility Called On Time',
    numerator: 'Candidates with an eligibility call made by the cutoff', denominator: 'Candidates needing an eligibility call',
    timeframe: 'Per cycle / monthly', likelyDataSource: 'PIPE-Ingest-Roster output; eBOSS',
    accountableDataOwner: 'Data Engineer', computedValue: '97%', drillFilter: 'Eligibility' },
  { id: 'K-03', phase: 'Record Prep & Freeze', kpi: 'Packet Completeness',
    numerator: 'Packets with SOI, ROP, ARMS, and SURF verified', denominator: 'Packets the cycle needs',
    timeframe: 'Per cycle', likelyDataSource: 'eBOSS; ORBIT packet check (M-504)',
    accountableDataOwner: 'Board Recorder', computedValue: '97%', drillFilter: 'Exceptions' },
  { id: 'K-04', phase: 'Record Prep & Freeze', kpi: 'Record Request Turnaround',
    numerator: 'Record requests filled by the due date', denominator: 'Record requests due',
    timeframe: 'Per cycle / monthly', likelyDataSource: 'ARMS request log; ORBIT milestone log',
    accountableDataOwner: 'Integration Lead', computedValue: '90%', drillFilter: 'Documents' },
  { id: 'K-05', phase: 'Record Scoring', kpi: 'Scoring Window Met',
    numerator: 'Cycles that finished scoring inside the planned window', denominator: 'Cycles scheduled to score',
    timeframe: 'Per cycle / quarterly', likelyDataSource: 'eBOSS scoring record',
    accountableDataOwner: 'Scoring Engineer', computedValue: '95%', drillFilter: 'Execution' },
  { id: 'K-06', phase: 'Record Scoring', kpi: 'Records Scored per Hour',
    numerator: 'Records scored', denominator: 'Panel hours',
    timeframe: 'Per cycle', likelyDataSource: 'eBOSS scoring record',
    accountableDataOwner: 'Scoring Engineer', computedValue: '18.4 rec/hr', drillFilter: 'Scored' },
  { id: 'K-07', phase: 'Order of Merit', kpi: 'Order of Merit Certified On Time',
    numerator: 'Orders of Merit certified by the due date', denominator: 'Cycles needing an Order of Merit',
    timeframe: 'Per cycle / monthly', likelyDataSource: 'eBOSS export; DELTA ledger',
    accountableDataOwner: 'Program Manager', computedValue: '100%', drillFilter: 'OOM' },
  { id: 'K-08', phase: 'Matching & Placement', kpi: 'Results Transfer On Time',
    numerator: 'Cycles whose results reached Assignments by the due date', denominator: 'Cycles with results to transfer',
    timeframe: 'Monthly / FYTD', likelyDataSource: 'DELTA ledger; ORBIT milestone log',
    accountableDataOwner: 'Matching Lead', computedValue: '95%', drillFilter: 'Handoff' },
  { id: 'K-09', phase: 'Matching & Placement', kpi: 'Placement Cases Closed On Time',
    numerator: 'Declines, deferrals, and placements closed by the due date', denominator: 'Open placement cases',
    timeframe: 'Monthly / FYTD', likelyDataSource: 'PIPE-Match-Run exceptions list',
    accountableDataOwner: 'Assignments Officer', computedValue: '92%', drillFilter: 'Activation' },
  { id: 'K-10', phase: 'All Phases', kpi: 'Items Past Suspense',
    numerator: 'Open items past their suspense date', denominator: 'All open items',
    timeframe: 'Weekly / monthly', likelyDataSource: 'ORBIT risk and issue log',
    accountableDataOwner: 'BMO Lead', computedValue: '4 need action', drillFilter: 'Aging' },
  { id: 'K-11', phase: 'Results Release & AAR', kpi: 'AAR Items Closed On Time',
    numerator: 'After-action items closed by their due date', denominator: 'After-action items due',
    timeframe: 'Monthly / quarterly', likelyDataSource: 'ORBIT AAR log',
    accountableDataOwner: 'Program Manager', computedValue: '50%', drillFilter: 'Improvement' }
];
