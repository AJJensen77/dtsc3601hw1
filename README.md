# DTSC 3601 HW4 — NHL Similar Player Finder

A scikit-learn pipeline, served over FastAPI and deployed on Modal, that
finds the most statistically similar NHL skaters to a given stat line and
scores how unusual that stat line is. The Vercel-deployed [HW3 dashboard](https://dtsc-3601-hw3.vercel.app)
calls this API live from its "Similar Player Finder" tab.

## What it does

Given a skater's per-season stat line (games played, goals, hits, Corsi %,
etc.), the API converts counting stats to per-game rates with a custom
`RateStatsTransformer`, scales them, and runs a k-nearest-neighbors search
over all 828 qualified 2025-26 NHL skaters (MoneyPuck data, min 5 games
played) to return the most comparable real players plus an anomaly score
(average distance to its nearest neighbors — higher means a more
statistically unusual profile). Custom transformer: `RateStatsTransformer`
in `pipeline_def.py`. scikit-learn version: **1.9.1** (pinned exactly in
both the artifact metadata and the Modal image).

## Files

- `pipeline_def.py` — the custom `RateStatsTransformer` (`BaseEstimator`,
  `TransformerMixin`).
- `build_pipeline.py` — fits the pipeline + nearest-neighbor index on
  `skaters.csv` and dumps `pipeline.joblib` (rebuild script).
- `pipeline.joblib` — the fitted artifact bundle (pipeline, neighbor
  index, transformed matrix, player records, metadata).
- `serve.py` — FastAPI app (`GET /health`, `GET /info`, `POST /similar`).
- `modal_serve.py` — Modal deployment wrapping `serve.py` in an ASGI app.
- `postman/NHL-Similar-Player-Finder.postman_collection.json` — Postman
  collection with assertions for health, info, a valid POST (200), and
  an invalid POST (422).

## Rebuild the artifact

```bash
uv sync
uv run python build_pipeline.py
```

## Run locally

```bash
uv run uvicorn serve:app --reload
# http://localhost:8000/docs
```

## Deploy to Modal

```bash
uv run modal deploy modal_serve.py
```

## Live URLs

- Modal API: https://ajjensen77--nhl-similar-player-finder-web.modal.run
- API docs: https://ajjensen77--nhl-similar-player-finder-web.modal.run/docs
- Vercel frontend using this API: https://dtsc-3601-hw3.vercel.app (Similar Player Finder tab)
