# Lucie Marketplace POC

Lucie Marketplace POC is a complete working proof of concept for an AI-assisted online marketplace. It demonstrates how **Lucie**, an AI shopping assistant, can live inside a marketplace UI, search real marketplace data, and return product recommendation cards directly inside chat.

This is intentionally not a production marketplace. There is no authentication, checkout, payment flow, seller dashboard, database, file upload, or deployment setup.

## Agent Sync Log

This repo is worked on by multiple AI agents from separate local clones. Convention for staying in sync:

1. `git pull` before starting a session.
2. Make your changes.
3. Add a new entry at the **top** of this log (newest first) with the date, agent, what changed, and what's next.
4. Commit and `git push` to `main`.

Keep entries short — a few bullet points, not a full diff. The next agent should be able to read this log alone and know what state the repo is in.

### Branching

Two agents work on this repo at once, so each gets its own branch to avoid stepping on the other's uncommitted work:

- `main` — stable, integration branch. Both agents merge into this when a change is verified working.
- `agent/claude` — Claude's working branch.
- `agent/openai` — the OpenAI-based agent's working branch.

Pull `main` into your branch before starting a session, do your work on your own branch, then merge (or PR) back into `main` once it's verified — don't push work-in-progress straight to `main`.

### 2026-10-17 — Claude (Claude Code)
- Switched the shared database from local-only Postgres to a **Neon** Postgres instance, so every machine/agent pulling this repo can point at the same data instead of each running its own isolated local DB.
- Used Neon's "Claimable" flow (`neon claim create`) to provision a real project with no account needed up front — Project ID `round-poetry-33509274`, region `aws-us-east-2`, unclaimed, expires `2026-10-20T09:19:11Z`. **Needs to be claimed into Chawki's Neon account before then** or the data is lost — see the new "Shared Neon Postgres" README section.
- Applied `db/lucie_usage_logs.sql` + `db/seed_usage_logs.sql` to it and verified end-to-end with a live `/api/lucie/chat` request — row landed correctly.
- Updated `server/services/db.js` to set `ssl: { rejectUnauthorized: true }` explicitly for non-localhost connections (fixes a `pg` deprecation warning from relying on `sslmode=require` in the URL, and is the standard way to connect `node-postgres` to Neon).
- Added `server/.env.neon`, `server/.neon` to `.gitignore` (written by the Neon CLI; contain credentials).
- Set up the two-agent branching convention (`agent/claude`, `agent/openai`, both pushed) and this session now works from `agent/claude` instead of `main`.
- Ran `npx neon skills -y`, which added `.claude/skills/neon*` + `skills-lock.json` — Neon's own Claude Code skill docs, committed since they're just reference material (no secrets).
- Local Postgres setup (`server/.pg-local`, pgAdmin) still works and is documented as a fallback, but is no longer the primary path.
- Next: Chawki needs to claim the Neon project (`neon claim accept`) before it expires. The other agent should pull `server/.env.example`'s new shape and get the real connection strings from Chawki directly (never from git).

### 2026-10-14 — Claude (Claude Code) [2]
- Got a working pgAdmin4 to browse the local DB visually. The system pgAdmin4 install was also broken (missing its entire `pgadmin` Python source package — same partial-install pattern as the missing Postgres CLI tools below). Rather than touch the system install, `pip install --target`'d the standalone `pgadmin4` package into `server/.pgadmin-local/site-packages` using the broken install's own bundled Python purely as a runtime.
- Had to work around the bundled Python resolving `psycopg` from the system's (also broken) site-packages instead of the freshly installed one — fixed with a small launcher (`server/.pgadmin-local/launch.py`) that inserts the isolated path first in `sys.path`.
- Registered the Lucie Postgres connection (`localhost:5433`, trust auth, db `lucie_marketplace_poc`) into pgAdmin's own config via its `setup.py load-servers` command — confirmed the row landed correctly in pgAdmin's SQLite config.
- Added `npm run pgadmin:start` in `server/package.json`. Run it, then open http://127.0.0.1:5050 — look for "Lucie Marketplace POC" in the server tree, no password needed (trust auth).
- Note: this is optional. The DB and usage logging already work and were verified via plain `psql` before this — pgAdmin is just a nicer way to look at the same data.
- Next: open for the next task/direction from Chawki.

