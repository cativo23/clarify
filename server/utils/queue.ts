import { Queue } from "bullmq";
import { Redis } from "ioredis";

let analysisQueue: Queue | null = null;
let redisConnection: Redis | null = null;

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
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 100 }, // Keep last 100 completed
        removeOnFail: { count: 1000 }, // Keep last 1000 failed for debugging
      },
    });
  }
  return analysisQueue;
};
