"""Deploy the Streamlit dashboard on Modal.

Usage:
    uv run modal deploy modal_app.py

Requires a Modal secret named "supabase-db-url" with a DATABASE_URL key
holding your Supabase Postgres connection string:

    uv run modal secret create supabase-db-url DATABASE_URL=postgresql://...
"""

import shlex
import subprocess
from pathlib import Path

import modal

LOCAL_DIR = Path(__file__).parent

app = modal.App("dtsc-3601-hw2")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "streamlit==1.62.0",
        "pandas==3.0.5",
        "numpy==2.5.2",
        "matplotlib==3.11.1",
        "sqlalchemy==2.0.52",
        "psycopg[binary]==3.3.4",
        "python-dotenv==1.2.3",
    )
    .add_local_file(LOCAL_DIR / "app.py", "/root/app.py")
    .add_local_file(LOCAL_DIR / "common.py", "/root/common.py")
)


@app.function(image=image, secrets=[modal.Secret.from_name("supabase-db-url")])
@modal.concurrent(max_inputs=100)
@modal.web_server(8000, startup_timeout=60)
def run():
    target = shlex.quote("/root/app.py")
    cmd = (
        f"streamlit run {target} --server.port 8000 --server.address 0.0.0.0 "
        "--server.headless true --server.enableCORS=false "
        "--server.enableXsrfProtection=false"
    )
    subprocess.Popen(cmd, shell=True)
