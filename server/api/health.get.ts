import { getRedisConnection } from "../utils/queue";

export default defineEventHandler(async () => {
  const health = {
    status: "ok" as const,
    services: {
      database: "unknown" as const,
      redis: "unknown" as const,
      ai: "active" as const,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const redis = getRedisConnection();
    await redis.ping();
    health.services.redis = "connected";
  } catch {
    health.services.redis = "disconnected";
    health.status = "degraded";
  }

  if (health.services.redis === "disconnected") {
    throw createError({
      statusCode: 503,
      statusMessage: "Service Unhealthy",
      body: health,
    });
  }

  return health;
});
