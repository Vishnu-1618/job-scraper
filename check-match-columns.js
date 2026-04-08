
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
    console.log('Fetching one row from job_matches to see columns...');
    const { data, error } = await supabase.from('job_matches').select('*').limit(1);
    
    if (error) {
        console.error('Error fetching job_matches:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No job_matches found in database.');
    }
}

checkColumns();
