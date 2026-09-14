"use client";

import { useMemo, useState } from "react";
import type { Skater } from "@/lib/data";
import { topBy } from "@/lib/aggregations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_PLAYER_FINDER_API_URL;

type StatForm = {
  games_played: string;
  goals: string;
  assists: string;
  points: string;
  hits: string;
  penalty_minutes: string;
  shots_on_goal: string;
  x_goals: string;
  takeaways: string;
  giveaways: string;
  faceoffs_won: string;
  on_ice_corsi_pct: string;
  k: string;
};

const EMPTY_FORM: StatForm = {
  games_played: "80",
  goals: "25",
  assists: "30",
  points: "55",
  hits: "60",
  penalty_minutes: "30",
  shots_on_goal: "160",
  x_goals: "22.0",
  takeaways: "30",
  giveaways: "30",
  faceoffs_won: "0",
  on_ice_corsi_pct: "0.50",
  k: "5",
};

const FIELDS: { key: keyof StatForm; label: string; step?: string }[] = [
  { key: "games_played", label: "Games Played" },
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "points", label: "Points" },
  { key: "hits", label: "Hits" },
  { key: "penalty_minutes", label: "Penalty Minutes" },
  { key: "shots_on_goal", label: "Shots on Goal" },
  { key: "x_goals", label: "Expected Goals (xG)", step: "0.1" },
  { key: "takeaways", label: "Takeaways" },
  { key: "giveaways", label: "Giveaways" },
  { key: "faceoffs_won", label: "Faceoffs Won" },
  { key: "on_ice_corsi_pct", label: "On-Ice Corsi % (0-1)", step: "0.01" },
];

type SimilarPlayer = {
  name: string;
  team: string;
  position: string;
  games_played: number;
  distance: number;
};

type SimilarResponse = {
  similar_players: SimilarPlayer[];
  anomaly_score: number;
};

function statLineFromSkater(s: Skater): StatForm {
  return {
    games_played: String(s.gamesPlayed),
    goals: String(s.goals),
    assists: String(s.assists),
    points: String(s.points),
    hits: String(s.hits),
    penalty_minutes: String(s.penaltyMinutes),
    shots_on_goal: String(s.shotsOnGoal),
    x_goals: s.xGoals.toFixed(1),
    takeaways: String(s.takeaways),
    giveaways: String(s.giveaways),
    faceoffs_won: String(s.faceoffsWon),
    on_ice_corsi_pct: s.onIceCorsiPct.toFixed(2),
    k: "5",
  };
}

export function PlayerFinder({ skaters }: { skaters: Skater[] }) {
  const presetPlayers = useMemo(
    () => topBy(skaters, (s) => s.points, 100),
    [skaters]
  );

  const [form, setForm] = useState<StatForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimilarResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[] | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField(key: keyof StatForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function loadPreset(playerId: string | null) {
    const skater = presetPlayers.find((s) => String(s.playerId) === playerId);
    if (skater) {
      setForm(statLineFromSkater(skater));
      setResult(null);
      setValidationErrors(null);
      setErrorMessage(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!API_URL) {
      setErrorMessage(
        "NEXT_PUBLIC_PLAYER_FINDER_API_URL is not configured for this deployment."
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setValidationErrors(null);
    setErrorMessage(null);

    const body = {
      games_played: Number(form.games_played),
      goals: Number(form.goals),
      assists: Number(form.assists),
      points: Number(form.points),
      hits: Number(form.hits),
      penalty_minutes: Number(form.penalty_minutes),
      shots_on_goal: Number(form.shots_on_goal),
      x_goals: Number(form.x_goals),
      takeaways: Number(form.takeaways),
      giveaways: Number(form.giveaways),
      faceoffs_won: Number(form.faceoffs_won),
      on_ice_corsi_pct: Number(form.on_ice_corsi_pct),
      k: Number(form.k),
    };

    try {
      const res = await fetch(`${API_URL}/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 422) {
        const data = await res.json();
        const messages = (data.detail as { loc: string[]; msg: string }[]).map(
          (d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`
        );
        setValidationErrors(messages);
        return;
      }

      if (res.status === 503) {
        const data = await res.json();
        setErrorMessage(data.detail ?? "The model API is temporarily unavailable.");
        return;
      }

      if (!res.ok) {
        setErrorMessage(`Request failed with status ${res.status}.`);
        return;
      }

      const data = (await res.json()) as SimilarResponse;
      setResult(data);
    } catch {
      setErrorMessage(
        "Couldn't reach the Similar Player Finder API. It may be cold-starting — try again in a few seconds."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Similar Player Finder</CardTitle>
          <CardDescription>
            Enter a stat line (or load a real player) and find the most
            statistically similar skaters in the league, via a live model API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Prefill from a real player (top 100 scorers)</Label>
            <Select onValueChange={loadPreset}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a player…" />
              </SelectTrigger>
              <SelectContent>
                {presetPlayers.map((s) => (
                  <SelectItem key={s.playerId} value={String(s.playerId)}>
                    {s.name} ({s.team}, {s.points} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={f.key} className="text-xs">
                    {f.label}
                  </Label>
                  <Input
                    id={f.key}
                    type="number"
                    step={f.step ?? "1"}
                    value={form[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
            <div className="flex items-end gap-3">
              <div className="w-28 space-y-1">
                <Label htmlFor="k" className="text-xs">
                  Results (k)
                </Label>
                <Input
                  id="k"
                  type="number"
                  min={1}
                  max={25}
                  value={form.k}
                  onChange={(e) => updateField("k", e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Searching…" : "Find Similar Players"}
              </Button>
            </div>
          </form>

          {validationErrors ? (
            <Alert variant="destructive">
              <AlertTitle>Invalid input (422)</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {validationErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Served live from a scikit-learn nearest-neighbor pipeline
            deployed on Modal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Anomaly score
                </span>
                <Badge variant="secondary" className="font-mono">
                  {result.anomaly_score.toFixed(2)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (avg. distance to nearest neighbors — higher is more unusual)
                </span>
              </div>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Pos</TableHead>
                      <TableHead className="text-right">GP</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.similar_players.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.team}</TableCell>
                        <TableCell>{p.position}</TableCell>
                        <TableCell className="text-right">
                          {p.games_played}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {p.distance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Submit a stat line to see results here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
