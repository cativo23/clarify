/**
 * Rate Limiting Server Middleware
 * 
 * [SECURITY FIX M1] Applies default rate limiting to all API endpoints
 * with ability to override per-endpoint for custom limits.
 */

import { applyRateLimit, RateLimitPresets, type RateLimitConfig } from '../utils/rate-limit'

// Rate limit configuration per route pattern
const routeLimits: Record<string, RateLimitConfig> = {
  // High-cost operations
  '/api/analyze': RateLimitPresets.analyze,
  '/api/upload': RateLimitPresets.upload,
  '/api/stripe': RateLimitPresets.payment,

  // Moderate cost
  '/api/check-tokens': RateLimitPresets.standard,

  // Admin endpoints (stricter)
  '/api/admin': RateLimitPresets.read,
}

// Default limit for unmatched routes
const DEFAULT_LIMIT: RateLimitConfig = RateLimitPresets.read

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    const url = event.path || ''

    // Skip rate limiting for health checks and static assets
    if (url.startsWith('/api/health') ||
      url.startsWith('/_nuxt') ||
      url.startsWith('/favicon')) {
      return
    }

    // Find matching rate limit config
    let config: RateLimitConfig = DEFAULT_LIMIT

    for (const [pattern, limitConfig] of Object.entries(routeLimits)) {
      if (url.startsWith(pattern)) {
        config = limitConfig
        break
      }
    }

    // Apply rate limiting
    try {
      await applyRateLimit(event, config)
    } catch (error: any) {
      // Re-throw 429 errors, log others
      if (error.statusCode === 429) {
        console.warn('[Rate Limit] Too many requests:', {
          path: url,
          retryAfter: error.data?.retryAfter
        })
        throw error
      }
      console.error('[Rate Limit] Error:', error)
      throw error
    }
  })
})
