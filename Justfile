# Office Chess Club — local development commands

# Install dependencies on the host (IDE linting, LSP, pnpm run check, etc.)
install:
	pnpm install

# First-time machine setup (pnpm on PATH, then install deps)
setup:
	#!/usr/bin/env bash
	set -euo pipefail
	if command -v pnpm >/dev/null 2>&1; then
		echo "pnpm $(pnpm --version) — $(command -v pnpm)"
	else
		if ! command -v corepack >/dev/null 2>&1; then
			echo "pnpm not found. Install Node 22+ or: brew install pnpm"
			exit 1
		fi
		if ! corepack enable 2>/dev/null; then
			echo "corepack enable failed (cannot write to Node's bin directory)."
			echo "Install pnpm directly instead: brew install pnpm"
			exit 1
		fi
	fi
	pnpm install

# Start MongoDB + the SvelteKit dev server (http://localhost:5173/login)
start:
	docker compose up --build
