import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run queries in parallel
    const [
      totalCount,
      thirtyDaysCount,
      todayCount,
    ] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);

    // To estimate duplicates efficiently without downloading everything, 
    // we would actually do this via a SQL function or view. Since we can't create one right now,
    // we will rely on the dashboard dedup logic for exact numbers of user-facing duplicates.
    // However, we can fetch all jobs from the last 30 days to compute detailed backend stats.

    let recentJobs: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;

    // Fetch up to 5000 recent jobs for platform stats
    while (hasMore && page < 5) {
      const { data, error } = await supabase
        .from('jobs')
        .select('url, created_at')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        recentJobs = [...recentJobs, ...data];
        page++;
      } else {
        hasMore = false;
      }
    }

    let totalJobsAllTime = totalCount.count || 0;

    const platformMap = new Map<string, number>();
    (recentJobs || []).forEach(job => {
      let p = 'Other';
      if (job.url?.includes('linkedin.com')) p = 'LinkedIn';
      else if (job.url?.includes('indeed.')) p = 'Indeed';
      else if (job.url?.includes('glassdoor.')) p = 'Glassdoor';
      else if (job.url?.includes('naukri.com')) p = 'Naukri';
      platformMap.set(p, (platformMap.get(p) || 0) + 1);
    });

    const jobsPerPlatform = Array.from(platformMap.entries()).map(([label, count]) => ({ label, count }));

    return NextResponse.json({
      success: true,
      stats: {
        totalJobs: totalJobsAllTime,
        activeJobs: thirtyDaysCount.count || 0,
        jobsToday: todayCount.count || 0,
        jobsPerPlatform,
      }
    });

  } catch (error: any) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
