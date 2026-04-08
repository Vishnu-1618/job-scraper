
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    console.log('Fetching col names and types for jobs...');
    const { data: cols, error: errCols } = await supabase.rpc('get_table_columns', { table_name: 'jobs' });
    if (errCols) {
        // Fallback: check one row again but with more detail
        const { data, error } = await supabase.from('jobs').select('*').limit(1);
        console.log('Fallback - One row of jobs:', data);
    } else {
        console.log('Jobs Columns:', cols);
    }

    console.log('Fetching col names and types for job_matches...');
    const { data: mCols, error: errMCols } = await supabase.rpc('get_table_columns', { table_name: 'job_matches' });
    if (errMCols) {
        const { data, error } = await supabase.from('job_matches').select('*').limit(1);
        console.log('Fallback - One row of matches:', data);
    } else {
        console.log('Match Columns:', mCols);
    }
}

checkSchema();
