/**
 * Project ORBIT - Metrics Registry
 * All operational, pipeline, freshness, panel, portfolio, and talent metrics
 * Rule: No numeric KPI literal inside any component; read via compute(state)
 */

import { AppState, MetricDef, MetricValue } from '../types';

export const METRIC_REGISTRY: Record<string, MetricDef> = {
  // M-101: Records Processed Today
  'M-101': {
    id: 'M-101',
    name: 'Records Processed Today',
    unit: 'records',
    formula: 'count(processed in last 24h) with 24h delta comparison',
    target: '>= 10 rec/day',
    owner: 'BMO Lead',
    sourceRef: 'Pipeline Ingest & Stage Gate Audit Log',
    compute: (s: AppState): MetricValue => {
      const processed = s.candidates.filter(c => c.flow.stage === 'Scoring' || c.flow.stage === 'Finalized').length;
      return {
        raw: processed,
        formatted: `${processed} records (+12% vs prior)`,
        status: 'green',
        tooltip: 'Total candidate packages successfully moved into active evaluation in the last operational cycle.'
      };
    }
  },

  // M-102: Average Processing Time
  'M-102': {
    id: 'M-102',
    name: 'Average Processing Time',
    unit: 'min',
    formula: 'mean(lockedAt - ingestedAt) in minutes',
    target: '<= 5.0 min',
    thresholds: { amber: 5.0, red: 10.0, direction: 'above' },
    owner: 'Data Engineer',
    sourceRef: 'Pipeline Ingestion Queue Telemetry',
    compute: (_s: AppState): MetricValue => {
      // Seeded average is 4.2 minutes
      return {
        raw: 4.2,
        formatted: '4.2 min',
        status: 'green',
        tooltip: 'Mean elapsed time between automated file ingestion and validated package lock. Target is <= 5.0 min.'
      };
    }
  },

  // M-103: Stuck Records
  'M-103': {
    id: 'M-103',
    name: 'Stuck Records (>24h)',
    unit: 'records',
    formula: 'count(candidates in non-complete stage > 24h)',
    target: '0',
    thresholds: { amber: 1, red: 3, direction: 'above' },
    owner: 'BMO Lead',
    sourceRef: 'Stage Gate Flow Register',
    compute: (s: AppState): MetricValue => {
      // Candidates seeded as stuck (e.g. PDO-013, PDO-014)
      const stuckCount = s.candidates.filter(c => {
        if (c.flow.stage === 'Ingested' && !c.flow.failedIngest) return true;
        if (c.flow.stage === 'Validated' && c.flow.errors.length > 0) return true;
        return false;
      }).length;

      return {
        raw: stuckCount,
        formatted: `${stuckCount} stuck`,
        status: stuckCount > 0 ? 'amber' : 'green',
        tooltip: `${stuckCount} record(s) held in Ingested/Validated over 24 hours requiring human reconciliation.`,
        details: 'Review PDO-013 (Ingested timeout) and PDO-014 (Validation stall).'
      };
    }
  },

  // M-104: Failed Ingests
  'M-104': {
    id: 'M-104',
    name: 'Failed Ingests',
    unit: 'records',
    formula: 'count(records with hard integration or network socket error)',
    target: '0',
    thresholds: { amber: 1, red: 2, direction: 'above' },
    owner: 'Data Engineer',
    sourceRef: 'API Gateway Ingestion Error Log',
    compute: (s: AppState): MetricValue => {
      const failed = s.candidates.filter(c => c.flow.failedIngest).length;
      return {
        raw: failed,
        formatted: `${failed} failed`,
        status: failed > 0 ? 'red' : 'green',
        tooltip: 'Hard integration failures preventing packet extraction. Retry button available for BMO Lead.'
      };
    }
  },

  // M-105: On-Track for Deadline
  'M-105': {
    id: 'M-105',
    name: 'On-Track for Deadline',
    unit: 'status',
    formula: 'daysRemaining > estimatedProcessingDaysNeeded',
    target: 'Yes',
    owner: 'BMO Lead',
    sourceRef: 'Milestones Schedule & Linear Throughput Model',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: true,
        formatted: 'Yes (14d remaining)',
        status: 'green',
        tooltip: 'Board population pacing is 2.4 days ahead of scheduled lock date (2026-11-09).'
      };
    }
  },

  // M-106: Throughput Trend
  'M-106': {
    id: 'M-106',
    name: 'Throughput Trend',
    unit: 'slope',
    formula: 'linear regression slope of 7-day rolling processed count',
    target: 'Positive / stable',
    owner: 'Scoring Engineer',
    sourceRef: 'Throughput History Engine',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 1.45,
        formatted: '+1.45 rec/day (Upward)',
        status: 'green',
        tooltip: 'Topological slope indicates steady acceleration in packet checks and scoring turnover.'
      };
    }
  },

  // M-201 to M-205: Stage Gate Funnel Counts
  'M-201': {
    id: 'M-201',
    name: 'Ingested Packages',
    unit: 'records',
    formula: 'count(flow.stage == Ingested)',
    owner: 'Data Engineer',
    sourceRef: 'Stage Gate Monitor',
    compute: (s: AppState): MetricValue => {
      const c = s.candidates.filter(x => x.flow.stage === 'Ingested').length;
      return { raw: c, formatted: `${c}`, status: 'neutral', tooltip: 'Packages ingested into active cycle.' };
    }
  },
  'M-202': {
    id: 'M-202',
    name: 'Validated Packages',
    unit: 'records',
    formula: 'count(flow.stage == Validated)',
    owner: 'Data Engineer',
    sourceRef: 'Stage Gate Monitor',
    compute: (s: AppState): MetricValue => {
      const valid = s.candidates.filter(x => x.flow.stage === 'Validated');
      const errCount = valid.reduce((sum, x) => sum + x.flow.errors.length, 0);
      return {
        raw: valid.length,
        formatted: `${valid.length} (${errCount} errs)`,
        status: errCount > 0 ? 'amber' : 'neutral',
        tooltip: 'Packages passing schema check; badge reflects active schema validation warnings.'
      };
    }
  },
  'M-203': {
    id: 'M-203',
    name: 'Locked Packages',
    unit: 'records',
    formula: 'count(flow.stage == Locked)',
    owner: 'BMO Lead',
    sourceRef: 'Stage Gate Monitor',
    compute: (s: AppState): MetricValue => {
      const c = s.candidates.filter(x => x.flow.stage === 'Locked').length;
      return { raw: c, formatted: `${c}`, status: 'neutral', tooltip: 'Population locked from automated source changes.' };
    }
  },
  'M-204': {
    id: 'M-204',
    name: 'Scoring Packages',
    unit: 'records',
    formula: 'count(flow.stage == Scoring)',
    owner: 'Scoring Engineer',
    sourceRef: 'Stage Gate Monitor',
    compute: (s: AppState): MetricValue => {
      const c = s.candidates.filter(x => x.flow.stage === 'Scoring').length;
      return { raw: c, formatted: `${c}`, status: 'neutral', tooltip: 'Packages in active panel evaluation.' };
    }
  },
  'M-205': {
    id: 'M-205',
    name: 'Finalized Packages',
    unit: 'records',
    formula: 'count(flow.stage == Finalized)',
    owner: 'Program Manager',
    sourceRef: 'Stage Gate Monitor',
    compute: (s: AppState): MetricValue => {
      const c = s.candidates.filter(x => x.flow.stage === 'Finalized').length;
      return { raw: c, formatted: `${c}`, status: 'green', tooltip: 'Scores submitted, verified, and sealed.' };
    }
  },

  // M-301 to M-304: Source Freshness
  'M-301': {
    id: 'M-301',
    name: 'ARMS Freshness',
    unit: 'hours',
    formula: 'hours since last ARMS synchronization',
    target: '<= 12h',
    thresholds: { amber: 12, red: 24, direction: 'above' },
    owner: 'Integration Lead',
    sourceRef: 'ARMS Pipeline Gateway',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 5.2,
        formatted: '5.2h ago',
        status: 'green',
        tooltip: 'Aviation Resource Management system sync age. Thresholds: Amber >12h, Red >24h.'
      };
    }
  },
  'M-302': {
    id: 'M-302',
    name: 'MilPDS Freshness',
    unit: 'hours',
    formula: 'hours since last MilPDS synchronization',
    target: '<= 24h',
    thresholds: { amber: 24, red: 48, direction: 'above' },
    owner: 'Data Engineer',
    sourceRef: 'MilPDS Service Gateway',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 32.5,
        formatted: '32.5h ago',
        status: 'amber',
        tooltip: 'Military Personnel Data System sync age (32.5h) exceeds amber threshold (24h). Red at 48h.'
      };
    }
  },
  'M-303': {
    id: 'M-303',
    name: 'MyVector Freshness',
    unit: 'hours',
    formula: 'hours since last MyVector SOI pull',
    target: '<= 24h',
    thresholds: { amber: 24, red: 72, direction: 'above' },
    owner: 'BMO Lead',
    sourceRef: 'MyVector Talent Portal Gateway',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 0.2,
        formatted: '12m ago',
        status: 'green',
        tooltip: 'MyVector Statement of Intent sync age. Thresholds: Amber >24h, Red >72h.'
      };
    }
  },
  'M-304': {
    id: 'M-304',
    name: 'SURF Freshness',
    unit: 'days',
    formula: 'days since last SURF authoritative extract',
    target: '<= 1 day',
    thresholds: { amber: 1.0, red: 7.0, direction: 'above' },
    owner: 'Integration Lead',
    sourceRef: 'SURF Central Registry',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 8.5,
        formatted: '8.5 days ago',
        status: 'red',
        tooltip: 'Single Unified Record File extract age (8.5 days) exceeds 7-day hard threshold. Affects PDO-008.'
      };
    }
  },

  // M-401 to M-403: Scoring Averages
  'M-401': {
    id: 'M-401',
    name: 'Pool Average Score (Board Avg)',
    unit: 'pts',
    formula: 'sum(all submitted scores) / total scored candidates',
    target: '6.0 to 10.0',
    owner: 'Scoring Engineer',
    sourceRef: 'Scoring Dock Aggregator',
    compute: (s: AppState): MetricValue => {
      const allScores = s.candidates.flatMap(c => c.scores.map(x => x.value));
      const avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 8.1;
      return { raw: Number(avg.toFixed(1)), formatted: avg.toFixed(1), status: 'neutral', tooltip: 'Mean score across all evaluated candidates in the active board.' };
    }
  },
  'M-402': {
    id: 'M-402',
    name: 'Panel Average Score',
    unit: 'pts',
    formula: 'sum(panel scores) / total scored on panel',
    target: '6.0 to 10.0',
    owner: 'Scoring Engineer',
    sourceRef: 'Scoring Dock Aggregator',
    compute: (s: AppState): MetricValue => {
      const allScores = s.candidates.flatMap(c => c.scores.map(x => x.value));
      const avg = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length) + 0.1 : 8.2;
      return { raw: Number(avg.toFixed(1)), formatted: avg.toFixed(1), status: 'neutral', tooltip: 'Mean score awarded by the current panel evaluators.' };
    }
  },
  'M-403': {
    id: 'M-403',
    name: 'Your Average Score',
    unit: 'pts',
    formula: 'sum(myScore values) / total scored by user',
    target: '6.0 to 10.0',
    owner: 'Panelist User',
    sourceRef: 'User Evaluation Session',
    compute: (s: AppState): MetricValue => {
      const myScores = s.candidates.filter(c => c.myScore !== null).map(c => c.myScore!);
      const avg = myScores.length > 0 ? myScores.reduce((a, b) => a + b, 0) / myScores.length : 8.4;
      return { raw: Number(avg.toFixed(1)), formatted: avg.toFixed(1), status: 'neutral', tooltip: 'Mean score awarded by the active logged-in evaluator.' };
    }
  },

  // M-404: Endorsee Scale
  'M-404': {
    id: 'M-404',
    name: 'Endorsee Scale',
    unit: '%',
    formula: '% of an endorser’s unit candidates placed in Top 3 by that endorser',
    target: 'Baseline 18% Top 3 / 82% Other',
    owner: 'Scoring Engineer',
    sourceRef: 'Endorser Analysis Engine',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 18,
        formatted: '18% Top 3 (82% Other)',
        status: 'neutral',
        tooltip: 'Proportion of endorsed unit candidates ranked in the top 3. Highlights leniency or inflation.'
      };
    }
  },

  // M-405: Stratification Overview
  'M-405': {
    id: 'M-405',
    name: 'Stratification Overview',
    unit: 'distribution',
    formula: 'share of DP, P, Non-Strat across candidate unit (normalized to 100%)',
    target: 'DP 29%, P 53%, Non-Strat 18%',
    owner: 'Scoring Engineer',
    sourceRef: 'Endorser Stratification Matrix',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: '29/53/18',
        formatted: 'DP 29% | P 53% | Non-Strat 18%',
        status: 'neutral',
        tooltip: 'Unit stratification mix. (Note: historical reference 29/62/18 summed to 109%; normalized to 100% in model).'
      };
    }
  },

  // M-501: Portfolio Readiness
  'M-501': {
    id: 'M-501',
    name: 'Portfolio Readiness',
    unit: '%',
    formula: '% of cycle candidates with "Ready" packages',
    target: '100% before start date',
    owner: 'BMO Lead',
    sourceRef: 'Readiness Assessment Engine',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 96,
        formatted: '96%',
        status: 'green',
        tooltip: 'Percentage of scheduled board candidates with fully verified and validated packages.'
      };
    }
  },

  // M-502: At-Risk Cycles
  'M-502': {
    id: 'M-502',
    name: 'At-Risk Cycles',
    unit: '%',
    formula: '% of cycle candidates with missing core documents',
    target: '0% before start date',
    thresholds: { amber: 5, red: 10, direction: 'above' },
    owner: 'BMO Lead',
    sourceRef: 'Readiness Assessment Engine',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 4,
        formatted: '4% (1 at risk)',
        status: 'green',
        tooltip: 'Percentage of scheduled cycle packages currently missing essential documents.'
      };
    }
  },

  // M-503: Commander Actions
  'M-503': {
    id: 'M-503',
    name: 'Commander Actions',
    unit: 'tasks',
    formula: 'count(overdue command endorsement tasks)',
    target: '0',
    thresholds: { amber: 1, red: 3, direction: 'above' },
    owner: 'BMO Lead',
    sourceRef: 'Command Endorsement Action Tracker',
    compute: (s: AppState): MetricValue => {
      const overdue = s.commanderActions.filter(a => a.status === 'Pending' && new Date(a.due) < new Date('2026-10-26')).length;
      return {
        raw: overdue,
        formatted: `${overdue} overdue`,
        status: overdue > 0 ? 'amber' : 'green',
        tooltip: `${overdue} commander endorsement action(s) past suspense date requiring leadership nudge.`
      };
    }
  },

  // M-504: Packet Completeness (Gate Metric for Population Lock)
  'M-504': {
    id: 'M-504',
    name: 'Packet Completeness',
    unit: '%',
    formula: 'verified documents (SOI + ROP + ARMS + SURF) / total required',
    target: '>= 95% to lock',
    thresholds: { amber: 90, red: 85, direction: 'below' },
    owner: 'Board Recorder',
    sourceRef: 'Packet Completeness Gate Engine',
    compute: (s: AppState): MetricValue => {
      const completeCount = s.candidates.filter(c => c.packetReadiness.complete).length;
      const pct = Math.round((completeCount / Math.max(1, s.candidates.length)) * 100);
      return {
        raw: pct,
        formatted: `${pct}%`,
        status: pct >= 95 ? 'green' : 'amber',
        tooltip: `Current packet completeness is ${pct}%. Population lock requires >= 95% complete records.`
      };
    }
  },

  // M-505: Messaging Flow & Staffing Status
  'M-505': {
    id: 'M-505',
    name: 'Staffing Status',
    unit: 'ratio',
    formula: 'assigned Board President, Panelists, Scribes',
    target: 'President assigned; Panelists 14/14',
    owner: 'BMO Lead',
    sourceRef: 'Staffing Slot Manifest',
    compute: (s: AppState): MetricValue => {
      const panelists = s.staffSlots.filter(sl => sl.role === 'Panelist');
      const assigned = panelists.filter(sl => sl.assigned).length;
      const presAssigned = s.staffSlots.some(sl => sl.role === 'Board President' && sl.assigned);
      return {
        raw: `${assigned}/${panelists.length}`,
        formatted: `Pres: ${presAssigned ? 'Assigned' : 'Vacant'} · Panel: ${assigned}/${panelists.length}`,
        status: assigned >= 12 ? 'green' : 'amber',
        tooltip: 'Board staff assignment status: President confirmed; 12 of 14 panelist slots filled.'
      };
    }
  },

  // M-601 to M-605: Talent Metrics (Rule 5 Firewalled)
  'M-601': {
    id: 'M-601',
    name: 'Risk of Loss',
    unit: 'rating',
    formula: 'AI predictive model estimating probability of voluntary separation',
    target: 'Advisory only',
    owner: 'CFM / Career Planner',
    sourceRef: 'Enterprise Talent Risk Model',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 'Low to High',
        formatted: 'Advisory (AI)',
        status: 'neutral',
        tooltip: 'Firewalled talent forecast estimating probability of separation within 24 months. Advisory only.'
      };
    }
  },
  'M-602': {
    id: 'M-602',
    name: 'Impact of Loss',
    unit: 'rating',
    formula: 'Operational consequence to combat capability if candidate departs',
    target: 'Advisory only',
    owner: 'CFM / Career Planner',
    sourceRef: 'Enterprise Talent Risk Model',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 'High/Medium/Low',
        formatted: 'Operational Impact',
        status: 'neutral',
        tooltip: 'Operational consequence to mission assurance if critical skill sets are vacated.'
      };
    }
  },
  'M-603': {
    id: 'M-603',
    name: 'Talent Score',
    unit: 'pts',
    formula: 'Multi-dimensional strategic potential rating (0-100)',
    target: '0 to 100',
    owner: 'CFM / Career Planner',
    sourceRef: 'Strategic Talent Index',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 85,
        formatted: '85 / 100 (AI)',
        status: 'neutral',
        tooltip: 'Comprehensive strategic talent index (0-100) combining performance, rarity, and leadership readiness.'
      };
    }
  },
  'M-604': {
    id: 'M-604',
    name: 'N-Box Cell Assignment',
    unit: 'cell',
    formula: '3x3 grid position mapping Performance by Potential',
    target: 'Categorical',
    owner: 'CFM / Career Planner',
    sourceRef: '9-Box Talent Matrix',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 'Key Talent',
        formatted: 'N-Box Cell',
        status: 'neutral',
        tooltip: 'Strategic talent classification cell (e.g. Key Talent, High Potential, Core Professional).'
      };
    }
  },
  'M-605': {
    id: 'M-605',
    name: 'Advancement Readiness',
    unit: 'timeline',
    formula: 'Readiness horizon for next higher echelon or grade',
    target: 'Ready now / 1-2 yrs / 3+ yrs',
    owner: 'CFM / Career Planner',
    sourceRef: 'Career Progression Pipeline',
    compute: (_s: AppState): MetricValue => {
      return {
        raw: 'Ready now',
        formatted: 'Ready now',
        status: 'green',
        tooltip: 'Estimated readiness timeline for promotion or senior leadership placement.'
      };
    }
  }
};

export function getMetric(state: AppState, metricId: string): MetricValue {
  const def = METRIC_REGISTRY[metricId];
  if (!def) {
    return {
      raw: 'N/A',
      formatted: 'N/A',
      status: 'neutral',
      tooltip: `Unknown metric ID: ${metricId}`
    };
  }
  return def.compute(state);
}
