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

export const processJob = async (job: Job) => {
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

        // Process each job in chunks to avoid blocking event loop
        let savedCount = 0;
        const CHUNK_SIZE = 5;

        for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
            const chunk = jobs.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (jobData) => {
                try {
                    // 0. Check for expiration/inactive status
                    if (jobData.is_active === false) {
                        logger.info(`Job marked as inactive/expired. Removing from DB: ${jobData.url}`);
                        const { error } = await supabase.from('jobs').delete().match({ url: jobData.url });
                        if (error) {
                            logger.error(`Failed to delete expired job ${jobData.url}: ${error.message}`);
                        } else {
                            logger.info(`Successfully removed expired job: ${jobData.title}`);
                        }
                        return; // Skip further processing for this job
                    }

                    // 1. Generate Embedding
                    const description = jobData.description || `${jobData.title} at ${jobData.company} in ${jobData.location}`;
                    logger.info(`Generating embedding for: ${jobData.title} @ ${jobData.company}`);
                    const embedding = await aiPipeline.generateEmbedding(description);

                    if (embedding.length === 0) {
                        logger.warn(`Zero embedding generated for ${jobData.url}`);
                    }

                    // 2. Save to DB
                    const sourceId = SOURCE_ID_MAP[platform.toLowerCase()] || null;
                    logger.info(`Saving job to Supabase (source_id=${sourceId}): ${jobData.url}`);
                    const { error } = await supabase.from('jobs').upsert({
                        title: jobData.title,
                        company: jobData.company,
                        location: jobData.location,
                        description: jobData.description,
                        url: jobData.url,
                        source_id: sourceId,
                        embedding, // pgvector

                        // New Fields
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
            }));
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
