"""One-time script: load skaters.csv into the Supabase Postgres table.

Usage:
    uv run python upload_data.py

Requires DATABASE_URL in .env (see .env.example) pointing at your Supabase
Postgres connection string.
"""

from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

from common import TABLE_NAME, get_engine

load_dotenv()

SKATERS_CSV = Path(__file__).parent / "skaters.csv"

COLUMNS = [
    "playerId", "season", "name", "team", "position", "situation",
    "games_played", "I_F_goals", "I_F_points", "I_F_primaryAssists",
    "I_F_secondaryAssists", "I_F_hits", "I_F_penalityMinutes",
    "I_F_shotsOnGoal", "I_F_xGoals", "I_F_takeaways", "I_F_giveaways",
    "I_F_faceOffsWon", "onIce_corsiPercentage",
]


def main() -> None:
    df = pd.read_csv(SKATERS_CSV, usecols=COLUMNS)
    df = df[df["situation"] == "all"].copy()
    df["assists"] = df["I_F_primaryAssists"] + df["I_F_secondaryAssists"]

    engine = get_engine()
    df.to_sql(TABLE_NAME, engine, if_exists="replace", index=False)
    print(f"Uploaded {len(df)} rows to '{TABLE_NAME}'.")


if __name__ == "__main__":
    main()
