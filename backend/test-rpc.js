const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function check() {
    // Get latest resume
    const { data: resumes, error: rErr } = await supabase.from('resumes').select('id, user_id, embedding').order('created_at', { ascending: false }).limit(1);
    console.log('Latest Resume Error:', rErr);
    if (!resumes || resumes.length === 0) {
        console.log('No resumes found.');
        return;
    }

    const resume = resumes[0];
    console.log('Found resume for user:', resume.user_id);

    // Try RPC
    const { data: matches, error: mErr } = await supabase.rpc('match_jobs', {
        query_embedding: resume.embedding,
        match_threshold: 0.5,
        match_count: 5
    });

    console.log('RPC Error:', mErr);
    console.log('RPC Matches:', matches?.length);
    if (matches && matches.length > 0) {
        console.log('Top match similarity:', matches[0].similarity, 'Title:', matches[0].title);
        console.log('Lowest match similarity:', matches[matches.length - 1].similarity, 'Title:', matches[matches.length - 1].title);
    }

    // Try with very low threshold just to see what the actual similarities are
    const { data: lowMatches, error: lowErr } = await supabase.rpc('match_jobs', {
        query_embedding: resume.embedding,
        match_threshold: 0.0,
        match_count: 5
    });

    if (lowMatches && lowMatches.length > 0) {
        console.log('Low threshold Top match similarity:', lowMatches[0].similarity, 'Title:', lowMatches[0].title);
    } else {
        console.log('No matches even with threshold 0.0', lowErr);
    }
}
check();
