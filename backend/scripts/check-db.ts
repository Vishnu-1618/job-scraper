
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkDB() {
    console.log('Checking Database...');
    const { count, error } = await supabase.from('jobs').select('*', { count: 'exact', head: true });

    if (error) {
        console.error('DB Check Failed:', error.message);
    } else {
        console.log(`Current Job Count in DB: ${count}`);
    }
}

checkDB();
