import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { processJob } from './queue/worker';
import logger from './utils/logger';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Healthcheck
app.get('/', (req: Request, res: Response) => {
    res.json({ status: 'API is running' });
});

// Fetch jobs directly from DB
app.get('/jobs', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        
        res.json({ success: true, jobs: data });
    } catch (error: any) {
        logger.error(`GET /jobs error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Trigger scraper manually (On-demand API flow)
app.post('/scrape', async (req: Request, res: Response) => {
    try {
        const { platform = 'linkedin', keywords = 'software engineer', location = 'Remote' } = req.body;
        
        logger.info(`Manual scrape triggered for ${platform}`);

        // Construct job payload
        const jobData = {
            id: `manual-${Date.now()}`,
            data: { platform, keywords, location }
        };

        // We run it securely but await its resolution to return success to client
        // This stops background worker loops entirely.
        const result = await processJob(jobData);

        res.json({ success: true, result });
    } catch (error: any) {
        logger.error(`POST /scrape error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    logger.info(`Server initialization complete. Listening on API Port ${PORT}`);
});
