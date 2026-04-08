
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function deduplicateAndFilter(rawJobs: any[]): any[] {
    const seen = new Map<string, true>();
    const result: any[] = [];
    let domainFilteredCount = 0;
    let duplicateCount = 0;

    for (const job of rawJobs) {
        if (!job.url) continue;

        // Filter by platform
        const allowedDomains = ['linkedin.com', 'indeed.', 'glassdoor.', 'naukri.com'];
        if (!allowedDomains.some(d => job.url?.toLowerCase().includes(d))) {
            domainFilteredCount++;
            continue;
        }

        const key = [
            (job.title || '').toLowerCase().trim(),
            (job.company || '').toLowerCase().trim(),
            (job.location || '').toLowerCase().trim(),
        ].join('|');
        
        if (seen.has(key)) {
            duplicateCount++;
            continue;
        }
        seen.set(key, true);

        result.push(job);
    }

    console.log(`Domain Filtered: ${domainFilteredCount}`);
    console.log(`Duplicates Removed: ${duplicateCount}`);
    return result;
}

async function run() {
    const { data, error } = await supabase.from('jobs').select('title, company, location, url');
    if (error) {
        console.error('Error fetching jobs:', error);
        return;
    }

    console.log(`Total Jobs in DB: ${data.length}`);
    const processed = deduplicateAndFilter(data);
    console.log(`Final Available Jobs: ${processed.length}`);
}

run();
