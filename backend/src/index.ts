
import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { startScheduler } from './core/scheduler';
import { processJob } from './queue/worker';
import { startResumeWorker } from './queue/resume-worker';
import { startMatchWorker } from './queue/match-worker';
import { redisConnection } from './config/redis';
import logger from './utils/logger';

dotenv.config();

const QUEUE_NAME = 'scrape-queue';

async function startServer() {
  logger.info('Starting Backend Worker...');

  // Initialize Job Queue Worker
  // @ts-ignore
  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: redisConnection,
    concurrency: 3, // Run up to 3 scraper instances in parallel
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed!`);
  });

  worker.on('failed', (job, err) => {
    logger.info(`Job ${job?.id} failed: ${err.message} `);
  });

  logger.info(`Worker listening on queue: ${QUEUE_NAME} `);

  // Start Cron Scheduler
  startScheduler();

  // Start Resume Worker
  startResumeWorker();

  // Start Match Worker
  startMatchWorker();

  logger.info('Scheduler started.');
}

startServer().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
