import { ConnectionOptions } from 'bullmq';

/**
 * Redis connection configuration for BullMQ
 */
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

/**
 * Default job options for all queues
 */
export const defaultJobOptions = {
  removeOnComplete: {
    count: 100, // Keep last 100 completed jobs for monitoring
    age: 24 * 3600, // Keep for 24 hours
  },
  removeOnFail: false, // Keep failed jobs for inspection
};

/**
 * Queue names
 */
export const QueueNames = {
  THUMBNAIL_GENERATION: 'thumbnail-generation',
} as const;
