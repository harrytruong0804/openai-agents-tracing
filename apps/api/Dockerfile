FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY turbo.json ./
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
RUN pnpm --filter @openai-agents-tracing/api build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

RUN pnpm install --prod

EXPOSE 3001

CMD ["node", "dist/index.js"]

