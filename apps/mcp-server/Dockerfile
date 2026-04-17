FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install deps from repo root so workspace packages resolve
FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/mcp-server/package.json ./apps/mcp-server/
RUN pnpm install --frozen-lockfile

# Build @lizy/types then @lizy/mcp-server
FROM deps AS builder
COPY packages/types ./packages/types
COPY apps/mcp-server ./apps/mcp-server
RUN pnpm --filter @lizy/types build
RUN pnpm --filter @lizy/mcp-server build

# Production image — only runtime files
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/mcp-server/package.json ./apps/mcp-server/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /repo/packages/types/dist ./packages/types/dist
COPY --from=builder /repo/apps/mcp-server/dist ./apps/mcp-server/dist

EXPOSE 3001
CMD ["node", "apps/mcp-server/dist/index.js"]
