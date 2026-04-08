
import { createClient } from '@supabase/supabase-js';
import { BrowserManager } from '../core/browser';
import logger from '../utils/logger';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    logger.error('Missing Supabase credentials. Check .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    logger.info('Starting Database Cleanup...');

    // 1. Fetch all jobs
    const { data: jobs, error } = await supabase.from('jobs').select('title, company, url');
    if (error) {
        logger.error(`Failed to fetch jobs: ${error.message}`);
        return;
    }

    logger.info(`Found ${jobs.length} jobs in database. Verifying...`);

    const browserManager = new BrowserManager();
    const page = await browserManager.newPage();

    let removedCount = 0;

    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        logger.info(`[${i + 1}/${jobs.length}] Verifying: ${job.title} @ ${job.company}`);

        try {
            await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(2000); // Random delay

            const content = await page.content();
            const isClosed = content.includes('No longer accepting applications') ||
                content.includes('This job has been closed') ||
                content.includes('Job no longer available');

            if (isClosed) {
                logger.warn(`❌ Job is CLOSED: ${job.title}. Deleting...`);

                // Delete from DB use specific URL match
                const { error: delError } = await supabase.from('jobs').delete().match({ url: job.url });

                if (delError) {
                    logger.error(`Failed to delete: ${delError.message}`);
                } else {
                    removedCount++;
                    logger.info('✅ Deleted.');
                }
            } else {
                logger.info('✅ Job is active.');
            }

        } catch (e: any) {
            logger.warn(`⚠️ Skipped ${job.url}: ${e.message}`);
        }
    }

    await browserManager.close();
    logger.info(`Cleanup Complete. Removed ${removedCount} jobs.`);
}

cleanup();
