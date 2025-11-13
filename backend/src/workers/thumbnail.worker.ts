import { Worker, Job } from 'bullmq';
import sharp from 'sharp';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { redisConnection, QueueNames } from '../config/queue.config';
import { s3Client, bucketConfig } from '../config/s3.config';
import { prisma } from '../lib/prisma';
import { ProcessingStatus } from '@prisma/client';
import { ThumbnailJobData } from '../queues/thumbnail.queue';

/**
 * Maximum thumbnail width in pixels
 */
const THUMBNAIL_MAX_WIDTH = 400;

/**
 * JPEG quality for thumbnails
 */
const THUMBNAIL_QUALITY = 85;

/**
 * Download file from S3
 */
async function downloadFromS3(s3Key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketConfig.bucketName,
    Key: s3Key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('S3 response body is empty');
  }

  // Convert stream to buffer
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Upload buffer to S3
 */
async function uploadToS3(
  s3Key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucketConfig.bucketName,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

/**
 * Generate thumbnail from image buffer
 */
async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(THUMBNAIL_MAX_WIDTH, null, {
      fit: 'inside', // Maintain aspect ratio
      withoutEnlargement: true, // Don't enlarge smaller images
      kernel: sharp.kernel.lanczos3, // High-quality resampling
    })
    .jpeg({
      quality: THUMBNAIL_QUALITY,
      mozjpeg: true, // Use mozjpeg for better compression
    })
    .toBuffer();
}

/**
 * Update capture processing status
 */
async function updateCaptureStatus(
  captureId: string,
  status: ProcessingStatus,
  thumbnailPath?: string,
  errorMessage?: string
): Promise<void> {
  await prisma.capture.update({
    where: { id: captureId },
    data: {
      processingStatus: status,
      thumbnailPath: thumbnailPath || undefined,
      errorMessage: errorMessage || undefined,
    },
  });
}

/**
 * Process thumbnail generation job
 */
async function processThumbnailJob(job: Job<ThumbnailJobData>): Promise<void> {
  const { captureId, s3Key, thumbnailS3Key } = job.data;
  const startTime = Date.now();

  console.log(`[Thumbnail Worker] Job started for capture_id=${captureId}`);

  try {
    // Verify capture exists
    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
    });

    if (!capture) {
      throw new Error(`Capture not found: ${captureId}`);
    }

    // Update status to processing
    await updateCaptureStatus(captureId, ProcessingStatus.PROCESSING);

    // Download original image from S3
    console.log(`[Thumbnail Worker] Downloading from S3: ${s3Key}`);
    const imageBuffer = await downloadFromS3(s3Key);

    // Generate thumbnail
    console.log(`[Thumbnail Worker] Generating thumbnail for capture_id=${captureId}`);
    const thumbnailBuffer = await generateThumbnail(imageBuffer);

    // Upload thumbnail to S3
    console.log(`[Thumbnail Worker] Uploading thumbnail to S3: ${thumbnailS3Key}`);
    await uploadToS3(thumbnailS3Key, thumbnailBuffer, 'image/jpeg');

    // Update capture with thumbnail path and status
    await updateCaptureStatus(captureId, ProcessingStatus.READY, thumbnailS3Key);

    const duration = Date.now() - startTime;
    console.log(
      `[Thumbnail Worker] Job completed successfully for capture_id=${captureId}, duration=${duration}ms`
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const attemptNumber = job.attemptsMade + 1;

    console.error(
      `[Thumbnail Worker] Job failed for capture_id=${captureId}, attempt=${attemptNumber}, duration=${duration}ms, error=${errorMessage}`
    );

    // Check if this is the last attempt
    if (attemptNumber >= (job.opts.attempts || 3)) {
      console.error(
        `[Thumbnail Worker] Job permanently failed for capture_id=${captureId}, error=${errorMessage}`
      );

      // Update capture status to failed
      await updateCaptureStatus(captureId, ProcessingStatus.FAILED, undefined, errorMessage);
    }

    // Re-throw error so BullMQ can handle retry logic
    throw error;
  }
}

/**
 * Create and start thumbnail worker
 */
export function createThumbnailWorker(): Worker {
  const worker = new Worker<ThumbnailJobData>(
    QueueNames.THUMBNAIL_GENERATION,
    processThumbnailJob,
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.THUMBNAIL_WORKER_CONCURRENCY || '5', 10),
      limiter: {
        max: 10, // Max 10 jobs per duration
        duration: 1000, // 1 second
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(`[Thumbnail Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Thumbnail Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Thumbnail Worker] Worker error:', err);
  });

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', async () => {
    console.log('[Thumbnail Worker] SIGTERM received, closing worker gracefully...');
    await worker.close();
    console.log('[Thumbnail Worker] Worker closed');
    process.exit(0);
  });

  console.log('[Thumbnail Worker] Worker started successfully');

  return worker;
}

// Start worker if this file is executed directly
if (require.main === module) {
  createThumbnailWorker();
}
