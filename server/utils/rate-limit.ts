/**
 * Rate Limiting Utility
 *
 * [SECURITY FIX M1] Prevents DoS attacks and cost escalation
 * by limiting request frequency per user/IP.
 *
 * Uses Redis for distributed rate limiting (works across multiple instances).
 * Falls back to memory-based limiting if Redis unavailable.
 */

import { Redis } from "ioredis";

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message: string; // Error message when limit exceeded
  skipSuccessfulRequests?: boolean; // Only count non-2xx requests
  skipFailedRequests?: boolean; // Only count 2xx requests
}

/**
 * Predefined rate limit presets
 */
export const RateLimitPresets = {
  // Strict limits for expensive operations
  analyze: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 requests per minute
    message:
      "Too many analysis requests. Please wait a minute before trying again.",
  },

  // Moderate limits for uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    message:
      "Too many upload requests. Please wait a minute before trying again.",
  },

  // Standard limits for general API endpoints
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: "Too many requests. Please slow down.",
  },

  // Lenient limits for read-only endpoints
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: "Too many requests. Please slow down.",
  },

  // Very strict limits for auth endpoints (prevent brute force)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  },

  // Strict limits for payment endpoints
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 payment requests per minute
    message:
      "Too many payment requests. Please wait a minute before trying again.",
  },
} as const;

/**
 * Get Redis connection for rate limiting
 */
function getRedisClient(): Redis | null {
  try {
    const config = useRuntimeConfig();

    if (!config.redisHost) {
      return null;
    }

    const isProduction = process.env.NODE_ENV === "production";

    // [SECURITY FIX L6] Enforce authentication and TLS in production
    if (isProduction && !config.redisToken) {
      console.error(
        "[SECURITY] Redis authentication not configured in production",
      );
      throw new Error(
        "Redis authentication required in production environment",
      );
    }

    // [SECURITY FIX M3] Upstash Redis with authentication and TLS
    const redisConfig: any = {
      host: config.redisHost,
      port: config.redisPort || 6379,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    };

    // Add authentication and TLS for Upstash (production)
    if (config.redisToken) {
      redisConfig.password = config.redisToken;
      redisConfig.tls = {}; // Enable TLS
    } else if (isProduction) {
      // [SECURITY FIX L6] Force TLS in production even without token
      // This catches misconfiguration where TLS might be disabled
      console.warn("[SECURITY] Redis TLS enabled but no token configured");
      redisConfig.tls = {};
    }

    return new Redis(redisConfig);
  } catch (error) {
    console.error("[Rate Limit] Failed to create Redis client:", error);
    return null;
  }
}

/**
 * In-memory store fallback (for development without Redis)
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig,
): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  const redis = getRedisClient();

  if (!redis) {
    // Fallback to memory store
    return checkRateLimitMemory(key, config);
  }

  try {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / config.windowMs)}`;
    const resetTime = Math.ceil(now / config.windowMs) * config.windowMs;

    // Increment counter
    const current = await redis.incr(windowKey);

    // Set expiry on first request
    if (current === 1) {
      await redis.pexpire(windowKey, config.windowMs);
    }

    const remaining = Math.max(0, config.maxRequests - current);

    return {
      limited: current > config.maxRequests,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error("[Rate Limit] Redis error, falling back to memory:", error);
    return checkRateLimitMemory(key, config);
  }
}

/**
 * Check rate limit using memory store (fallback)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig,
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / config.windowMs)}`;
  const resetTime = Math.ceil(now / config.windowMs) * config.windowMs;

  const record = memoryStore.get(windowKey) || { count: 0, resetTime };
  record.count++;
  memoryStore.set(windowKey, record);

  const remaining = Math.max(0, config.maxRequests - record.count);

  return {
    limited: record.count > config.maxRequests,
    remaining,
    resetTime,
  };
}

/**
 * Generate rate limit key from request
 */
function getRateLimitKey(
  event: any,
  type: "user" | "ip" | "both" = "user",
): string {
  const headers = getRequestHeaders(event);
  const ip =
    headers["x-forwarded-for"]?.split(",")[0] ||
    headers["x-real-ip"] ||
    "unknown";

  // Try to get user ID from context
  let userId = "anonymous";
  try {
    // User ID would be available in event context if authenticated
    userId = event.context?.userId || ip;
  } catch {
    userId = ip;
  }

  switch (type) {
    case "user":
      return userId;
    case "ip":
      return `ip:${ip}`;
    case "both":
    default:
      return `${userId}:${ip}`;
  }
}

/**
 * Apply rate limiting to an endpoint
 *
 * @param event - H3 event
 * @param preset - Rate limit preset to use
 * @param keyType - How to identify the user ('user', 'ip', or 'both')
 * @returns true if request should proceed, false if rate limited
 */
export async function applyRateLimit(
  event: any,
  preset: RateLimitConfig,
  keyType: "user" | "ip" | "both" = "user",
): Promise<boolean> {
  const key = getRateLimitKey(event, keyType);

  const result = await checkRateLimitRedis(key, preset);

  // Set rate limit headers
  setResponseHeader(event, "X-RateLimit-Limit", preset.maxRequests.toString());
  setResponseHeader(
    event,
    "X-RateLimit-Remaining",
    result.remaining.toString(),
  );
  setResponseHeader(
    event,
    "X-RateLimit-Reset",
    Math.floor(result.resetTime / 1000).toString(),
  );

  if (result.limited) {
    // Set Retry-After header (must be a number, not string)
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    setResponseHeader(event, "Retry-After", retryAfter);

    // Return 429 Too Many Requests
    throw createError({
      statusCode: 429,
      message: preset.message,
      data: {
        retryAfter,
        resetTime: result.resetTime,
      },
    });
  }

  return true;
}

/**
 * Rate limit middleware factory
 * Creates a middleware function for use in defineEventHandler
 */
export function rateLimitMiddleware(
  preset: RateLimitConfig,
  keyType: "user" | "ip" | "both" = "user",
) {
  return async (event: any) => {
    await applyRateLimit(event, preset, keyType);
  };
}
