const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
async function check() {
    const { data: resumes, error: rErr } = await supabase.from('resumes').select('id, user_id, file_path').limit(5);
    console.log('Resumes:', resumes, rErr);
    const { data: errors, error: eErr } = await supabase.from('scraping_logs').select('*').limit(5);
    console.log('Logs:', errors, eErr);
}
check();
