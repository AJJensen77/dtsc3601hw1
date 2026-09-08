"use client";

import { useMemo } from "react";
import type { Skater } from "@/lib/data";
import { teamTotals, topBy } from "@/lib/aggregations";
import { LeaderboardCard } from "./leaderboard-card";

export function TeamLeaders({ skaters }: { skaters: Skater[] }) {
  const totals = useMemo(() => teamTotals(skaters), [skaters]);

  const goals = useMemo(
    () =>
      topBy(totals, (t) => t.goals, 10).map((t) => ({
        label: t.team,
        value: t.goals,
      })),
    [totals]
  );
  const points = useMemo(
    () =>
      topBy(totals, (t) => t.points, 10).map((t) => ({
        label: t.team,
        value: t.points,
      })),
    [totals]
  );
  const hits = useMemo(
    () =>
      topBy(totals, (t) => t.hits, 10).map((t) => ({
        label: t.team,
        value: t.hits,
      })),
    [totals]
  );
  const pim = useMemo(
    () =>
      topBy(totals, (t) => t.penaltyMinutes, 10).map((t) => ({
        label: t.team,
        value: t.penaltyMinutes,
      })),
    [totals]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <LeaderboardCard title="Goals" description="Top 10 teams" data={goals} />
      <LeaderboardCard title="Points" description="Top 10 teams" data={points} />
      <LeaderboardCard title="Hits" description="Top 10 teams" data={hits} />
      <LeaderboardCard
        title="Penalty Minutes"
        description="Top 10 teams"
        data={pim}
      />
    </div>
  );
}
