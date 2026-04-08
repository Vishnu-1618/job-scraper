import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testDb() {
    console.log('Testing Supabase Connection...');
    const { data: jobs, error } = await supabase.from('jobs').select('count');
    if (error) {
        console.error('❌ Database connection failed:', error.message);
        return;
    }
    console.log('✅ Database connected. Current job count:', jobs);

    const testJob = {
        title: 'Diagnostic Test Job',
        company: 'Test Co',
        location: 'Remote',
        description: 'Test Description',
        url: `https://test.com/${Date.now()}`,
        embedding: new Array(384).fill(0),
        created_at: new Date()
    };

    console.log('Attempting to insert test job...');
    const { error: insertError } = await supabase.from('jobs').insert(testJob);
    if (insertError) {
        console.error('❌ Insert failed:', insertError.message);
    } else {
        console.log('✅ Test job inserted successfully!');
    }
}

testDb();
