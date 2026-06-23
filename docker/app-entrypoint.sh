#!/usr/bin/env bash
set -euo pipefail

# Named node_modules volume can lag behind lockfile changes from image rebuilds.
pnpm install --frozen-lockfile

# Ensure generated Kit files match container deps (avoids stale/missing defines in SSR).
pnpm exec svelte-kit sync

# Drop stale Vite optimizer cache after dependency or bulk source changes.
rm -rf node_modules/.vite

exec pnpm run dev -- --host 0.0.0.0 --port 5173
