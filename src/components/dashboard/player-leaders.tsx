"use client";

import { useMemo, useState } from "react";
import type { Skater } from "@/lib/data";
import { takeawayDiff, topBy } from "@/lib/aggregations";
import { LeaderboardCard } from "./leaderboard-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STAT_OPTIONS = [
  { value: "points", label: "Points" },
  { value: "goals", label: "Goals" },
  { value: "assists", label: "Assists" },
  { value: "hits", label: "Hits" },
  { value: "penaltyMinutes", label: "Penalty Minutes" },
  { value: "faceoffsWon", label: "Faceoffs Won" },
  { value: "takeawayDiff", label: "Takeaway Differential" },
  { value: "onIceCorsiPct", label: "Corsi % (on-ice shot share)" },
] as const;

type StatKey = (typeof STAT_OPTIONS)[number]["value"];

const MIN_GAMES_OPTIONS = [10, 20, 40, 60];

function statValue(s: Skater, stat: StatKey): number {
  if (stat === "takeawayDiff") return takeawayDiff(s);
  if (stat === "onIceCorsiPct") return s.onIceCorsiPct * 100;
  return s[stat];
}

export function PlayerLeaders({ skaters }: { skaters: Skater[] }) {
  const [stat, setStat] = useState<StatKey>("points");
  const [minGames, setMinGames] = useState(20);

  const qualified = useMemo(
    () => skaters.filter((s) => s.gamesPlayed >= minGames),
    [skaters, minGames]
  );

  const leaders = useMemo(
    () => topBy(qualified, (s) => statValue(s, stat), 15),
    [qualified, stat]
  );

  const statLabel = STAT_OPTIONS.find((o) => o.value === stat)?.label ?? stat;
  const isPercent = stat === "onIceCorsiPct";

  const chartData = leaders.map((s) => ({
    label: s.name,
    value: statValue(s, stat),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={stat} onValueChange={(v) => setStat(v as StatKey)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Stat" />
          </SelectTrigger>
          <SelectContent>
            {STAT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(minGames)}
          onValueChange={(v) => setMinGames(Number(v))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Min games" />
          </SelectTrigger>
          <SelectContent>
            {MIN_GAMES_OPTIONS.map((g) => (
              <SelectItem key={g} value={String(g)}>
                Min {g} games played
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderboardCard
          title={statLabel}
          description={`Top 15 — min ${minGames} games played`}
          data={chartData}
          valueFormatter={(v) => (isPercent ? `${v.toFixed(1)}%` : v.toLocaleString())}
        />

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">GP</TableHead>
                <TableHead className="text-right">G</TableHead>
                <TableHead className="text-right">A</TableHead>
                <TableHead className="text-right">P</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaders.map((s, i) => (
                <TableRow key={s.playerId}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.team}</TableCell>
                  <TableCell className="text-right">{s.gamesPlayed}</TableCell>
                  <TableCell className="text-right">{s.goals}</TableCell>
                  <TableCell className="text-right">{s.assists}</TableCell>
                  <TableCell className="text-right">{s.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
