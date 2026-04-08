import { Worker, Job, Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const MATCH_QUEUE = 'match-queue';

export const processMatchJob = async (job: Partial<Job>) => {
    const { userId, skills, triggerScrapeIfEmpty } = job.data;
    logger.info(`Starting job matching for user ${userId}`);

    try {
        // 1. Get User Resume Embedding
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('embedding')
            .eq('user_id', userId)
            .single();

        if (resumeError || !resume) {
            throw new Error(`Resume not found for user ${userId}`);
        }

        const embedding = resume.embedding;
        if (!embedding) {
            throw new Error(`Resume has no embedding for user ${userId}`);
        }

        const { data: matches, error: matchError } = await supabase.rpc('match_jobs', {
            query_embedding: embedding,
            match_threshold: 0.25,
            match_count: 100
        });

        let finalMatches = matches || [];

        if (matchError) {
            logger.warn(`Match RPC failed. Proceeding with keyword fallback. Error: ${matchError.message}`);
            finalMatches = [];
        }

        if (finalMatches.length < 10 && skills && skills.length > 0) {
            logger.info(`Vector search yielded only ${finalMatches.length} results. Attempting fallback keyword search for user ${userId}...`);
            
            const skillKeywords = skills.slice(0, 5).map((s: string) => `title.ilike.%${s.trim()}%,description.ilike.%${s.trim()}%`).join(',');
            
            const { data: keywordJobs, error: keywordError } = await supabase
                .from('jobs')
                .select('id, title, company')
                .or(skillKeywords)
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (!keywordError && keywordJobs) {
                const existingIds = new Set(finalMatches.map((m: any) => m.id));
                
                const newKeywordMatches = keywordJobs
                    .filter((kj: any) => !existingIds.has(kj.id))
                    .map((kj: any) => ({
                        id: kj.id,
                        similarity: 0.35 
                    }));
                    
                finalMatches = [...finalMatches, ...newKeywordMatches];
                logger.info(`Keyword fallback added ${newKeywordMatches.length} more matches.`);
            }
        }

        // 3. Save Matches
        if (finalMatches && finalMatches.length > 0) {
            const matchInserts = finalMatches.map((job: any) => ({
                user_id: userId,
                job_id: job.id,
                similarity_score: job.similarity,
                status: 'new',
                created_at: new Date()
            }));

            const { error: insertError } = await supabase
                .from('job_matches')
                .upsert(matchInserts, { onConflict: 'user_id,job_id' });

            if (insertError) {
                logger.error(`Failed to save matches: ${insertError.message}`);
            } else {
                logger.info(`Saved ${finalMatches.length} matches for user ${userId}`);
            }
        } else {
            logger.info(`No matches found for user ${userId}`);
        }

        return { success: true, count: finalMatches.length };

    } catch (error: any) {
        logger.error(`Match job failed: ${error.message}`);
        throw error;
    }
};

export const startMatchWorker = () => {
    logger.info('Starting Match Worker...');

    const worker = new Worker(MATCH_QUEUE, processMatchJob as unknown as (job: Job) => Promise<any>, { connection: redisConnection });

    worker.on('failed', (job, err) => {
        logger.error(`Match Job ${job?.id} failed: ${err.message}`);
    });
};
