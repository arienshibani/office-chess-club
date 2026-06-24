# Development image for Office Chess Club (SvelteKit + Vite).
# Used by compose.yml — run the full stack with: just start
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

ENTRYPOINT ["bash", "docker/app-entrypoint.sh"]
