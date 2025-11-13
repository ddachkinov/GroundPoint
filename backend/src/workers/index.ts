import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { env } from '../config/env';

console.log('Worker process starting...');

process.on('SIGTERM', async () => {
  console.log('Worker shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});
