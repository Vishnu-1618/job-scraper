const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url_here';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key_here';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('Attempting to create bucket "resumes"...');

    const { data, error } = await supabase
        .storage
        .createBucket('resumes', {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        });

    if (error) {
        console.log('Result:', error.message);
    } else {
        console.log('Success: Bucket created.');
    }

    // Attempt to upload a dummy file to verify
    const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload('test.txt', Buffer.from('test'), { upsert: true });

    if (uploadError) {
        console.log('Warning: Upload check failed (RLS might be blocking, but Service Role should bypass):', uploadError.message);
    } else {
        console.log('Upload verification successful.');
    }
}

main();
