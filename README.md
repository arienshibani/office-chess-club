# Office Chess Club ♟️

**Run your own private chess club at work.** Track over-the-board chess games between your coworkers. Log games, have you own internal Elo system, and settle the eternal "who's actually best?" debate. Self-hosted. Free to run. Takes about 10 minutes to set up.

## Features 🌟

- **Instant Elo ratings** 📈 Every logged game updates the leaderboard automatically (K=32, starting at 1200).
- **Match history & stats** 📊 Per-player profiles, win/loss/draw records, and game review (PGN/FEN).
- **Username/password auth** 🔒 Indiviudal accounts created and managed directly in your MongoDB. passwords are scrypt-hashed.
- **API submission** 📡 Automate match logging with your own tools and result submission via HTTP POST request.
- **Optional match approval** 🧑‍⚖️ Turn off the honor system if you want an admin to approve results first.
- **Optional Slack alerts** 🔔  Ping your `#chess` channel when matches are logged.

## Quick start 🏁

Three steps. No code changes required.

### 1. Fork or clone the repository 🔗

```bash
git clone https://github.com/YOUR_USERNAME/office-chess-club.git
cd office-chess-club
```

Or click **Fork** on GitHub, then clone your fork.

### 2. Create a free MongoDB Atlas database 📊

Atlas has a forever-free **M0** tier - more than enough for an office club.

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create an account.
2. Create a **free shared cluster** (M0). Any cloud provider/region is fine.
3. **Database Access** → **Add New Database User**
   - Choose **Password** authentication.
   - Save the username and password somewhere safe.
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Required so Vercel’s serverless functions can reach your database.
5. **Database** → **Connect** → **Drivers** → copy the connection string.

It looks like:

```txt
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

> All you need is your connection string. Indexes and default settings are created automatically on first request - you don’t need to create collections or run migrations.

### 3. Deploy to Vercel 🚀

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** your GitHub repo.
2. Before deploying, open **Environment Variables** and add the following variables:

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `MONGODB_URI` | Yes | Your Atlas connection string from step 2 |
| `SESSION_SECRET` | Yes | Any random string, 32+ characters ([generate one](https://generate-secret.vercel.app/32)) |

3. Click **Deploy**. Vercel detects SvelteKit automatically.

When the deploy finishes, open:

```txt
https://YOUR-APP.vercel.app/login
```

**That’s it.** Create an account, invite coworkers to do the same, and start logging games.

---

## After deploy

### Register players

Everyone creates their own account at `/login`. There’s no invite flow - share the URL internally (Slack, email, whatever).

### Make someone an admin (optional)

Admins can approve pending matches, toggle honor system, configure Slack notifications, enable HTTP match submission (with an API key generated in the admin panel), and manage the club. To promote your first admin:

1. Create your account via `/login`.
2. In MongoDB Atlas → **Browse Collections** → `chess-club` → `players`.
3. Find your user document and set `isAdmin` to `true`.

You only need this if you want the admin panel. With honor system on (the default), games count immediately without approval.

### Customize your club name (optional)

In Atlas, edit the `config` collection → document `_id: "global_settings"` → change `clubName` from `"Office"` to whatever you like (e.g. `"Acme Corp"`). It shows on the login page.

---

## Local development

```bash
cp .env.example .env
# Fill in MONGODB_URI and SESSION_SECRET
npm install
npm run dev
```

Open [http://localhost:5173/login](http://localhost:5173/login).

**CLI deploy alternative:** if you use the Vercel CLI locally, `./scripts/deploy-vercel.sh` reads your `.env` and pushes env vars + deploys production.

---

## Architecture 📦

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

**Stack:** SvelteKit · MongoDB · Vercel

---

## License

Do whatever the hell you want.