### 2026-10-14 — Claude (Claude Code)
- Got Postgres usage logging actually working end-to-end. The system PostgreSQL 18 install here was missing `initdb.exe`/`pg_ctl.exe`/`createdb.exe` and Docker Desktop wouldn't start headlessly, so instead of touching the system install, downloaded the official EDB portable Windows binaries and set up a project-local cluster at `server/.pg-local` + `server/.pgdata` (port 5433, trust auth, no system changes, no Windows service).
- Applied `db/lucie_usage_logs.sql` schema and `db/seed_usage_logs.sql`, then verified with a live `/api/lucie/chat` request — confirmed a real row landed in `lucie_usage_logs` with correct tokens/cost, no more "database write failed" errors.
- Added `npm run db:local:start` / `db:local:stop` in `server/package.json` for this specific setup; see new "Local Postgres without a system install" README section above.
- Also fixed the OpenAI key not reloading: `node --watch` doesn't watch `.env`, so editing it alone doesn't apply — needs a restart (`touch server.js`) to re-run `dotenv.config()`.
- Next: open for the next task/direction from Chawki.

### 2026-10-13 — Claude (Claude Code)
- Cloned the repo and reviewed the full codebase: client (React/Vite) and server (Express, OpenAI Responses API, `searchListings`/`getListingDetails` tools, local JSON data, optional Postgres usage logging).
- No functional code changes in this entry — this was a review pass plus setting up this sync log.
- Next: open for the next task/direction from Chawki.

## Architecture

```text
React + Vite frontend
        |
        v
Express backend
        |
        v
OpenAI Responses API with function calling
        |
        v
Local JSON marketplace data
```

The browser never calls OpenAI directly. Lucie requests go from React to Express, and Express is the only layer that reads `process.env.OPENAI_API_KEY`.

## Tech Stack

Frontend:

- React
- Vite
- JavaScript
- CSS

Backend:

- Node.js
- Express
- Official OpenAI Node.js SDK
- Local JSON data in `server/data/listings.json`

## OpenAI Integration

Lucie uses OpenAI tool/function calling through the Responses API. The model can call backend tools instead of receiving the full marketplace dataset in every request.

Implemented tools:

- `searchListings`: searches title, description, category, tags, price, condition, and location
- `getListingDetails`: fetches a single listing by ID

The selected model is configured in:

```text
server/services/aiConfig.js
```

By default this POC uses:

```text
gpt-5.6
```

You can change it in `server/services/aiConfig.js` or set `OPENAI_MODEL` in `server/.env`.

## Usage Cost Logging

After every successful Lucie request, the backend prints token usage and an estimated request cost:

```text
Lucie request usage: 1200 input tokens, 300 output tokens, estimated cost ~$0.0108
```

To also save those logs in PostgreSQL, add `DATABASE_URL` to `server/.env`.

### Shared Neon Postgres (primary setup)

Both agents and every machine that pulls this repo point at the **same** Neon Postgres instance, so usage logs stay in one place no matter where the app runs from.

```env
DATABASE_URL="postgresql://<user>:<password>@<host>-pooler.<region>.aws.neon.tech/neondb"
DATABASE_URL_UNPOOLED="postgresql://<user>:<password>@<host>.<region>.aws.neon.tech/neondb"
```

- Use the **pooled** URL (`-pooler` host) for `DATABASE_URL` — that's what the app connects with at runtime.
- Use the **unpooled/direct** URL for one-off schema work (`psql -f server/db/lucie_usage_logs.sql`, etc.) — Neon's own guidance is to avoid running migrations over the pooled connection.
- `server/.env` is gitignored, so these values are **not** in git. Ask Chawki for the real connection strings and paste them into your own `server/.env` on each machine — `.env.example` has the placeholder shape.
- `server/services/db.js` sets `ssl: { rejectUnauthorized: true }` automatically for any non-localhost `DATABASE_URL`, so Neon's required TLS just works — no extra config needed.

This project's current Neon database was provisioned via [Claimable Neon](https://claimable.neon.tech) (no account needed to create it) and should be **claimed** into Chawki's own Neon account before it expires — ask him about `neon claim accept` if that hasn't happened yet.

### Alternative: fully local Postgres (no cloud, single machine only)

