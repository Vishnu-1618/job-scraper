const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data: matches, error: mErr } = await supabase.from('job_matches').select('*').limit(5);
    console.log('Saved Job Matches:', matches, mErr);

    const { data: logs, error: lErr } = await supabase.from('scraping_logs').select('*').limit(5);
    console.log('Scraping Logs:', logs, lErr);
}
check();
