
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkJobs() {
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) {
        console.error('Error fetching jobs:', error);
    } else {
        console.log(`Found ${data.length} jobs.`);
        if (data.length > 0) {
            console.log('Sample jobs:', data.slice(0, 2));
        }
    }
}

checkJobs();
