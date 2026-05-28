# Stage 1: Install dependencies
FROM node:20-alpine AS deps
# Install libc6-compat for some native node modules to compile/run correctly on alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency definition files
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Expose production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose Cloud Run specific variables
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Expose correct port
EXPOSE 8080

# Create nextjs group and user (rootless/non-root execution)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Ensure clean ephemeral next folder with proper ownership and caching configuration
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app

# Copy public assets and static files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Run application under non-root user account
USER nextjs

# Start the standalone Node server
CMD ["node", "server.js"]
