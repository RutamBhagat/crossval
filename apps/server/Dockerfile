FROM node:22-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
WORKDIR /workspace

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter server build
RUN pnpm --filter server deploy --prod --legacy /release

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000

WORKDIR /app
COPY --from=build --chown=node:node /release/ ./

USER node
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "dist/server.mjs"]
