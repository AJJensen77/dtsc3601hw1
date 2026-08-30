# DTSC 3601 HW2

A Streamlit dashboard exploring 2025-26 NHL skater stats, served from a
Supabase Postgres database and deployed on Modal. This extends the HW1
dashboard (same dataset) by moving the data off a local CSV and into a real
cloud database.

## Architecture

- **Supabase**: hosts the `skaters` table (Postgres).
- **`upload_data.py`**: one-time script that loads `skaters.csv` into Supabase.
- **`app.py`**: the Streamlit dashboard; queries Supabase at runtime via
  `common.py` (SQLAlchemy + `DATABASE_URL`).
- **`modal_app.py`**: packages `app.py` + `common.py` into a container and
  serves Streamlit on Modal as a public web endpoint.

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) and click **New project**.
2. Pick an organization, name it (e.g. `dtsc-3601-hw2`), set a database
   password (save it — you'll need it below), pick a region, and create it.
3. Once it's provisioned: **Project Settings → Database → Connection string**.
   Copy the **URI** under "Connection pooling" (the `...pooler.supabase.com`
   one, port `6543`) — this works from serverless environments like Modal.
   Replace `[YOUR-PASSWORD]` in it with the password from step 2.

## 2. Load the dataset into Supabase

```bash
cd dtsc-3601-hw2
uv sync
cp .env.example .env
# edit .env and paste your Supabase connection string as DATABASE_URL
uv run python upload_data.py
```

You should see `Uploaded <N> rows to 'skaters'.` Check **Table Editor** in
the Supabase dashboard to confirm the `skaters` table exists.

## 3. Run the dashboard locally

```bash
uv run streamlit run app.py
```

This reads `DATABASE_URL` from `.env` and queries Supabase directly — no
local CSV is used at runtime.

## 4. Set up Modal

1. Sign in / create an account at [modal.com](https://modal.com).
2. Authenticate this machine (opens a browser to link the CLI to your account):

   ```bash
   uv run modal token new
   ```

3. Store the Supabase connection string as a Modal secret (Modal encrypts
   this — it's not written into the deployed image or committed to git):

   ```bash
   uv run modal secret create supabase-db-url DATABASE_URL="<your connection string>"
   ```

## 5. Deploy

```bash
uv run modal deploy modal_app.py
```

Modal prints a public URL (`https://<workspace>--dtsc-3601-hw2-run.modal.run`)
once the deploy finishes — that's the link to submit.

Notes:
- The app scales to zero when idle, so the first load after a period of
  inactivity takes a few extra seconds while Modal starts a container.
- Re-running `upload_data.py` replaces the table, so it's safe to re-run
  after editing the dataset; re-running `modal deploy` picks up any code
  changes to `app.py` / `common.py`.
