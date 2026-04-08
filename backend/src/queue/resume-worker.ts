import { Worker, Job, Queue } from 'bullmq';
import { redisConnection, isRedisConnected } from '../config/redis';
import { processMatchJob } from './match-worker';
import { createClient } from '@supabase/supabase-js';
import { aiPipeline } from '../ai/pipeline';
import logger from '../utils/logger';
import * as mammoth from 'mammoth';
import axios from 'axios';

// Load pdf-parse at module scope
const pdfParse = require('pdf-parse');

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const RESUME_QUEUE = 'resume-queue';

export const processResumeJob = async (job: Partial<Job>) => {
    const { url, path, userId } = job.data;
    logger.info(`Processing resume for user ${userId}: ${url}`);

        try {
            // 1. Download file
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            // 2. Extract Text
            let text = '';
            if (url.endsWith('.pdf')) {
                const data = await pdfParse(buffer);
                text = data.text;
            } else if (url.endsWith('.docx') || url.endsWith('.doc')) {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            }

            if (!text) throw new Error('Failed to extract text from resume');

            // 3. Generate Embedding
            const embedding = await aiPipeline.generateEmbedding(text);

            // 4. Save to DB (using upsert or delete-then-insert to keep 1 active resume per user ID)
            // First delete old resumes for this user to save space
            await supabase.from('resumes').delete().eq('user_id', userId);

            const { error } = await supabase.from('resumes').insert({
                user_id: userId,
                content_text: text,
                embedding: embedding,
                file_path: path,
                created_at: new Date()
            });

            if (error) throw error;

            logger.info(`Successfully processed resume for user ${userId}`);

            // 5. Trigger Match Worker or Scraper with extracted skills
            try {
                let cleanSkills: string[] = [];
                try {
                    const skills = await aiPipeline.extractSkills(text.slice(0, 1000));
                    // Simple cleanup of HF token parts
                    cleanSkills = skills
                        .filter(s => s.length > 2) // Filter short noise
                        .map(s => s.startsWith('##') ? s.slice(2) : s)
                        .slice(0, 5); // Take top 5
                } catch (aiError) {
                    logger.warn(`AI Skill extraction failed: ${aiError}. Using fallback matching.`);
                }

                // Fallback: If AI fails or finds nothing, try regex matching for common tech keywords
                if (cleanSkills.length === 0) {
                    const commonTech = ['React', 'Node.js', 'Python', 'Java', 'TypeScript', 'AWS', 'Docker', 'SQL', 'Data Scientist', 'Frontend', 'Backend'];
                    cleanSkills = commonTech.filter(tech => text.toLowerCase().includes(tech.toLowerCase())).slice(0, 5);
                }

                if (cleanSkills.length === 0) {
                    logger.warn(`No skills extracted for user ${userId}. Defaulting to "Software Engineer"`);
                    cleanSkills = ['Software Engineer'];
                }

                if (!isRedisConnected) {
                    logger.info(`Starting immediate fallback job matching for user ${userId} using skills: ${cleanSkills.join(', ')}`);
                    await processMatchJob({ data: { userId, skills: cleanSkills } } as any);
                } else {
                    const matchQueue = new Queue('match-queue', { connection: redisConnection });
                    const matchJob = await matchQueue.add('match-jobs', { userId, skills: cleanSkills });
                    logger.info(`Scheduled immediate job matching for user ${userId} (Job ID: ${matchJob.id})`);
                }

            } catch (workflowError: any) {
                logger.error(`Failed during resume processing workflow: ${workflowError.message}`);
            }

            return { success: true };

        } catch (error: any) {
            logger.error(`Failed to process resume: ${error.message}`);
            throw error;
        }
};

export const startResumeWorker = () => {
    logger.info('Starting Resume Worker...');

    const worker = new Worker(RESUME_QUEUE, processResumeJob as unknown as (job: Job) => Promise<any>, { connection: redisConnection });

    worker.on('failed', (job, err) => {
        logger.error(`Resume Job ${job?.id} failed: ${err.message}`);
    });
};
