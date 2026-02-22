# Production Dockerfile for Clarify
# Multi-stage build with security best practices

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:24-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN npm run build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:24-alpine AS runner

# Install security updates
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Set production environment
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Copy built application from builder stage
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nuxtjs

# Expose production port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run the production server
CMD ["node", ".output/server/index.mjs"]
