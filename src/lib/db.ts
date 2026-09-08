import { Pool } from "pg";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env for local dev, " +
          "or set it as a Vercel project environment variable for deployment."
      );
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}
