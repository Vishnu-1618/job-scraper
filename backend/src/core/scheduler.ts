import cron from 'node-cron';
import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { redisConnection } from '../config/redis';
import logger from '../utils/logger';

const QUEUE_NAME = 'scrape-queue';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Keywords to scrape across platforms for a healthy job pool
const SCRAPE_KEYWORDS = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'React Developer', 'Node.js Developer',
    'Python Developer', 'Data Engineer', 'DevOps Engineer', 'Product Manager'
];

const PLATFORMS = ['linkedin', 'indeed', 'glassdoor', 'naukri'];

async function triggerFullScrape() {
    logger.info('[Scheduler] Starting full platform scrape...');
    // @ts-ignore
    const queue = new Queue(QUEUE_NAME, { connection: redisConnection });

    // Pick 3 random keywords each time for variety
    const shuffled = SCRAPE_KEYWORDS.sort(() => 0.5 - Math.random()).slice(0, 3);

    for (const platform of PLATFORMS) {
        for (const keyword of shuffled) {
            await queue.add('scheduled-scrape', {
                platform,
                keywords: keyword,
                location: 'Remote',
            }, { attempts: 2, backoff: { type: 'exponential', delay: 5000 } });
        }
    }
    await queue.close();
    logger.info(`[Scheduler] Queued scrapes for ${PLATFORMS.length} platforms × ${shuffled.length} keywords.`);
}

async function cleanOldJobs() {
    logger.info('[Scheduler] Running auto-cleanup: removing jobs older than 30 days...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error, count } = await supabase
        .from('jobs')
        .delete()
        .lt('created_at', thirtyDaysAgo);

    if (error) {
        logger.error(`[Scheduler] Cleanup failed: ${error.message}`);
    } else {
        logger.info(`[Scheduler] Removed ${count ?? 'unknown number of'} expired jobs.`);
    }
}

async function cleanDuplicateJobs() {
    logger.info('[Scheduler] Running duplicate detection...');
    // Use a CTE to keep only the latest row for each (title, company, location) combo
    const { error } = await supabase.rpc('remove_duplicate_jobs').maybeSingle();
    if (error) {
        // If the RPC doesn't exist it's a soft error — just log it
        logger.warn(`[Scheduler] Duplicate cleanup skipped (RPC may not exist): ${error.message}`);
    } else {
        logger.info('[Scheduler] Duplicate jobs cleaned successfully.');
    }
}

export function startScheduler() {
    logger.info('[Scheduler] Initializing JobRadar AI background scheduler...');

    // 1. Scrape all platforms every 4 hours
    cron.schedule('0 */4 * * *', () => {
        triggerFullScrape().catch(err => logger.error(`[Scheduler] Scrape error: ${err.message}`));
    });

    // 2. Clean expired jobs every day at 3 AM
    cron.schedule('0 3 * * *', () => {
        cleanOldJobs().catch(err => logger.error(`[Scheduler] Cleanup error: ${err.message}`));
    });

    // 3. Remove duplicates every Sunday at 4 AM
    cron.schedule('0 4 * * 0', () => {
        cleanDuplicateJobs().catch(err => logger.error(`[Scheduler] Dedupe error: ${err.message}`));
    });

    // 4. Trigger an immediate scrape on startup to ensure fresh data
    setTimeout(() => {
        triggerFullScrape().catch(err => logger.error(`[Scheduler] Startup scrape error: ${err.message}`));
    }, 10000); // 10 second delay to let workers boot first

    logger.info('[Scheduler] Background jobs registered: scrape (4h), cleanup (daily), dedupe (weekly).');
}
