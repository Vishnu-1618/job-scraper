import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url_here';
const supabaseKey = process.env.SUPABASE_KEY || 'your_supabase_key_here';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing Supabase connection...');

const { data, error } = await supabase.from('jobs').select('id, title, url').limit(5);

if (error) {
    console.error('ERROR properties:', Object.getOwnPropertyNames(error));
    console.error('ERROR message:', error.message);
    console.error('ERROR code:', error.code);
    console.error('ERROR details:', error.details);
    console.error('ERROR hint:', error.hint);
    console.error('ERROR status:', error.status);
    console.error('Full error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
} else {
    console.log(`✅ Success! Got ${data.length} jobs:`);
    data.forEach(j => console.log(`  - [${j.id}] ${j.title}`));
}
