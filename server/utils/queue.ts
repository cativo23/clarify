import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

let analysisQueue: Queue | null = null
let redisConnection: Redis | null = null

export const getRedisConnection = () => {
    if (!redisConnection) {
        const config = useRuntimeConfig()
        redisConnection = new Redis({
            host: config.redisHost,
            port: config.redisPort,
            maxRetriesPerRequest: null, // Required by BullMQ
        })
    }
    return redisConnection
}

export const getAnalysisQueue = () => {
    if (!analysisQueue) {
        analysisQueue = new Queue('analysis-queue', {
            connection: getRedisConnection(),
        })
    }
    return analysisQueue
}
