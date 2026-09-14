"""Custom transformer used by the NHL Similar Player Finder pipeline.

Kept in its own module (rather than build.py) so both the training script
and serve.py can import it — required for joblib to unpickle the fitted
pipeline.
"""

from __future__ import annotations

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin


class RateStatsTransformer(BaseEstimator, TransformerMixin):
    """Converts counting stats (goals, hits, ...) to per-game rates.

    Counting stats scale with games played, which makes raw totals a poor
    basis for comparing players with very different sample sizes. This
    transformer divides each column in ``rate_columns`` by
    ``denominator_column`` (games played), then appends any
    ``passthrough_columns`` that are already rate-like (e.g. Corsi %)
    unchanged.
    """

    def __init__(self, rate_columns, denominator_column, passthrough_columns=None):
        self.rate_columns = rate_columns
        self.denominator_column = denominator_column
        self.passthrough_columns = passthrough_columns

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        passthrough_columns = self.passthrough_columns or []

        denom = X[self.denominator_column].to_numpy(dtype=float)
        denom = np.clip(denom, 1.0, None)

        rate_block = X[self.rate_columns].to_numpy(dtype=float) / denom[:, None]

        if passthrough_columns:
            pass_block = X[passthrough_columns].to_numpy(dtype=float)
            return np.hstack([rate_block, pass_block])
        return rate_block

    def get_feature_names_out(self, input_features=None):
        names = [f"{col}_per_gp" for col in self.rate_columns]
        names += list(self.passthrough_columns or [])
        return np.array(names)
