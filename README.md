# Office Chess Club ♟️

Self-hosted chess tracking and rating website.

## Features ✨

- Username/password accounts (passwords stored as scrypt hashes in MongoDB).
- Optional Slack webhook notifications for matches.
- Elo rating system.
- Match logging and approval workflow.
- Match history and statistics.

## Architecture

```txt
  src/
  ├── hooks.server.js          # Session validation on every request
  ├── lib/
  │   ├── db.js                # MongoDB singleton + ensureIndexes()
  │   ├── elo.js               # computeElo() using elo-rank (K=32)
  │   ├── password.js          # scrypt hash + verify
  │   ├── session.js           # HMAC-signed session tokens
  │   ├── slack.js             # Outbound webhook notifications (optional)
  │   └── ChessBoard.svelte    # Unicode piece board driven by FEN prop
  └── routes/
      ├── login/               # Sign in + create account
      ├── logout/              # Clears session cookie
      └── (protected)/         # Auth-gated layout group
          ├── +page            # Dashboard: leaderboard + log match + activity feed
          ├── players/[id]/    # Profile: stats, rank, match history
          ├── matches/[id]/    # Chess review: PGN stepper or FEN static view
          └── admin/           # Honor system toggle + pending approval queue
```

## Local Setup

1. Copy `.env.example` → `.env` and fill in your values.
2. Point `MONGODB_URI` at your Atlas cluster.
3. Set `SESSION_SECRET` to a long random string (32+ characters).
4. Run `npm run dev`.
5. Open `/login`, create an account for each player.
6. Set your first admin by toggling `isAdmin: true` on that user in MongoDB Atlas.

Optional: add `SLACK_WEBHOOK_URL` for match notifications in Slack.

## Deploy to Vercel

1. `vercel login`
2. `./scripts/deploy-vercel.sh` (sets env vars and deploys production)
3. In MongoDB Atlas → **Network Access** → **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Create accounts at `https://YOUR-APP.vercel.app/login`.

Or import this repo at [vercel.com/new](https://vercel.com/new) and set `MONGODB_URI`, `MONGODB_DB_NAME`, and `SESSION_SECRET` in project settings.
