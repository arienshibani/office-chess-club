# Office Chess Club ♟️

Who's _really_ the best at chess in your office?
--

Solution to let you self host your own web-based chess club. The code takes care of user signups, chess match submission (either manually or via HTTP), distributing ELO rating points and stockfish analysis of the submitted games. An admin panel lets you configure the solution however you want. The HTTP endpoint enables you to build an automatic bridge between a chess smartboard (DGT, Square Off, custom setups with webcam and RPi etc) and the hosted web-app, if you want to take the chess club to the next level.

<img width="1058" height="969" alt="image" src="https://github.com/user-attachments/assets/4ffa9f86-ef19-4a85-ab40-6aae4beb188a" />


## Features 🌟

- **Instant Elo ratings** 📈 Every logged game updates the leaderboard's internal ELO system automatically (K=32, starting at 1200).
- **Match history & stats** 📊 Per-player profiles, win/loss/draw records, and game review (Requires submission of PGN/FEN).
- **Username / Password Auth** 🔒 Indiviudal accounts created and managed directly in your MongoDB. passwords are scrypt-hashed.
- **API submission** 📡 Automate match logging with your own tools and result submission via secured HTTP POST requests.
- **Optional match approval** 🧑‍⚖️ Turn off the honor system if you want an admin to approve results first.
- **Optional Slack alerts** 🔔  Ping your own `#chess` channel when matches are logged, just setup a slack app have the admin paste in the webhook URL.

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

## Submitting Chess Games

There's two ways to submit matches:

1. Manually by any user via the "Submit Match" button on the top of the navigation bar. This is useful for quick matches or when you don't have a programmatic way to submit matches.

<img width="531" height="515" alt="image" src="https://github.com/user-attachments/assets/84232911-3fe1-48dc-845e-bf8738ed9b3e" />

2. Via HTTP POST request to the `/api/matches` endpoint. This is useful for programs, third-party services, smart chessboards or jank web-cam + raspberri pi setups. If you are using the HTTP submission feature, you will need to generate an API key in the admin panel, and use it to submit matches to the `/api/matches` endpoint.

### Example HTTP POST request

```bash
curl -X POST https://your-app.vercel.app/api/matches \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"whitePlayerId": "PLAYER_ID", "blackPlayerId": "PLAYER_ID", "result": "white", "notation": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"}'
```

### PGN Notation and Stockfish Analysis

If you submit a PGN notation, the match will be analyzed by Stockfish. The app uses the latest version of Stockfish (17.1) compiled with the `popcnt` instruction set.

<img width="1073" height="927" alt="image" src="https://github.com/user-attachments/assets/6dddc9ec-3f89-4941-b5b3-d500730aeeac" />


## Local development

```bash
cp .env.example .env
# Fill in MONGODB_URI and SESSION_SECRET
npm install
npm run dev
```

Open [http://localhost:5173/login](http://localhost:5173/login).

**CLI deploy alternative:** if you use the Vercel CLI locally, `./scripts/deploy-vercel.sh` reads your `.env` and pushes env vars + deploys production.


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
│   └── ChessBoard.svelte    # Board driven by FEN (Lichess Cburnett SVG pieces)
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

Do what you like with this.


**Third-party assets:** Board pieces in `static/pieces/cburnett/` are the [Cburnett](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett) set (Colin M.L. Burnett), used by Lichess under [GPLv2+](https://www.gnu.org/licenses/gpl-2.0.html).
