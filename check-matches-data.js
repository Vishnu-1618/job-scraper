
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMatches() {
    console.log('Checking recent entries in job_matches...');
    const { data, error } = await supabase.from('job_matches').select('*').limit(5).order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching job_matches:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Recent matches:', data);
    } else {
        console.log('No job_matches found.');
    }
}

checkMatches();
