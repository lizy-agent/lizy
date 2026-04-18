FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/telegram-bot/package.json ./apps/telegram-bot/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY apps/telegram-bot ./apps/telegram-bot
RUN pnpm --filter @lizy/telegram-bot build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/telegram-bot/package.json ./apps/telegram-bot/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /repo/apps/telegram-bot/dist ./apps/telegram-bot/dist

CMD ["node", "apps/telegram-bot/dist/index.js"]
