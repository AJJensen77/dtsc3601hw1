"""Deploy the NHL Similar Player Finder FastAPI service on Modal.

Usage:
    uv run modal deploy modal_serve.py

Ships exactly three project files into the image: serve.py,
pipeline_def.py, and the fitted pipeline.joblib artifact. scikit-learn is
pinned to the exact version recorded in the artifact's metadata
(sklearn_version) so the unpickled estimators behave identically to how
they were fit.
"""

from pathlib import Path

import modal

LOCAL_DIR = Path(__file__).parent

app = modal.App("nhl-similar-player-finder")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "fastapi==0.141.1",
        "pydantic==2.13.5",
        "scikit-learn==1.9.1",  # must match metadata.sklearn_version in pipeline.joblib
        "pandas==3.0.5",
        "numpy==2.5.3",
        "joblib==1.6.0",
    )
    .add_local_file(LOCAL_DIR / "pipeline_def.py", "/root/pipeline_def.py")
    .add_local_file(LOCAL_DIR / "serve.py", "/root/serve.py")
    .add_local_file(LOCAL_DIR / "pipeline.joblib", "/root/pipeline.joblib")
)


@app.function(image=image)
@modal.asgi_app()
def web():
    import sys

    sys.path.insert(0, "/root")
    from serve import app as fastapi_app  # imported inside the function

    return fastapi_app
