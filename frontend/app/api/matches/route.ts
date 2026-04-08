import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // --- Paginated Fetch to Remove Results Limit ---
        let allMatches: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore && allMatches.length < 5000) {
            const { data: batch, error } = await supabase
                .from('job_matches')
                .select(`
                    job_id,
                    similarity_score,
                    status,
                    created_at,
                    jobs!inner (
                        id,
                        title,
                        company,
                        location,
                        url,
                        description,
                        job_type,
                        is_remote,
                        posted_date,
                        created_at
                    )
                `)
                .eq('user_id', userId)
                .order('similarity_score', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('[API /api/matches] Supabase error:', error);
                if (allMatches.length > 0) break;
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            if (batch && batch.length > 0) {
                allMatches = [...allMatches, ...batch];
                page++;
                if (batch.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        // --- Filtering and Deduplication ---
        const seen = new Map<string, boolean>();
        const uniqueJobs: any[] = [];
        let duplicateCount = 0;

        for (const m of allMatches) {
            if (!m.jobs) continue;
            const job = m.jobs;

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

            // 3. Add to unique list
            uniqueJobs.push({
                ...job,
                similarity: m.similarity_score,
                match_status: m.status,
                matched_at: m.created_at,
            });
        }

        console.log(`[API /api/matches] Raw: ${allMatches.length}, Duplicates: ${duplicateCount}, Final: ${uniqueJobs.length}`);

        return NextResponse.json(
            { jobs: uniqueJobs, count: uniqueJobs.length },
            {
                headers: {
                    'Cache-Control': 'private, no-cache',
                },
            }
        );
    } catch (err: any) {
        console.error('Unhandled error in /api/matches:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
