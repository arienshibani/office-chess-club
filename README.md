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
   - **PKCE:** If enabled in Slack it is **one-way** (cannot be turned off without Slack support). This app always sends PKCE (`code_challenge` / `code_verifier`). Keep **zero** bot scopes so Slack does not run a second install OAuth step without PKCE. For stubborn localhost issues, use an HTTPS dev URL (e.g. ngrok) as `SLACK_REDIRECT_URI`.
   - Remove any non-`http(s)://` redirect URLs (e.g. `myapp://`) from the app.
3. Point `MONGODB_URI` at your Atlas cluster. (You can create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
4. Run `npm run dev`.
5. Set your first admin by toggling `isAdmin: true` directly in MongoDB Atlas. (You can find the MongoDB Atlas connection string in the "Connect" section of your cluster.)
