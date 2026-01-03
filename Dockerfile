# ================================
# Base Stage
# ================================
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ================================
# Dependencies Stage
# ================================
FROM base AS deps

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts && npm cache clean --force

# ================================
# Builder Stage
# ================================
FROM base AS builder

ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate && npm run build

# ================================
# Production Stage
# ================================
FROM base AS production

ENV NODE_ENV=production

RUN apk add --no-cache wget && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]

