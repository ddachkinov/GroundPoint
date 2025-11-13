import { Queue } from 'bullmq';
import { redisConnection, QueueNames, defaultJobOptions } from '../config/queue.config';

/**
 * Thumbnail generation job data
 */
export interface ThumbnailJobData {
  captureId: string;
  s3Key: string;
  thumbnailS3Key: string;
  operatorOrgId: string;
  projectId: string;
  siteId: string;
}

/**
 * Thumbnail generation queue
 */
export const thumbnailQueue = new Queue<ThumbnailJobData>(
  QueueNames.THUMBNAIL_GENERATION,
  {
    connection: redisConnection,
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10 seconds base delay
      },
    },
  }
);

/**
 * Enqueue thumbnail generation job
 */
export async function enqueueThumbnailGeneration(
  data: ThumbnailJobData
): Promise<void> {
  // Check if job already exists for this capture (idempotency)
  const existingJobs = await thumbnailQueue.getJobs(['waiting', 'active', 'delayed']);
  const jobExists = existingJobs.some((job) => job.data.captureId === data.captureId);

  if (jobExists) {
    console.log(`Thumbnail job already exists for capture ${data.captureId}, skipping`);
    return;
  }

  await thumbnailQueue.add(
    'generate-thumbnail',
    data,
    {
      jobId: `thumbnail-${data.captureId}`, // Unique job ID for idempotency
      timeout: 5 * 60 * 1000, // 5 minute timeout per job
    }
  );

  console.log(`Thumbnail generation job enqueued for capture ${data.captureId}`);
}
