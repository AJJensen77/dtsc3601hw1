# DTSC 3601 HW3

A Next.js + shadcn/ui dashboard exploring 2025-26 NHL skater stats, backed by
a Supabase Postgres database and deployed on Vercel.

## Architecture

- **Supabase**: `skater_stats` table (Postgres).
- **`scripts/load-data.mjs`**: one-time script that creates the schema and
  loads `skaters.csv` into Supabase.
- **`src/lib/db.ts` / `src/lib/data.ts`**: server-side data access via `pg`,
  reading `DATABASE_URL`.
- **`src/components/dashboard/*`**: shadcn/ui + Recharts dashboard (team
  leaders, player leaders, stat distributions).
- **Vercel**: hosts the deployed Next.js app; GitHub is connected for
  automatic deployments on push.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env and paste your Supabase connection string as DATABASE_URL
node scripts/load-data.mjs
npm run dev
```

## Deploy

```bash
vercel link
vercel env add DATABASE_URL production
vercel --prod
```