Useful for offline work, but each machine running this way has its **own** separate data — it won't be shared with the other agent or other machines. The system-wide PostgreSQL 18 install on this machine was missing `initdb.exe`/`pg_ctl.exe`/`createdb.exe` (client-tools-only install), so a project-local, portable Postgres lives at `server/.pg-local/pgsql` (official EDB binaries, gitignored) with its own cluster at `server/.pgdata` on port 5433, trust auth.

```bash
cd server
npm run db:local:start   # start it
npm run db:local:stop    # stop it
```

Then set `DATABASE_URL=postgres://postgres@localhost:5433/lucie_marketplace_poc` in `server/.env` instead of the Neon URL.

#### Browsing a local DB with pgAdmin4

The system pgAdmin4 install on this machine was also broken (missing its `pgadmin` Python source package). A project-local pgAdmin4 lives at `server/.pgadmin-local` (pip-installed, isolated, gitignored).

```bash
cd server
npm run pgadmin:start
```

Then open http://127.0.0.1:5050 — no login needed (desktop mode). This is entirely optional: `lucie_usage_logs` can also be queried directly with `./.pg-local/pgsql/bin/psql.exe` (local) or any `psql`/Neon connection string (shared).

If a machine has a working full PostgreSQL 18 install instead, this POC includes an automatic setup script:

```powershell
cd server
npm run db:setup
```

That command:

- creates `server/.pgdata` if needed
- starts a local Postgres server on port `5433`
- creates the `lucie_marketplace_poc` database
- creates the `lucie_usage_logs` table
- seeds test usage-log rows
- writes `DATABASE_URL=postgres://postgres@localhost:5433/lucie_marketplace_poc` into `server/.env`

The backend automatically creates this table on first insert:

```text
lucie_usage_logs
```

The SQL schema is also available at:

```text
server/db/lucie_usage_logs.sql
```

For this local Windows POC, a separate local Postgres cluster can run from:

```text
server/.pgdata
```

Start it with:

```powershell
cd server
npm run db:start
```

To inspect the seeded logs manually:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5433 -U postgres -d lucie_marketplace_poc -c "SELECT * FROM lucie_usage_logs ORDER BY id DESC;"
```

Cost estimates use these defaults, which can be changed in `server/.env`:

```env
OPENAI_INPUT_RATE_PER_MILLION=4
OPENAI_OUTPUT_RATE_PER_MILLION=20
```

## API Key Setup

Create a file at:

```text
server/.env
```

Add your API key:

```text
OPENAI_API_KEY=MY_ACTUAL_KEY
```

Optional model override:

```text
OPENAI_MODEL=gpt-5.6
```

Do not put the API key in the frontend. Do not create `VITE_OPENAI_API_KEY`.

If `server/.env` is missing, the marketplace still runs and products still load. Lucie will show a friendly message saying she is not connected to the AI service yet.

## Install and Run

Backend, from the project root:

```bash
cd server
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:3001
```

Frontend, from the project root in a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## API Endpoints

```text
GET  /api/listings
GET  /api/listings/:id
POST /api/lucie/chat
```

Example Lucie request:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Find me an iPhone under $500."
    }
  ]
}
```

Example response:

```json
{
  "message": "I found a few phones that fit your budget.",
  "products": []
}
```

When Lucie uses marketplace tools, `products` contains real listing objects from `server/data/listings.json`.

## Try Lucie

Good demo prompts:

- "Find me an iPhone under $500."
- "I have $700 and want something for gaming."
- "Show me laptops under $600."
- "I need a cheap phone with a good camera."
- "Do you have any guitars?"

## GitHub Repository Usage

This repository is intended to be pushed to GitHub as:

```text
lucie-marketplace-poc
```

Suggested commands after creating the GitHub repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/lucie-marketplace-poc.git
git push -u origin main
```

The root `README.md` is ready for GitHub and will appear as the repository landing documentation.

## Security Notes

- `.env` and `server/.env` are ignored by Git.
- API keys are only read server-side through `process.env.OPENAI_API_KEY`.
- The frontend only calls local marketplace API endpoints.
- No secrets should be committed or pushed.

## POC Limitations

- Listings are fictional and stored in a local JSON file.
- Images are external placeholder marketplace-style photos.
- Sell, Login, and product detail flows are visual only or minimal.
- There is no real buyer/seller workflow.
- Lucie has no memory beyond the chat messages sent from the current browser session.

