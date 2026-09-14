"""Fit the Similar Player Finder pipeline and dump the artifact bundle.

Usage:
    uv run python build_pipeline.py

Reads skaters.csv (2025-26 NHL skater stats), fits a
RateStatsTransformer -> StandardScaler pipeline plus a NearestNeighbors
index over all qualified skaters, and writes pipeline.joblib containing
the pipeline, the neighbor index, the transformed matrix, the player
records the index points back to, and build metadata.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from pipeline_def import RateStatsTransformer

ROOT = Path(__file__).parent
CSV_PATH = ROOT / "skaters.csv"
ARTIFACT_PATH = ROOT / "pipeline.joblib"

RATE_COLUMNS = [
    "goals",
    "assists",
    "points",
    "hits",
    "penalty_minutes",
    "shots_on_goal",
    "x_goals",
    "takeaways",
    "giveaways",
    "faceoffs_won",
]
PASSTHROUGH_COLUMNS = ["on_ice_corsi_pct"]
DENOMINATOR_COLUMN = "games_played"
MIN_GAMES_PLAYED = 5
N_NEIGHBORS_DEFAULT = 10


def load_skaters() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH)
    df = df[df["situation"] == "all"].copy()
    df["assists"] = df["I_F_primaryAssists"] + df["I_F_secondaryAssists"]
    df = df.rename(
        columns={
            "I_F_goals": "goals",
            "I_F_points": "points",
            "I_F_hits": "hits",
            "I_F_penalityMinutes": "penalty_minutes",
            "I_F_shotsOnGoal": "shots_on_goal",
            "I_F_xGoals": "x_goals",
            "I_F_takeaways": "takeaways",
            "I_F_giveaways": "giveaways",
            "I_F_faceOffsWon": "faceoffs_won",
            "onIce_corsiPercentage": "on_ice_corsi_pct",
        }
    )
    df = df[df["games_played"] >= MIN_GAMES_PLAYED].reset_index(drop=True)

    keep = [
        "playerId",
        "name",
        "team",
        "position",
        DENOMINATOR_COLUMN,
        *RATE_COLUMNS,
        *PASSTHROUGH_COLUMNS,
    ]
    return df[keep]


def main() -> None:
    df = load_skaters()

    pipeline = Pipeline(
        [
            (
                "rates",
                RateStatsTransformer(
                    rate_columns=RATE_COLUMNS,
                    denominator_column=DENOMINATOR_COLUMN,
                    passthrough_columns=PASSTHROUGH_COLUMNS,
                ),
            ),
            ("scale", StandardScaler()),
        ]
    )

    matrix = pipeline.fit_transform(df)

    n_neighbors = min(N_NEIGHBORS_DEFAULT, len(df))
    neighbors = NearestNeighbors(n_neighbors=n_neighbors, metric="euclidean")
    neighbors.fit(matrix)

    players = df[["playerId", "name", "team", "position", "games_played"]].to_dict(
        orient="records"
    )

    feature_names = list(
        RateStatsTransformer(
            RATE_COLUMNS, DENOMINATOR_COLUMN, PASSTHROUGH_COLUMNS
        ).get_feature_names_out()
    )

    bundle = {
        "pipeline": pipeline,
        "neighbors": neighbors,
        "matrix": matrix,
        "players": players,
        "feature_names": feature_names,
        "metadata": {
            "steps": [name for name, _ in pipeline.steps] + ["neighbors"],
            "built_at": datetime.now(timezone.utc).isoformat(),
            "sklearn_version": sklearn.__version__,
            "n_players_indexed": len(df),
            "n_neighbors_default": n_neighbors,
            "min_games_played": MIN_GAMES_PLAYED,
            "feature_names": feature_names,
        },
    }

    joblib.dump(bundle, ARTIFACT_PATH)
    print(
        f"Wrote {ARTIFACT_PATH} — indexed {len(df)} players, "
        f"sklearn {sklearn.__version__}"
    )


if __name__ == "__main__":
    main()
