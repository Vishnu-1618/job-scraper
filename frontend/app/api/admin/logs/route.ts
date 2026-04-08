import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: false, error: 'Database misconfiguration' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const source = searchParams.get('source') || '';

    // We will query the 'scraping_logs' table, or jobs if we don't have a specific logs table
    // For now, looking at the backend, there isn't a dedicated scraping_logs table being written to.
    // Instead we'll approximate logs or use a placeholder approach if a table doesn't exist, 
    // or we'll fetch real logs if it was created previously.

    // Attempt to select from scraping_logs
    let query = supabase
      .from('scraping_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (source) {
      query = query.ilike('source', `%${source}%`);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, logs: [], total: 0 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: count || 0,
    });

  } catch (error: any) {
    console.error('Logs API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
