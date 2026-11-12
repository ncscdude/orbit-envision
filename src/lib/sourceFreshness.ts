// One clock and one rule set for source age, used by every screen that shows it.
// The demo data is a fixed snapshot, so age is measured against the snapshot time,
// not the viewer's clock. Production replaces DATA_AS_OF with the platform clock.
import type { SourcePipeline } from '../types';

export const DATA_AS_OF = '2026-10-26T19:42:00Z';

export type FreshnessStatus = 'green' | 'amber' | 'red';

// Limits in hours. Above amber = stale, above red = critical.
export const FRESHNESS_LIMITS: Record<string, { amber: number; red: number; label: string }> = {
  ARMS: { amber: 12, red: 24, label: 'Amber > 12h, Red > 24h' },
  MilPDS: { amber: 24, red: 48, label: 'Amber > 24h, Red > 48h' },
  MyVector: { amber: 24, red: 72, label: 'Amber > 24h, Red > 72h' },
  SURF: { amber: 24, red: 168, label: 'Amber > 1d, Red > 7d' }
};

export interface SourceAge {
  hours: number;
  text: string;
  status: FreshnessStatus;
  limits: string;
}

export function sourceAge(src: Pick<SourcePipeline, 'id' | 'lastSyncAt'>, asOf: string = DATA_AS_OF): SourceAge {
  const hours = Math.max(0, (new Date(asOf).getTime() - new Date(src.lastSyncAt).getTime()) / 3600000);
  const lim = FRESHNESS_LIMITS[src.id] ?? { amber: 24, red: 72, label: 'Amber > 24h, Red > 72h' };
  const status: FreshnessStatus = hours > lim.red ? 'red' : hours > lim.amber ? 'amber' : 'green';
  const text =
    hours < 1 ? `${Math.round(hours * 60)} min` : hours >= 72 ? `${(hours / 24).toFixed(1)} days` : `${hours.toFixed(1)}h`;
  return { hours, text, status, limits: lim.label };
}

export function sourceAgeById(sources: Pick<SourcePipeline, 'id' | 'lastSyncAt'>[], id: string): SourceAge | null {
  const src = sources.find(s => s.id === id);
  return src ? sourceAge(src) : null;
}
