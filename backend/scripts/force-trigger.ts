import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

const scrapeQueue = new Queue('scrape-queue', { connection });

async function trigger() {
    console.log('Adding job to scrape-queue directly...');
    await scrapeQueue.add('force-scrape', {
        platform: 'linkedin',
        keywords: ['software engineer'],
        location: 'Remote'
    });
    console.log('✅ Job added to queue. Check backend logs for progress.');
    await scrapeQueue.close();
    process.exit(0);
}

trigger();
