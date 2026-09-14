"""FastAPI service for the NHL Similar Player Finder pipeline.

Run locally:
    uvicorn serve:app --reload
    open http://localhost:8000/docs
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pipeline_def import RateStatsTransformer  # noqa: F401 — needed to unpickle the bundle

logger = logging.getLogger("uvicorn.error")

ARTIFACT_PATH = Path(__file__).parent / "pipeline.joblib"

app = FastAPI(
    title="NHL Similar Player Finder",
    description=(
        "Given a skater's per-season stat line, finds the most statistically "
        "similar real NHL skaters and scores how unusual the profile is."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    _bundle = joblib.load(ARTIFACT_PATH)
    _load_error: str | None = None
except Exception as exc:  # noqa: BLE001 — any load failure should degrade to 503, not crash import
    logger.exception("Failed to load pipeline artifact at %s", ARTIFACT_PATH)
    _bundle = None
    _load_error = str(exc)


class SkaterStatLine(BaseModel):
    games_played: int = Field(..., ge=1, le=82)
    goals: int = Field(..., ge=0, le=100)
    assists: int = Field(..., ge=0, le=100)
    points: int = Field(..., ge=0, le=200)
    hits: int = Field(..., ge=0, le=500)
    penalty_minutes: int = Field(..., ge=0, le=300)
    shots_on_goal: int = Field(..., ge=0, le=500)
    x_goals: float = Field(..., ge=0, le=100)
    takeaways: int = Field(..., ge=0, le=300)
    giveaways: int = Field(..., ge=0, le=300)
    faceoffs_won: int = Field(..., ge=0, le=2000)
    on_ice_corsi_pct: float = Field(..., ge=0, le=1)
    k: int = Field(5, ge=1, le=25, description="Number of similar players to return")


class SimilarPlayer(BaseModel):
    name: str
    team: str
    position: str
    games_played: int
    distance: float


class SimilarPlayersResponse(BaseModel):
    similar_players: List[SimilarPlayer]
    anomaly_score: float = Field(
        ..., description="Mean distance to the k nearest neighbors — higher means a more statistically unusual stat profile."
    )


def _ensure_loaded() -> None:
    if _bundle is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model artifact unavailable: {_load_error}",
        )


@app.get("/health")
def health():
    _ensure_loaded()
    return {"status": "ok"}


@app.get("/info")
def info():
    _ensure_loaded()
    return {
        "model": "NHL Similar Player Finder",
        **_bundle["metadata"],
    }


@app.post("/similar", response_model=SimilarPlayersResponse)
def similar(stat_line: SkaterStatLine):
    _ensure_loaded()

    row = pd.DataFrame(
        [
            {
                "games_played": stat_line.games_played,
                "goals": stat_line.goals,
                "assists": stat_line.assists,
                "points": stat_line.points,
                "hits": stat_line.hits,
                "penalty_minutes": stat_line.penalty_minutes,
                "shots_on_goal": stat_line.shots_on_goal,
                "x_goals": stat_line.x_goals,
                "takeaways": stat_line.takeaways,
                "giveaways": stat_line.giveaways,
                "faceoffs_won": stat_line.faceoffs_won,
                "on_ice_corsi_pct": stat_line.on_ice_corsi_pct,
            }
        ]
    )

    vector = _bundle["pipeline"].transform(row)

    k = min(stat_line.k, len(_bundle["players"]))
    distances, indices = _bundle["neighbors"].kneighbors(vector, n_neighbors=k)

    players = _bundle["players"]
    similar_players = [
        SimilarPlayer(
            name=players[i]["name"],
            team=players[i]["team"],
            position=players[i]["position"],
            games_played=players[i]["games_played"],
            distance=float(d),
        )
        for i, d in zip(indices[0], distances[0])
    ]

    return SimilarPlayersResponse(
        similar_players=similar_players,
        anomaly_score=float(sum(distances[0]) / len(distances[0])),
    )
