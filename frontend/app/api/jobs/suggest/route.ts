import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase credentials in environment variables.");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Perform similarity search using pg_trgm (this requires pg_trgm extension to be enabled)
        // If the extension or index is not available, this query will still work via standard ILIKE or trigger an error if 'similarity' is not found.
        // We'll use standard RPC if `similarity` isn't available, but let's try direct SQL via RPC for best results, or just ILIKE.
        // Since Supabase JS doesn't support raw SQL string queries easily without RPC, and `ilike` is supported:
        // A better approach for autocomplete without raw SQL is using `ilike` on title/company

        // For a true fuzzy search, we should use an RPC, but we can do a broad `ilike` for now if RPC isn't created yet by the user.
        // We will try an RPC first if you created one, otherwise fallback to ilike. Let's stick to ILIKE for robustness if the user hasn't run the migration yet.

        const { data, error } = await supabase
            .from('jobs')
            .select('title, company')
            .or(`title.ilike.%${query}%,company.ilike.%${query}%`)
            .limit(10);

        if (error) {
            console.error('Search Suggestion Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Deduplicate suggestions based on Title
        const seen = new Set<string>();
        const suggestions: string[] = [];

        data?.forEach(job => {
            const title = job.title?.trim();
            if (title && !seen.has(title.toLowerCase())) {
                seen.add(title.toLowerCase());
                suggestions.push(title);
            }
        });

        // Optionally, mix in some company names if they matched the query well
        data?.forEach(job => {
            const company = job.company?.trim();
            if (company && company.toLowerCase().includes(query.toLowerCase()) && !seen.has(company.toLowerCase())) {
                seen.add(company.toLowerCase());
                suggestions.push(company);
            }
        });

        return NextResponse.json({ suggestions: suggestions.slice(0, 8) });

    } catch (error: any) {
        console.error('Unhandled Search Suggestion Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
