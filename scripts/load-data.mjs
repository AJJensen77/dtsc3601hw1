// One-time script: create the schema and load skaters.csv into Supabase.
//
// Usage:
//   node scripts/load-data.mjs
//
// Requires DATABASE_URL in .env pointing at your Supabase Postgres
// connection string (the "Transaction pooler" URI, port 6543).

import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import pg from "pg";

const { Client } = pg;

const ROOT = path.resolve(import.meta.dirname, "..");

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

const schema = readFileSync(path.join(ROOT, "supabase", "schema.sql"), "utf8");

const csvText = readFileSync(path.join(ROOT, "skaters.csv"), "utf8");
const rows = parse(csvText, { columns: true });

const situationAll = rows.filter((r) => r.situation === "all");

const client = new Client({ connectionString: url });
await client.connect();

await client.query(schema);
await client.query("truncate table skater_stats");

const insertSql = `
  insert into skater_stats
    (player_id, season, name, team, position, games_played, goals, assists,
     points, hits, penalty_minutes, shots_on_goal, x_goals, takeaways,
     giveaways, faceoffs_won, on_ice_corsi_pct)
  values
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
  on conflict (player_id, season) do update set
    name = excluded.name, team = excluded.team, position = excluded.position,
    games_played = excluded.games_played, goals = excluded.goals,
    assists = excluded.assists, points = excluded.points, hits = excluded.hits,
    penalty_minutes = excluded.penalty_minutes, shots_on_goal = excluded.shots_on_goal,
    x_goals = excluded.x_goals, takeaways = excluded.takeaways,
    giveaways = excluded.giveaways, faceoffs_won = excluded.faceoffs_won,
    on_ice_corsi_pct = excluded.on_ice_corsi_pct
`;

let count = 0;
for (const r of situationAll) {
  const assists = Number(r.I_F_primaryAssists) + Number(r.I_F_secondaryAssists);
  await client.query(insertSql, [
    Number(r.playerId),
    Number(r.season),
    r.name,
    r.team,
    r.position,
    Number(r.games_played),
    Number(r.I_F_goals),
    assists,
    Number(r.I_F_points),
    Number(r.I_F_hits),
    Number(r.I_F_penalityMinutes),
    Number(r.I_F_shotsOnGoal),
    Number(r.I_F_xGoals),
    Number(r.I_F_takeaways),
    Number(r.I_F_giveaways),
    Number(r.I_F_faceOffsWon),
    Number(r.onIce_corsiPercentage),
  ]);
  count += 1;
}

console.log(`Loaded ${count} rows into 'skater_stats'.`);
await client.end();
