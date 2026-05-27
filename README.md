# Office Chess Club ♟️

Self-hosted chess tracking and rating website.

## Features ✨

- Slack-powered authentication and notifications.
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
  │   ├── session.js           # HMAC-signed session tokens
  │   ├── slack.js             # Outbound webhook notifications
  │   └── ChessBoard.svelte    # Unicode piece board driven by FEN prop
  └── routes/
      ├── login/               # Public Slack OAuth entry point
      ├── auth/slack/          # OAuth initiator (CSRF state cookie)
      ├── auth/callback/slack/ # Code exchange → player upsert → session
      ├── logout/              # Clears session cookie
      └── (protected)/         # Auth-gated layout group
          ├── +page            # Dashboard: leaderboard + log match + activity feed
          ├── players/[id]/    # Profile: stats, rank, match history
          ├── matches/[id]/    # Chess review: PGN stepper or FEN static view
          └── admin/           # Honor system toggle + pending approval queue
```

## Local Setup

To run locally.

1. Copy `.env.example` → `.env` and fill in your real values. 
2. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps) and configure Sign in with Slack:
   - **OAuth & Permissions → Redirect URLs:** `http://localhost:5173/auth/callback/slack` (add your production URL when you deploy).
   - **OAuth & Permissions → User Token Scopes:** `openid`, `profile`, `email` (Sign in with Slack only).
   - **OAuth & Permissions → Bot Token Scopes:** leave **empty** — bot scopes trigger a second “install app” step that breaks localhost + PKCE.
   - **App Home → Bot User:** turn **off** if you only need sign-in (no bot).
   - **Basic Information:** copy **Client ID** and **Client Secret** into `.env` as `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`.
   - Optional: **Incoming Webhooks** for match notifications → `SLACK_WEBHOOK_URL`.
   - **PKCE:** Required for this app (one-way in Slack). Uses Sign in with Slack at `/openid/connect/authorize` with `scope=openid profile email`, exchanged via `openid.connect.token` with `code_verifier`. The verifier is carried in signed `state` so it survives the Slack redirect. Keep **zero** bot scopes.
   - Remove any non-`http(s)://` redirect URLs (e.g. `myapp://`) from the app.
3. Point `MONGODB_URI` at your Atlas cluster. (You can create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
4. Run `npm run dev`.
5. Set your first admin by toggling `isAdmin: true` directly in MongoDB Atlas. (You can find the MongoDB Atlas connection string in the "Connect" section of your cluster.)

## Deploy to Vercel

1. `vercel login`
2. `./scripts/deploy-vercel.sh` (sets env vars and deploys production)
3. In Slack → **OAuth & Permissions**, add redirect URL:  
   `https://YOUR-APP.vercel.app/auth/callback/slack`
4. In MongoDB Atlas → **Network Access** → **Allow Access from Anywhere** (`0.0.0.0/0`).
5. On Vercel set **`ORIGIN`** to your production URL (e.g. `https://office-chess-club.vercel.app`). The OAuth callback is derived as `{ORIGIN}/auth/callback/slack` — add that exact URL in Slack.
6. After env changes, **redeploy** production (env is read at runtime, not only at build).

Or import this repo at [vercel.com/new](https://vercel.com/new) and set the same env vars in the project settings.
