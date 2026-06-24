<p align="center">
  <a href="https://github.com/arienshibani/office-chess-club" rel="noopener">
    <img width="120" height="120" src="static/favicon.svg" alt="Office Chess Club logo">
  </a>
</p>

<h3 align="center">Office Chess Club ♟️</h3>

<div align="center">

[![CI](https://github.com/arienshibani/office-chess-club/actions/workflows/ci.yml/badge.svg)](https://github.com/arienshibani/office-chess-club/actions/workflows/ci.yml)
[![Release](https://github.com/arienshibani/office-chess-club/actions/workflows/release.yml/badge.svg)](https://github.com/arienshibani/office-chess-club/actions/workflows/release.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node](https://img.shields.io/badge/node-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.8+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)

</div>

---

<p align="center">
  Self-hosted web app for running a private chess club. Elo ratings, match history, game review, and Slack / Discord alerts
</p>

<img width="1411" height="810" alt="image" src="https://github.com/user-attachments/assets/1da1294a-b9c7-4db4-aae4-99bff5a7675a" />


## 📝 Table of Contents
- [About](#about)
- [Getting Started](#getting_started)
- [Running the tests](#tests)
- [Usage](#usage)
- [Deployment](#deployment)
- [Built Using](#built_using)
- [Third Party Integrations & APIs](#third-party-integrations)

## 🎓 About <a name="about"></a>

Office Chess Club is a lightweight chess club management system you can host yourself. Players create accounts, log match results (manually or via HTTP API), and climb an automatically updated Elo leaderboard (K=32, starting at 1200). Admins can optionally require match approval, configure Slack or Discord webhooks for notifications, and issue API keys for automated result submission from smart chess boards, scripts, or other tools. Games submitted with PGN notation are analyzed in the browser with Stockfish for move-by-move review.

## 🏁 Getting Started <a name="getting_started"></a>

These instructions get a development copy running on your machine. See [deployment](#deployment) for production hosting.

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 11.8+ (via Corepack or `brew install pnpm`)
- [Docker](https://www.docker.com/) (for local MongoDB and `just start`, or integration tests)
- [just](https://github.com/casey/just) (optional, recommended for local commands)

### Installing

**1. Clone the repository**

```bash
git clone https://github.com/arienshibani/office-chess-club.git
cd office-chess-club
```

**2. Setup the `env` file**

```bash
cp .env.example .env
```

Set at minimum:

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes | Atlas connection string, or `mongodb://127.0.0.1:27017/?replicaSet=rs0` when using Docker Compose |
| `SESSION_SECRET` | Yes | Random string, 32+ characters ([generate one](https://generate-secret.vercel.app/32)) |
| `ORIGIN` | Yes (prod) | Public site URL — used in Slack/Discord notification links |

**3. Install dependencies**

```bash
just setup        # first time: Corepack + pnpm install
# or: just install
```

**4. Start the app**

Option A — Docker (MongoDB + dev server, seeds sample data on first run):

```bash
just start
```

Option B — host-only dev server (bring your own MongoDB):

```bash
pnpm run dev
```

Open [http://localhost:5173/login](http://localhost:5173/login), create an account, and log a match from the dashboard.

> New dependency versions must be at least 24 hours old (`minimumReleaseAge` in `pnpm-workspace.yaml`).

## 🔧 Running the tests <a name="tests"></a>

CI runs on every pull request: lint (Biome), typecheck (`svelte-check`), production build, unit tests, and integration tests against a MongoDB replica set.

### Unit tests

Fast tests for pure logic (Elo, PGN parsing, session helpers, etc.). No database required.

```bash
pnpm test:unit
# or: just test-unit
```

### Integration tests

API and database tests against a real MongoDB replica set. `just test-integration` starts `compose.test.yml` automatically if Mongo is not already running.

```bash
pnpm test:integration
# or: just test-integration
```

### All tests

```bash
pnpm test
# or: just test
```

### Lint and typecheck

```bash
pnpm lint      # Biome
pnpm check     # svelte-check
pnpm build     # production build smoke test
```

## 🎈 Usage <a name="usage"></a>

### Register players

Share your `/login` URL internally. Everyone creates their own account via a basic username / password authentication.

### Admin setup (optional)

Promote your first admin in MongoDB (`chess-club` → `players` → set `isAdmin: true`), or set `AUTO_PROMOTE_FIRST_USER=true` in the environment so the first registrant becomes admin automatically.

From the admin panel you can:

- Toggle honor system (instant vs. approved matches)
- Configure Slack and Discord webhook URLs
- Generate API keys for automatic HTTP match submission
- Browse the OpenAPI docs (Swagger UI)

### Submit game results

**Manual:** use **Submit Match** button in the nav bar. This is useful for quick matches or when you don't have a programmatic way to submit matches. You can update a submitted game later on with a PGN string if you want to perform detailed analysis.

**HTTP API:**

```bash
curl -X POST https://your-app.example.com/api/matches \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"whitePlayerId": "PLAYER_ID", "blackPlayerId": "PLAYER_ID", "result": "white", "notation": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"}'
```

PGN submissions are analyzed with Stockfish 17.1 (WASM, `popcnt`) in the match review UI.

## 🚀 Deployment <a name="deployment"></a>

The following section describes how you can setup a production instance of the app and get started with your own chess club for free.

1. Fork or import the repo at [vercel.com/new](https://vercel.com/new).
2. Add `MONGODB_URI` and `SESSION_SECRET` as environment variables.
3. Deploy - SvelteKit is detected automatically.

Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) free M0 tier. Allow network access from anywhere (`0.0.0.0/0`) so Vercel serverless functions can connect. Indexes and defaults are created on first request.

**CLI alternative:** `./scripts/deploy-vercel.sh` reads `.env` and deploys production via the Vercel CLI.

### Docker (self-hosted)

Production images are published to GHCR on merges to `main`:

```bash
docker pull ghcr.io/arienshibani/office-chess-club:latest
```

Run with `MONGODB_URI`, `SESSION_SECRET`, `ORIGIN`, and optional `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL`. See `Dockerfile.prod` and `compose.yml` for reference.

## ⛏️ Built Using <a name="built_using"></a>

- [SvelteKit](https://kit.svelte.dev/) — Full-stack web framework
- [Svelte 5](https://svelte.dev/) — UI components
- [Vite](https://vitejs.dev/) — Build tooling and dev server
- [MongoDB](https://www.mongodb.com/) — Database (Atlas or self-hosted replica set)
- [chess.js](https://github.com/jhlywa/chess.js) — Chess logic and PGN parsing
- [Stockfish](https://stockfishchess.org/) — In-browser engine analysis (WASM)
- [Vitest](https://vitest.dev/) — Unit and integration tests
- [Biome](https://biomejs.dev/) — Linting and formatting
- [Vercel](https://vercel.com/) — Default production adapter

## 🔌 Third Party Integrations & APIs <a name="third-party-integrations"></a>

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — Managed database hosting
- [Vercel](https://vercel.com/docs) — Serverless deployment
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks) — Match notifications
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook) — Match notifications
- [OpenAPI / Swagger UI](https://swagger.io/) — HTTP API docs at `/api/openapi` (admin panel)
- [Lichess Cburnett pieces](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett) — Board SVG assets (GPLv2+)

---

## License

[AGPL-3.0-or-later](LICENSE) — do what you like, share changes under the same license.
