import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(supabaseUrl, supabaseKey);
