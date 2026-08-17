# syntax=docker/dockerfile:1.7
FROM node:24-slim AS builder

RUN npm install --global pnpm@11.22.0
WORKDIR /workspace
ENV SKIP_ENV_VALIDATION=1

COPY . .
RUN --mount=type=cache,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store && \
    pnpm --filter @crossval/server build && \
    pnpm --store-dir /pnpm-store --filter @crossval/server \
      deploy --prod --legacy /opt/server

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /opt/server/ ./

USER node
EXPOSE 8000

CMD ["node", "dist/server.mjs"]
