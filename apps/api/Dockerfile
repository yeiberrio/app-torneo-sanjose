FROM node:18-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter api

COPY apps/api apps/api
RUN cd apps/api && npx prisma generate
RUN pnpm --filter api exec nest build
# Compile seed to JS for production
RUN cd apps/api && npx tsc prisma/seed.ts --outDir dist/seed --module commonjs --target es2017 --esModuleInterop --resolveJsonModule --skipLibCheck

FROM node:18-alpine AS runner

RUN apk add --no-cache openssl libssl3 && npm install -g pnpm@9

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api
RUN npx prisma generate

EXPOSE 3001

# Start API first, run migrations and seed in background so healthcheck passes
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 && node dist/seed/seed.js 2>&1; node dist/src/main.js"]
