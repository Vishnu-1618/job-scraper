// @ts-ignore
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || 'your_supabase_url_here',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key_here',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function initStorage() {
    console.log('Initializing Storage...');

    // 1. Create 'resumes' bucket
    const { data: bucket, error: bucketError } = await supabaseAdmin
        .storage
        .createBucket('resumes', {
            public: true, // Make public for download ease in this demo, usually private
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        });

    if (bucketError) {
        if (bucketError.message.includes('already exists')) {
            console.log('✅ Bucket "resumes" already exists.');
        } else {
            console.error('❌ Failed to create bucket:', bucketError);
        }
    } else {
        console.log('✅ Bucket "resumes" created successfully.');
    }

    // 2. Set simplified public upload policy (Note: In pure Postgres, this is done via SQL. 
    // Via API we might not be easily able to set RLS policies on storage.objects without SQL).
    // Ideally, generating a SQL script for the user to run in Supabase SQL editor is safer if API fails.
    // But let's try to verify if we can list it.
}

initStorage().catch(console.error);
