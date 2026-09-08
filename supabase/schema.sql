-- NHL skater stats schema
-- Run this once in the Supabase SQL editor (or via scripts/load-data.mjs).
-- Table is named skater_stats (not skaters) to avoid colliding with the
-- HW2 project's `skaters` table living in the same Supabase database.

create table if not exists skater_stats (
  id bigserial primary key,
  player_id integer not null,
  season integer not null,
  name text not null,
  team text not null,
  position text not null,
  games_played integer not null,
  goals integer not null,
  assists integer not null,
  points integer not null,
  hits integer not null,
  penalty_minutes integer not null,
  shots_on_goal integer not null,
  x_goals numeric not null,
  takeaways integer not null,
  giveaways integer not null,
  faceoffs_won integer not null,
  on_ice_corsi_pct numeric not null,
  unique (player_id, season)
);

create index if not exists skater_stats_team_idx on skater_stats (team);
create index if not exists skater_stats_points_idx on skater_stats (points desc);

alter table skater_stats enable row level security;

drop policy if exists "Public read access" on skater_stats;
create policy "Public read access" on skater_stats for select using (true);
