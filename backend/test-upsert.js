const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function check() {
    const userId = 'user_1772677944946';

    const { data: resumes } = await supabase.from('resumes').select('id, user_id, embedding').eq('user_id', userId).limit(1);
    if (!resumes || resumes.length === 0) return;
    const embedding = resumes[0].embedding;

    const { data: matches, error: matchError } = await supabase.rpc('match_jobs', {
        query_embedding: embedding,
        match_threshold: 0.25,
        match_count: 5
    });

    console.log('RPC Error:', matchError);
    console.log('Matches returned:', matches?.length);

    if (matches && matches.length > 0) {
        const matchInserts = matches.map((job) => ({
            user_id: userId,
            job_id: job.id,
            similarity_score: job.similarity,
            status: 'new',
            created_at: new Date()
        }));

        const { error: insertError } = await supabase
            .from('job_matches')
            .upsert(matchInserts, { onConflict: 'user_id,job_id' });

        console.log('Insert Error:', insertError);
    }
}
check();
