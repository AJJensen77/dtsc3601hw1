import { cache } from "react";
import { getPool } from "./db";

export type Skater = {
  playerId: number;
  season: number;
  name: string;
  team: string;
  position: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  hits: number;
  penaltyMinutes: number;
  shotsOnGoal: number;
  xGoals: number;
  takeaways: number;
  giveaways: number;
  faceoffsWon: number;
  onIceCorsiPct: number;
};

export const getSkaters = cache(async (): Promise<Skater[]> => {
  const pool = getPool();
  const { rows } = await pool.query(`
    select player_id, season, name, team, position, games_played, goals,
      assists, points, hits, penalty_minutes, shots_on_goal, x_goals,
      takeaways, giveaways, faceoffs_won, on_ice_corsi_pct
    from skater_stats
    order by points desc
  `);
  return rows.map((r) => ({
    playerId: r.player_id,
    season: r.season,
    name: r.name,
    team: r.team,
    position: r.position,
    gamesPlayed: r.games_played,
    goals: r.goals,
    assists: r.assists,
    points: r.points,
    hits: r.hits,
    penaltyMinutes: r.penalty_minutes,
    shotsOnGoal: r.shots_on_goal,
    xGoals: Number(r.x_goals),
    takeaways: r.takeaways,
    giveaways: r.giveaways,
    faceoffsWon: r.faceoffs_won,
    onIceCorsiPct: Number(r.on_ice_corsi_pct),
  }));
});
