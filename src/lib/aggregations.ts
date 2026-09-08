import type { Skater } from "./data";

export type TeamTotals = {
  team: string;
  goals: number;
  points: number;
  hits: number;
  penaltyMinutes: number;
};

export function teamTotals(skaters: Skater[]): TeamTotals[] {
  const map = new Map<string, TeamTotals>();
  for (const s of skaters) {
    const cur = map.get(s.team) ?? {
      team: s.team,
      goals: 0,
      points: 0,
      hits: 0,
      penaltyMinutes: 0,
    };
    cur.goals += s.goals;
    cur.points += s.points;
    cur.hits += s.hits;
    cur.penaltyMinutes += s.penaltyMinutes;
    map.set(s.team, cur);
  }
  return Array.from(map.values());
}

export function topBy<T>(items: T[], key: (item: T) => number, n: number): T[] {
  return [...items].sort((a, b) => key(b) - key(a)).slice(0, n);
}

const POSITION_LABELS: Record<string, string> = {
  C: "Center",
  L: "Left Wing",
  R: "Right Wing",
  D: "Defense",
};

export function positionTotals(skaters: Skater[]) {
  const order = ["C", "L", "R", "D"];
  const map = new Map<string, number>();
  for (const s of skaters) {
    map.set(s.position, (map.get(s.position) ?? 0) + s.points);
  }
  return order
    .filter((k) => map.has(k))
    .map((k) => ({ position: POSITION_LABELS[k] ?? k, points: map.get(k)! }));
}

export function takeawayDiff(s: Skater): number {
  return s.takeaways - s.giveaways;
}

export function histogramBins(
  values: number[],
  binCount: number
): { bin: string; count: number; midpoint: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / binCount || 1;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    start: min + i * width,
    end: min + (i + 1) * width,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(bins.length - 1, Math.floor((v - min) / width));
    bins[idx].count += 1;
  }
  return bins.map((b) => ({
    bin: `${b.start.toFixed(0)}-${b.end.toFixed(0)}`,
    count: b.count,
    midpoint: (b.start + b.end) / 2,
  }));
}
