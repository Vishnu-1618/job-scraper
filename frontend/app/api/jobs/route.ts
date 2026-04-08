import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const job_type = searchParams.get('job_type') || '';
    const platform = searchParams.get('platform') || '';
    const is_remote = searchParams.get('is_remote') === 'true';

    try {
        let allJobs: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch up to 10000 jobs in batches
        while (hasMore && allJobs.length < 10000) {
            let query = supabase
                .from('jobs')
                .select('id,title,company,location,url,posted_date,created_at,job_type,is_remote,salary_min,salary_max,currency')
                .gte('created_at', THIRTY_DAYS_AGO)
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (search) {
                query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`);
            }
            if (location) {
                query = query.ilike('location', `%${location}%`);
            }
            if (is_remote) {
                query = query.eq('is_remote', true);
            }
            if (job_type) {
                query = query.ilike('job_type', `%${job_type}%`);
            }
            if (platform) {
                query = query.ilike('url', `%${platform}%`);
            }

            const { data: jobs, error, status } = await query;

            if (error) {
                console.error('[API /api/jobs] Supabase error:', status, error);
                if (allJobs.length > 0) break;
                return NextResponse.json({ error: `Supabase error ${status}: ${error.message}` }, { status: 500 });
            }

            if (jobs && jobs.length > 0) {
                allJobs = [...allJobs, ...jobs];
                page++;
                if (jobs.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // --- Server-side Deduplication ---
        const THIRTY_DAYS_AGO_MS = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const seen = new Map<string, boolean>();
        const uniqueJobs: any[] = [];
        let duplicateCount = 0;
        let oldJobCount = 0;

        for (const job of allJobs) {
            // 1. Double check Date Filter (just in case)
            const createdAt = job.created_at ? new Date(job.created_at).getTime() : 0;
            const postedAt = job.posted_date ? new Date(job.posted_date).getTime() : 0;
            const latestDate = Math.max(createdAt, postedAt);

            if (latestDate < THIRTY_DAYS_AGO_MS && latestDate > 0) {
                oldJobCount++;
                continue;
            }

            // 2. Deduplication
            const key = [
                (job.title || '').toLowerCase().trim(),
                (job.company || '').toLowerCase().trim(),
                (job.location || '').toLowerCase().trim(),
            ].join('|');

            if (seen.has(key)) {
                duplicateCount++;
                continue;
            }
            seen.set(key, true);
            uniqueJobs.push(job);
        }

        console.log(`[API /api/jobs] Raw: ${allJobs.length}, OldFiltered: ${oldJobCount}, Duplicates: ${duplicateCount}, Unique: ${uniqueJobs.length}`);
        
        return NextResponse.json(
            { jobs: uniqueJobs },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                },
            }
        );
    } catch (err: any) {
        console.error('[API /api/jobs] Catch error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
