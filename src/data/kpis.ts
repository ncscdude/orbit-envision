/**
 * Project ORBIT - KPI Catalog and Accountability Model
 * Rows K-01 to K-11 as specified in prompt
 */

import { KpiCatalogItem } from '../types';

export const INITIAL_KPIS: KpiCatalogItem[] = [
  {
    id: 'K-01',
    phase: 'Preparation',
    kpi: 'Preparation Timeliness',
    numerator: 'Boards completing required preparation milestones by suspense',
    denominator: 'Boards with preparation milestones due',
    timeframe: 'Monthly / FYTD',
    likelyDataSource: 'Boards workflow tracker; MyVector/eBOSS process records as validated',
    accountableDataOwner: 'Boards Management Lead',
    computedValue: '94%',
    drillFilter: 'Preparation'
  },
  {
    id: 'K-02',
    phase: 'Ingestion & Eligibility',
    kpi: 'Eligibility Completion Rate',
    numerator: 'Candidates with eligibility status completed by required deadline',
    denominator: 'Candidates requiring eligibility determination',
    timeframe: 'Per board / monthly',
    likelyDataSource: 'eBOSS ingestion template or validated Boards tracker',
    accountableDataOwner: 'Ingestion/Eligibility Process Owner',
    computedValue: '98%',
    drillFilter: 'Eligibility'
  },
  {
    id: 'K-03',
    phase: 'Document Assembly',
    kpi: 'Packet Completeness Rate',
    numerator: 'Candidate packets complete at readiness review',
    denominator: 'Candidate packets required for the board',
    timeframe: 'Per board',
    likelyDataSource: 'eBOSS; document-completeness tracker',
    accountableDataOwner: 'Document Assembly Owner',
    computedValue: '96%',
    drillFilter: 'Exceptions'
  },
  {
    id: 'K-04',
    phase: 'Document Assembly',
    kpi: 'Document Retrieval Timeliness',
    numerator: 'Required documents received by suspense',
    denominator: 'Required document requests due',
    timeframe: 'Per board / monthly',
    likelyDataSource: 'ARMS/AFPC request log; workflow tracker',
    accountableDataOwner: 'Document Retrieval Owner',
    computedValue: '93%',
    drillFilter: 'Documents'
  },
  {
    id: 'K-05',
    phase: 'Execution',
    kpi: 'Board Execution Timeliness',
    numerator: 'Boards completing scoring within planned execution window',
    denominator: 'Boards scheduled for execution',
    timeframe: 'Per board / quarterly',
    likelyDataSource: 'eBOSS board execution record',
    accountableDataOwner: 'Board Execution Lead',
    computedValue: '97%',
    drillFilter: 'Execution'
  },
  {
    id: 'K-06',
    phase: 'Execution',
    kpi: 'Scoring Throughput',
    numerator: 'Records scored',
    denominator: 'Board execution hours or days',
    timeframe: 'Per board',
    likelyDataSource: 'eBOSS scoring record',
    accountableDataOwner: 'Board Execution Lead',
    computedValue: '18.4 rec/hr',
    drillFilter: 'Scored'
  },
  {
    id: 'K-07',
    phase: 'Results Finalization',
    kpi: 'OOM Finalization Timeliness',
    numerator: 'OOM exports finalized and validated within standard',
    denominator: 'Boards requiring OOM finalization',
    timeframe: 'Per board / monthly',
    likelyDataSource: 'eBOSS OOM export; validated results tracker',
    accountableDataOwner: 'Results Finalization Owner',
    computedValue: '100%',
    drillFilter: 'OOM'
  },
  {
    id: 'K-08',
    phase: 'Post-Board',
    kpi: 'Post-Board Handoff Timeliness',
    numerator: 'Results handed to downstream team within standard',
    denominator: 'Boards requiring post-board handoff',
    timeframe: 'Monthly / FYTD',
    likelyDataSource: 'Results handoff log; workflow tracker',
    accountableDataOwner: 'Post-Board/Matching Owner',
    computedValue: '95%',
    drillFilter: 'Handoff'
  },
  {
    id: 'K-09',
    phase: 'Post-Board',
    kpi: 'Activation Resolution Timeliness',
    numerator: 'Declinations, deferments, and activations resolved within standard',
    denominator: 'Cases requiring action',
    timeframe: 'Monthly / FYTD',
    likelyDataSource: 'Centralized results/activation tracker',
    accountableDataOwner: 'Assignments/Activation Process Owner',
    computedValue: '92%',
    drillFilter: 'Activation'
  },
  {
    id: 'K-10',
    phase: 'Cross-Cutting Management',
    kpi: 'Open Issue Aging',
    numerator: 'Open issues beyond established suspense',
    denominator: 'Total open issues',
    timeframe: 'Weekly / monthly',
    likelyDataSource: 'Boards risk-and-issue register',
    accountableDataOwner: 'Boards Management Lead',
    computedValue: '3 overdue',
    drillFilter: 'Aging'
  },
  {
    id: 'K-11',
    phase: 'Closeout / Improvement',
    kpi: 'Improvement Action Completion Rate',
    numerator: 'Improvement actions completed by approved suspense',
    denominator: 'Improvement actions due in period',
    timeframe: 'Monthly / quarterly',
    likelyDataSource: 'Improvement action register',
    accountableDataOwner: 'Assigned Improvement-Action Owner',
    computedValue: '50%',
    drillFilter: 'Improvement'
  }
];
