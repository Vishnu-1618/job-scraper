
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
    console.log('Fetching one row from jobs to see columns...');
    const { data, error } = await supabase.from('jobs').select('*').limit(1);
    
    if (error) {
        console.error('Error fetching job:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No jobs found in database.');
    }
}

checkColumns();
