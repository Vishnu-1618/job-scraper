const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function fill() {
    // Get all unique users from resumes table
    const { data: resumes } = await supabase.from('resumes').select('*').order('created_at', { ascending: false });
    if (!resumes || resumes.length === 0) return;

    const processedUsers = new Set();

    for (const resume of resumes) {
        if (processedUsers.has(resume.user_id)) continue;
        processedUsers.add(resume.user_id);

        console.log(`Matching for user ${resume.user_id}...`);

        const { data: matches, error: matchError } = await supabase.rpc('match_jobs', {
            query_embedding: resume.embedding,
            match_threshold: 0.25,
            match_count: 100
        });

        if (matches && matches.length > 0) {
            const matchInserts = matches.map((job) => ({
                user_id: resume.user_id,
                job_id: job.id,
                similarity_score: job.similarity,
                status: 'new',
                created_at: new Date()
            }));

            const { error: insertError } = await supabase
                .from('job_matches')
                .upsert(matchInserts, { onConflict: 'user_id,job_id' });

            console.log(`Inserted ${matches.length} matches for ${resume.user_id}. Error:`, insertError);
        }
    }
}
fill();
