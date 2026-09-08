import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dashboard } from "@/components/dashboard/dashboard";
import { StatTile } from "@/components/dashboard/stat-tile";
import { getSkaters } from "@/lib/data";

export default async function Home() {
  const skaters = await getSkaters();

  const totalGoals = skaters.reduce((sum, s) => sum + s.goals, 0);
  const totalPoints = skaters.reduce((sum, s) => sum + s.points, 0);
  const totalGames = skaters.reduce((sum, s) => sum + s.gamesPlayed, 0);
  const teamCount = new Set(skaters.map((s) => s.team)).size;
  const topScorer = [...skaters].sort((a, b) => b.points - a.points)[0];

  return (
    <div className="flex-1">
      <div className="relative overflow-hidden border-b bg-[radial-gradient(ellipse_120%_100%_at_50%_-20%,var(--accent),transparent)]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <Badge variant="secondary" className="mb-4">
            2025-26 Season
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            NHL Skater Analytics
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Live league-wide skater stats, sourced from MoneyPuck.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Skaters" value={skaters.length.toLocaleString()} />
            <StatTile label="Teams" value={teamCount.toString()} />
            <StatTile
              label="Total Goals"
              value={totalGoals.toLocaleString()}
              sublabel={`${totalGames.toLocaleString()} games played`}
            />
            <StatTile
              label="Points Leader"
              value={topScorer ? topScorer.points.toString() : "—"}
              sublabel={topScorer ? `${topScorer.name} (${topScorer.team})` : undefined}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Dashboard skaters={skaters} />
      </main>

      <Separator />
      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
        Data: MoneyPuck skater stats. Built with Next.js, shadcn/ui, and
        Recharts.
      </footer>
    </div>
  );
}
