import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

TABLE_NAME = "skaters"


def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env and fill in your "
            "Supabase connection string (local/dev), or set it as a Modal secret "
            "named 'supabase-db-url' with key DATABASE_URL (deployment)."
        )
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    elif url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    return url


@lru_cache
def get_engine() -> Engine:
    return create_engine(get_database_url(), pool_pre_ping=True)
