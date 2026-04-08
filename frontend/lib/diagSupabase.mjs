import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'your_supabase_url_here',
    process.env.SUPABASE_KEY || 'your_supabase_key_here'
);

try {
    const { data, error, status, statusText } = await supabase.from('jobs').select('id, title, created_at').limit(3);

    console.log('STATUS:', status, statusText);

    if (error) {
        console.log('ERROR FOUND:');
        console.log('  message:', error.message);
        console.log('  code:', error.code);
        console.log('  details:', error.details);
        console.log('  hint:', error.hint);
    } else {
        console.log('SUCCESS! Row count:', data.length);
        data.forEach(r => console.log('  Row:', r.id, r.title, r.created_at));
    }
} catch (e) {
    console.log('CAUGHT EXCEPTION:', e.message);
    console.log('Stack:', e.stack);
}
