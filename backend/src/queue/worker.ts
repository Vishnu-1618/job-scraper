import { Job } from 'bullmq';
import logger from '../utils/logger';
import { ScraperFactory } from '../scrapers/factory';
import { aiPipeline } from '../ai/pipeline';
import { notificationService } from '../core/notifications';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Map platform names to source_id in the job_sources table
const SOURCE_ID_MAP: Record<string, number> = {
    'linkedin': 1,
    'indeed': 2,
    'glassdoor': 3,
    'naukri': 4,
};

export const processJob = async (job: Partial<Job> | any) => {
    logger.info(`Processing job ${job.id} for platform: ${job.data.platform}`);

    const { platform, keywords, location } = job.data;

    try {
        const scraper = ScraperFactory.getScraper(platform);
        const scraperKeywords = Array.isArray(keywords) ? keywords : [keywords];

        logger.info(`Starting scrape for ${platform} with keywords: ${scraperKeywords.join(', ')}`);
        const jobs = await scraper.scrape(scraperKeywords, location);

        logger.info(`Scraper returned ${jobs.length} jobs for ${platform}. Starting AI processing...`);

        if (jobs.length === 0) {
            logger.info(`No jobs found for ${platform}. Job processing complete.`);
            return { status: 'success', count: 0 };
        }

        // 1. Check for duplicates BEFORE processing
        const urlsToCheck = jobs.map(j => j.url);
        const { data: existingJobs } = await supabase
            .from('jobs')
            .select('url')
            .in('url', urlsToCheck);

        const existingUrls = new Set(existingJobs?.map(j => j.url) || []);
        const newJobs = jobs.filter(j => !existingUrls.has(j.url));
        
        logger.info(`Filtered out ${jobs.length - newJobs.length} duplicate jobs.`);

        if (newJobs.length === 0) {
            return { status: 'success', count: 0 };
        }

        // Process each job sequentially to avoid blocking event loop or spiking RAM
        let savedCount = 0;
        
        for (const jobData of newJobs) {
            try {
                if (jobData.is_active === false) {
                    logger.info(`Job marked as inactive/expired. Removing from DB: ${jobData.url}`);
                    await supabase.from('jobs').delete().match({ url: jobData.url });
                    continue;
                }

                // 2. Temporarily disabled heavy embeddings to comply with 512MB Render RAM constraint
                // We're leaving 'embedding' undefined or null.
                logger.info(`Saving job to Supabase (Skipping ML embedding computation for memory): ${jobData.url}`);
                
                const sourceId = SOURCE_ID_MAP[platform.toLowerCase()] || null;
                const { error } = await supabase.from('jobs').upsert({
                    title: jobData.title,
                    company: jobData.company,
                    location: jobData.location,
                    description: jobData.description,
                    url: jobData.url,
                    source_id: sourceId,
                    // embedding: [] -> intentionally omitted to save RAM

                    salary_min: jobData.salary_min,
                    salary_max: jobData.salary_max,
                    currency: jobData.currency,
                    job_type: jobData.job_type,
                    experience_level: jobData.experience_level,
                    is_remote: jobData.is_remote,
                    external_id: jobData.external_id,

                    posted_date: (jobData.posted_date || jobData.postedDate) ? new Date(jobData.posted_date || jobData.postedDate!) : new Date(),
                    created_at: new Date(),
                }, { onConflict: 'url' });

                if (error) {
                    logger.error(`Failed to save job ${jobData.url}: ${error.message}`);
                } else {
                    savedCount++;
                    logger.info(`Successfully saved job: ${jobData.title}`);
                }
            } catch (jobError: any) {
                logger.error(`Error processing individual job ${jobData.url}: ${jobError.message}`);
            }
        }

        logger.info(`Finished processing job ${job.id}. Saved ${savedCount}/${jobs.length} jobs.`);

        // Log to telemetry table
        try {
            await supabase.from('scraping_logs').insert({
                source: platform,
                jobs_found: savedCount,
                status: 'success',
                duration_ms: 0 // Placeholder
            });
        } catch (logErr) {
            logger.error(`Failed to write to scraping_logs: ${logErr}`);
        }

        return { status: 'success', count: savedCount };
    } catch (error: any) {
        logger.error(`Error processing job ${job.id}: ${error.message}`);

        // Log error to telemetry table
        try {
            await supabase.from('scraping_logs').insert({
                source: platform,
                status: 'error',
                error_message: error.message,
                duration_ms: 0
            });
        } catch (logErr) {
            // Ignore secondary log failures
        }

        throw error;
    }
};
