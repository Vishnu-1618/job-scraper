
import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { startScheduler } from './core/scheduler';
import { processJob } from './queue/worker';
import { startResumeWorker } from './queue/resume-worker';
import { startMatchWorker } from './queue/match-worker';
import { redisConnection, isRedisConnected } from './config/redis';
import logger from './utils/logger';

dotenv.config();

const QUEUE_NAME = 'scrape-queue';

async function startServer() {
  logger.info('Starting Backend Server Process...');
  
  // Wait a brief moment to allow Redis connection detection to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (isRedisConnected) {
      // Initialize Job Queue Worker
      // @ts-ignore
      const worker = new Worker(QUEUE_NAME, processJob, {
        connection: redisConnection,
        concurrency: 3, 
      });

      worker.on('completed', (job) => {
        logger.info(`Job ${job.id} completed!`);
      });

      worker.on('failed', (job, err) => {
        logger.info(`Job ${job?.id} failed: ${err.message} `);
      });

      logger.info(`Worker listening on queue: ${QUEUE_NAME} `);

      // Start Resume Worker
      startResumeWorker();

      // Start Match Worker
      startMatchWorker();
  } else {
      logger.info('Running without Redis (fallback mode). Queue Workers disabled.');
  }

  // Start Cron Scheduler (will auto-adjust based on isRedisConnected)
  startScheduler();

  logger.info('Server initialization complete.');
}

startServer().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
