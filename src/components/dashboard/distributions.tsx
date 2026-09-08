"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Skater } from "@/lib/data";
import { histogramBins, positionTotals } from "@/lib/aggregations";

const MIN_GAMES = 20;

const corsiConfig = {
  count: { label: "Players", color: "var(--chart-1)" },
} satisfies ChartConfig;

const positionConfig = {
  points: { label: "Points", color: "var(--chart-2)" },
} satisfies ChartConfig;

const scatterConfig = {
  goals: { label: "Goals", color: "var(--chart-3)" },
} satisfies ChartConfig;

type ScatterPoint = { name: string; xGoals: number; goals: number };

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ScatterPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as ScatterPoint;
  return (
    <div className="grid gap-1 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium text-foreground">{point.name}</div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Expected Goals</span>
        <span className="font-mono tabular-nums text-foreground">
          {point.xGoals}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Goals</span>
        <span className="font-mono tabular-nums text-foreground">
          {point.goals}
        </span>
      </div>
    </div>
  );
}

export function Distributions({ skaters }: { skaters: Skater[] }) {
  const qualified = useMemo(
    () => skaters.filter((s) => s.gamesPlayed >= MIN_GAMES),
    [skaters]
  );

  const corsiBins = useMemo(
    () => histogramBins(qualified.map((s) => s.onIceCorsiPct * 100), 16),
    [qualified]
  );

  const positions = useMemo(() => positionTotals(skaters), [skaters]);

  const scatterData = useMemo(
    () =>
      qualified.map((s) => ({
        xGoals: Number(s.xGoals.toFixed(1)),
        goals: s.goals,
        name: s.name,
      })),
    [qualified]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>On-Ice Corsi % Distribution</CardTitle>
          <CardDescription>
            Qualified skaters (min {MIN_GAMES} games played)
          </CardDescription>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Corsi % is the share of all shot attempts (shots on goal, missed
            shots, and blocked shots) taken by a player&apos;s team, versus
            the opponent&apos;s, while that player is on the ice — a proxy
            for puck possession and shot-attempt dominance. Above 50% means
            their team out-attempted the opponent while they played.
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={corsiConfig} className="aspect-video w-full">
            <BarChart data={corsiBins} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="bin"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={2}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={3} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals vs. Expected Goals</CardTitle>
          <CardDescription>
            Qualified skaters (min {MIN_GAMES} games played)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={scatterConfig} className="aspect-video w-full">
            <ScatterChart margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis
                type="number"
                dataKey="xGoals"
                name="Expected Goals"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                label={{ value: "Expected Goals (xG)", position: "insideBottom", offset: -4, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="goals"
                name="Goals"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 45, y: 45 },
                ]}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<ScatterTooltip />}
              />
              <Scatter data={scatterData} fill="var(--color-goals)" fillOpacity={0.55} />
            </ScatterChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Points by Position</CardTitle>
          <CardDescription>League-wide totals, 2025-26 season</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={positionConfig} className="aspect-[3/1] w-full">
            <BarChart data={positions} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="position"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="points" fill="var(--color-points)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
