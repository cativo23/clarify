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

# pdf-parse -> pdfjs-dist requires "@napi-rs/canvas" at runtime to polyfill
# DOMMatrix/ImageData/Path2D (see server/utils/pdf-parser.ts). Nitro's
# node-file-trace does not follow that try/catch-wrapped require() into
# node_modules, so the native binary is silently absent from .output even
# though it installs correctly in the deps stage. Copy only the musl-target
# binary this Alpine runner actually needs, placed where Node's module
# resolution finds it from pdfjs-dist's traced location
# (.output/server/node_modules/pdfjs-dist/...).
COPY --from=builder --chown=nuxtjs:nodejs /app/node_modules/@napi-rs/canvas ./.output/server/node_modules/@napi-rs/canvas
COPY --from=builder --chown=nuxtjs:nodejs /app/node_modules/@napi-rs/canvas-linux-x64-musl ./.output/server/node_modules/@napi-rs/canvas-linux-x64-musl

# Same node-file-trace gap as above, different file: pdfjs-dist dynamically
# resolves its worker script (legacy/build/pdf.worker.mjs) by path at
# runtime rather than a static import/require, so the tracer never follows
# it either. Found live in production (13-04 LAUNCH-01 verification): every
# PDF analysis failed with "Setting up fake worker failed: Cannot find
# module '.../pdfjs-dist/legacy/build/pdf.worker.mjs'". Rather than
# cherry-picking files one at a time as the tracer's gaps in this package
# keep surfacing, replace the whole traced (partial) pdfjs-dist directory
# with the real, complete package from the deps stage.
COPY --from=builder --chown=nuxtjs:nodejs /app/node_modules/pdfjs-dist ./.output/server/node_modules/pdfjs-dist

# Switch to non-root user
USER nuxtjs

# Expose production port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run the production server
CMD ["node", ".output/server/index.mjs"]
