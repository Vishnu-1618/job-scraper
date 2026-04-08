import { Worker, Job, Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const MATCH_QUEUE = 'match-queue';

export const startMatchWorker = () => {
    logger.info('Starting Match Worker...');

    const worker = new Worker(MATCH_QUEUE, async (job: Job) => {
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

            // 2. Perform Vector Similarity Search
            // We use the <-> operator (Euclidean distance) or <=> (Cosine distance).
            // Since we produced normalized embeddings, inner product <#> is efficiently cosine similarity.
            // But usually for pgvector, we use a function.
            // Supabase RPC is best for this. Or direct SQL if we had pg-node.
            // Since we are using supabase-js, we should use an RPC function.
            // BUT, for now let's assume we can call an rpc 'match_jobs'.

            const { data: matches, error: matchError } = await supabase.rpc('match_jobs', {
                query_embedding: embedding,
                match_threshold: 0.25, // Lowered threshold for realistic text embeddings
                match_count: 100 // Top 100
            });

            let finalMatches = matches || [];

            if (matchError) {
                logger.warn(`Match RPC failed (possibly not created yet). Proceeding with keyword fallback. Error: ${matchError.message}`);
                finalMatches = [];
            }

            // FALLBACK: If vector search fails or yields too few results, use keyword ILIKE
            if (finalMatches.length < 10 && skills && skills.length > 0) {
                logger.info(`Vector search yielded only ${finalMatches.length} results. Attempting fallback keyword search for user ${userId}...`);
                
                // Build an OR query for the top skills. We'll use individual words to increase recall.
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
                            similarity: 0.35 // Increased score so they appear prominent on frontend
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
            
            // Note: Scraper trigger is intentionally removed here to ensure we ONLY search existing DB.
            // Matching relies strictly on finding jobs already in the database.

            return { success: true, count: finalMatches.length };

        } catch (error: any) {
            logger.error(`Match job failed: ${error.message}`);
            throw error;
        }
    }, { connection: redisConnection });

    worker.on('failed', (job, err) => {
        logger.error(`Match Job ${job?.id} failed: ${err.message}`);
    });
};
