#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! vercel whoami &>/dev/null; then
	echo "Run: vercel login"
	exit 1
fi

if [[ ! -f .env ]]; then
	echo "Missing .env — copy from .env.example"
	exit 1
fi

# shellcheck disable=SC1091
source .env

add_env() {
	local name="$1" value="$2"
	printf '%s' "$value" | vercel env add "$name" production --force >/dev/null 2>&1 || \
		printf '%s' "$value" | vercel env add "$name" production >/dev/null
}

add_env MONGODB_URI "$MONGODB_URI"
add_env MONGODB_DB_NAME "${MONGODB_DB_NAME:-chess-club}"
add_env SESSION_SECRET "${SESSION_SECRET:-$(openssl rand -base64 32)}"
add_env SLACK_WEBHOOK_URL "${SLACK_WEBHOOK_URL:-}"

echo "Deploying production..."
vercel deploy --prod --yes

echo ""
echo "Done. Create accounts at /login on your production URL."
