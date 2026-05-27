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

if [[ -z "${VERCEL_URL:-}" ]]; then
	echo "Deploying preview to discover URL..."
	vercel deploy --yes
	VERCEL_URL=$(vercel ls --yes 2>/dev/null | head -1 || true)
fi

if [[ -z "${VERCEL_URL:-}" ]]; then
	read -r -p "Paste your Vercel deployment host (e.g. office-chess-club.vercel.app): " VERCEL_URL
fi

export ORIGIN="https://${VERCEL_URL}"
export SLACK_REDIRECT_URI="${ORIGIN}/auth/callback/slack"

echo "Using ORIGIN=$ORIGIN"
echo "Using SLACK_REDIRECT_URI=$SLACK_REDIRECT_URI"
echo ""
echo "Add this Redirect URL in Slack: $SLACK_REDIRECT_URI"
echo ""

add_env() {
	local name="$1" value="$2"
	printf '%s' "$value" | vercel env add "$name" production --force >/dev/null 2>&1 || \
		printf '%s' "$value" | vercel env add "$name" production >/dev/null
}

add_env MONGODB_URI "$MONGODB_URI"
add_env SLACK_CLIENT_ID "$SLACK_CLIENT_ID"
add_env SLACK_CLIENT_SECRET "$SLACK_CLIENT_SECRET"
add_env SLACK_REDIRECT_URI "$SLACK_REDIRECT_URI"
add_env SESSION_SECRET "${SESSION_SECRET:-$(openssl rand -base64 32)}"
add_env ORIGIN "$ORIGIN"
add_env SLACK_WEBHOOK_URL "${SLACK_WEBHOOK_URL:-}"

echo "Deploying production..."
vercel deploy --prod --yes

echo ""
echo "Done. Update Slack redirect URL if you use a custom domain."
