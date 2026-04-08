import { NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';



const connection = new IORedis('redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
const scrapeQueue = new Queue('scrape-queue', { connection: connection as any });



export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Handle both 'keyword' and 'keywords' from frontend
        const {
            platform = 'LinkedIn',
            keyword,
            keywords: keywordsRaw,
            location = 'remote',
            // New Filters
            job_type,
            experience_level,
            salary_min,
            is_remote
        } = body;

        let keywords: string[] = [];
        if (Array.isArray(keywordsRaw)) {
            keywords = keywordsRaw;
        } else if (typeof keywordsRaw === 'string') {
            keywords = [keywordsRaw];
        } else if (keyword) {
            keywords = [keyword];
        } else {
            keywords = ['software engineer'];
        }

        console.log(`Queueing scrape for ${platform} - Keywords: ${keywords}, Location: ${location}`);

        await scrapeQueue.add('scrape-job', {
            platform,
            keywords,
            location,
            // Pass new filters to the scraper/job
            job_type,
            experience_level,
            salary_min,
            is_remote
        });

        return NextResponse.json({ success: true, message: 'Scraping triggered successfully' });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
