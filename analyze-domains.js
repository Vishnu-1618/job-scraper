
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    let allJobs = [];
    let page = 0;
    while (allJobs.length < 5000) {
        const { data, error } = await supabase.from('jobs').select('url').range(page * 1000, (page + 1) * 1000 - 1);
        if (error || !data || data.length === 0) break;
        allJobs = [...allJobs, ...data];
        page++;
    }

    const domainCounts = {};
    allJobs.forEach(job => {
        try {
            const url = new URL(job.url);
            const domain = url.hostname;
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        } catch {
            domainCounts['invalid'] = (domainCounts['invalid'] || 0) + 1;
        }
    });

    console.log('--- Domain Breakdown ---');
    console.log(domainCounts);

    const allowedDomains = ['linkedin.com', 'indeed.', 'glassdoor.', 'naukri.com'];
    const filteredCount = allJobs.filter(job => {
        return allowedDomains.some(d => job.url.toLowerCase().includes(d));
    }).length;

    console.log(`Total: ${allJobs.length}`);
    console.log(`Matching Whitelist: ${filteredCount}`);
}

run();
