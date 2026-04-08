
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function deduplicateAndFilter(rawJobs) {
    const seen = new Map();
    const result = [];
    let domainFilteredCount = 0;
    let duplicateCount = 0;
    let noUrlCount = 0;

    for (const job of rawJobs) {
        if (!job.url) {
            noUrlCount++;
            continue;
        }

        // Filter by platform
        const allowedDomains = ['linkedin.com', 'indeed.', 'glassdoor.', 'naukri.com'];
        if (!allowedDomains.some(d => job.url.toLowerCase().includes(d))) {
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

    console.log(`No URL: ${noUrlCount}`);
    console.log(`Domain Filtered: ${domainFilteredCount}`);
    console.log(`Duplicates Removed: ${duplicateCount}`);
    return result;
}

async function run() {
    console.log('Fetching all jobs from Supabase (paginated)...');
    let allJobs = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore && allJobs.length < 5000) {
        console.log(`Fetching page ${page}...`);
        const { data, error } = await supabase
            .from('jobs')
            .select('title, company, location, url')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching jobs:', error);
            break;
        }

        if (data && data.length > 0) {
            allJobs = [...allJobs, ...data];
            console.log(`Received ${data.length} jobs. Total so far: ${allJobs.length}`);
            page++;
            if (data.length < pageSize) hasMore = false;
        } else {
            hasMore = false;
        }
    }

    console.log(`Total Jobs Fetched: ${allJobs.length}`);
    const processed = deduplicateAndFilter(allJobs);
    console.log(`Final Available Jobs after Dedup: ${processed.length}`);
}

run();
