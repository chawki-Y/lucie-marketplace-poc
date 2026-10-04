# Lucie Marketplace POC

Lucie Marketplace POC is a complete working proof of concept for an AI-assisted online marketplace. It demonstrates how **Lucie**, an AI shopping assistant, can live inside a marketplace UI, search real marketplace data, and return product recommendation cards directly inside chat.

This is intentionally not a production marketplace. There is no authentication, checkout, payment flow, seller dashboard, database, file upload, or deployment setup.

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

To also save those logs in PostgreSQL, add `DATABASE_URL` to `server/.env`:

```env
DATABASE_URL=postgres://postgres@localhost:5433/lucie_marketplace_poc
```

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
.\scripts\start-local-postgres.ps1
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

