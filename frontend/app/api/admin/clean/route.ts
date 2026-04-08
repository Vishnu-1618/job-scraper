import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Lazily initialize inside the handler to prevent Vercel SSG failing when env vars are missing at build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: false, error: 'Database misconfiguration' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action } = await request.json();

    if (action === 'clean_old') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('jobs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select('id');

      if (error) throw error;
      return NextResponse.json({ success: true, count: data?.length || 0, message: `Removed ${data?.length || 0} old jobs.` });
    }

    if (action === 'remove_dupes') {
      // Due to PostgREST limitations without custom functions, deleting duplicates 
      // optimally requires fetching the IDs and deleting them. 
      // Fetching all jobs to identify duplicates:
      const { data: allJobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id, title, company, location');
      
      if (fetchError) throw fetchError;

      const seen = new Set<string>();
      const duplicateIds: number[] = [];

      for (const job of allJobs || []) {
        const key = `${(job.title || '').trim().toLowerCase()}|${(job.company || '').trim().toLowerCase()}|${(job.location || '').trim().toLowerCase()}`;
        if (seen.has(key)) {
          duplicateIds.push(job.id);
        } else {
          seen.add(key);
        }
      }

      if (duplicateIds.length > 0) {
        // Delete in batches if necessary
        const chunks = [];
        for (let i = 0; i < duplicateIds.length; i += 1000) {
          chunks.push(duplicateIds.slice(i, i + 1000));
        }

        let totalDeleted = 0;
        for (const chunk of chunks) {
          const { error: delError } = await supabase.from('jobs').delete().in('id', chunk);
          if (delError) throw delError;
          totalDeleted += chunk.length;
        }

        return NextResponse.json({ success: true, count: totalDeleted, message: `Removed ${totalDeleted} duplicate jobs.` });
      }

      return NextResponse.json({ success: true, count: 0, message: `No duplicate jobs found.` });
    }

    if (action === 'reset') {
       const { error } = await supabase.from('jobs').delete().neq('id', 0); // Hack to delete all via PostgREST
       if (error) throw error;
       return NextResponse.json({ success: true, message: 'Database reset successful.' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Clean API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
