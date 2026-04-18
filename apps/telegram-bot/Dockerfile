FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM deps AS builder
COPY tsconfig.json ./
COPY src ./src
RUN npm exec tsc

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
CMD ["node", "dist/index.js"]
