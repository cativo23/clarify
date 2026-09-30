import { Queue } from "bullmq";
import { Redis } from "ioredis";

let analysisQueue: Queue | null = null;
let redisConnection: Redis | null = null;

// [LAUNCH-01 FIX] Namespaces BullMQ's Redis keys per environment. Local dev
// and production point at the same Upstash instance (same REDIS_HOST/TOKEN
// copied from .env for convenience), so without this both a locally running
// `nuxt dev` and the production worker race to claim jobs from the same
// unprefixed "analysis-queue" — discovered live when a production job was
// silently stolen and failed by a 3-day-old local dev process. Must match
// the prefix used when constructing the Worker in server/plugins/worker.ts.
export const queuePrefix =
  process.env.NODE_ENV === "production" ? "prod" : "dev";

export const getRedisConnection = () => {
  if (!redisConnection) {
    const config = useRuntimeConfig();

    // [SECURITY FIX M3] Upstash Redis with authentication and TLS
    // Uses rediss:// protocol (Redis over TLS) with token auth
    const redisConfig: any = {
      host: config.redisHost,
      port: config.redisPort,
      maxRetriesPerRequest: null, // Required by BullMQ
    };

    // Add authentication and TLS for Upstash (production)
    if (config.redisToken) {
      redisConfig.password = config.redisToken;
      redisConfig.tls = {}; // Enable TLS (rediss://)
    }

    redisConnection = new Redis(redisConfig);
  }
  return redisConnection;
};

export const getAnalysisQueue = () => {
  if (!analysisQueue) {
    analysisQueue = new Queue("analysis-queue", {
      connection: getRedisConnection() as any, // Cast to any to resolve ioredis version mismatch
      prefix: queuePrefix,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        timeout: 780000, // 13 minutes (must exceed the OpenAI client's 12-minute forensic-tier timeout in server/utils/openai-client.ts)
        removeOnComplete: { count: 100 }, // Keep last 100 completed
        removeOnFail: { count: 1000 }, // Keep last 1000 failed for debugging
      } as any, // Cast to any to resolve BullMQ type mismatch
    });
  }
  return analysisQueue;
};
