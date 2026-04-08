
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function clearData() {
    console.log('Clearing JOBS and MATCHES data...');

    // Clear matches first due to foreign key constraints
    const { error: matchError } = await supabase.from('job_matches').delete().neq('id', 0);
    if (matchError) console.error('Error clearing matches:', matchError.message);
    else console.log('✅ Matches cleared.');

    const { error: jobError } = await supabase.from('jobs').delete().neq('id', 0);
    if (jobError) console.error('Error clearing jobs:', jobError.message);
    else console.log('✅ Jobs cleared.');
}

clearData();
