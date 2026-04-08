
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
