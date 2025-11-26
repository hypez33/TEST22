FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# libc6-compat ist oft nötig für Prozess-Kompatibilität
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Damit Prisma Client für das Docker-OS (linux-musl) generiert wird
RUN npx prisma generate

RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV HOSTNAME "0.0.0.0"
ENV PORT 3000

# --- WICHTIG: OpenSSL installieren ---
# Dies behebt den Fehler "Error loading shared library libssl.so.1.1"
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Next.js Standalone-Output kopieren
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]