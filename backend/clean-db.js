const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function clean() {
    console.log('Cleaning up duplicate resumes...');

    // Get all resumes sorted by date (newest first)
    const { data: resumes } = await supabase.from('resumes').select('id, user_id').order('created_at', { ascending: false });
    if (!resumes) return;

    const seenUsers = new Set();
    const toDelete = [];

    for (const resume of resumes) {
        if (seenUsers.has(resume.user_id)) {
            toDelete.push(resume.id);
        } else {
            seenUsers.add(resume.user_id);
        }
    }

    console.log(`Found ${toDelete.length} old duplicate resumes to delete.`);

    if (toDelete.length > 0) {
        // Delete in batches or one by one
        for (const id of toDelete) {
            await supabase.from('resumes').delete().eq('id', id);
        }
        console.log('Successfully deleted duplicates.');
    } else {
        console.log('No duplicates found.');
    }
}

clean();
