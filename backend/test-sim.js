const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data: resumes } = await supabase.from('resumes').select('id, user_id, embedding').order('created_at', { ascending: false }).limit(1);
    if (!resumes || resumes.length === 0) return;

    const resume = resumes[0];
    const { data: lowMatches } = await supabase.rpc('match_jobs', {
        query_embedding: resume.embedding,
        match_threshold: 0.0,
        match_count: 5
    });

    require('fs').writeFileSync('sim-scores.json', JSON.stringify(lowMatches, null, 2));
}
check();
