import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const parseJobDate = (dateString: string | undefined | null): Date | null => {
    if (!dateString) return null;

    const now = new Date();
    const lowerDate = dateString.toLowerCase();

    // Handle "Just now", "Today"
    if (lowerDate.includes('just now') || lowerDate.includes('today')) {
        return now;
    }

    // Handle "Yesterday"
    if (lowerDate.includes('yesterday')) {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        return d;
    }

    // specific relative patterns: "3 days ago", "1 month ago", "2 weeks ago"
    const match = lowerDate.match(/(\d+)\s+(minute|hour|day|week|month)s?\s+ago/);
    if (match) {
        const amount = parseInt(match[1], 10);
        const unit = match[2];
        const d = new Date(now);

        switch (unit) {
            case 'minute':
                d.setMinutes(d.getMinutes() - amount);
                break;
            case 'hour':
                d.setHours(d.getHours() - amount);
                break;
            case 'day':
                d.setDate(d.getDate() - amount);
                break;
            case 'week':
                d.setDate(d.getDate() - (amount * 7));
                break;
            case 'month':
                d.setDate(d.getDate() - (amount * 30)); // approx
                break;
        }
        return d;
    }

    // Handle "Active 3 days ago" pattern often found in LinkedIn
    const activeMatch = lowerDate.match(/active\s+(\d+)\s+(day|week|month)s?\s+ago/);
    if (activeMatch) {
        const amount = parseInt(activeMatch[1], 10);
        const unit = activeMatch[2];
        const d = new Date(now);

        switch (unit) {
            case 'day':
                d.setDate(d.getDate() - amount);
                break;
            case 'week':
                d.setDate(d.getDate() - (amount * 7));
                break;
            case 'month':
                d.setDate(d.getDate() - (amount * 30));
                break;
        }
        return d;
    }


    // Try parsing as standard date
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    return null;
};


// Helper to find date string in text
export const extractDateString = (text: string | null | undefined): string | null => {
    if (!text) return null;

    // Look for absolute dates FIRST (e.g., 07/11/2016, 2016-11-07, Nov 7, 2016)
    // DD/MM/YYYY or MM/DD/YYYY
    const dateSlash = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/;
    const matchSlash = text.match(dateSlash);
    if (matchSlash) return matchSlash[0];

    // YYYY-MM-DD
    const dateDash = /\b\d{4}-\d{1,2}-\d{1,2}\b/;
    const matchDash = text.match(dateDash);
    if (matchDash) return matchDash[0];

    // Nov 7, 2016 or November 7, 2016
    const dateText = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i;
    const matchText = text.match(dateText);
    if (matchText) return matchText[0];

    // Look for patterns like "3 days ago", "1 month ago"
    const relativePattern = /(\d+\s+(minute|hour|day|week|month)s?\s+ago)/i;
    const match = text.match(relativePattern);
    if (match) return match[0];

    // Look for loose patterns ONLY if they are very short or clearly date-related
    // Avoid matching "Apply today" or "Start today"
    // We check if the text is SHORT (likely a badge) or contains "Posted"
    if (/^just now$/i.test(text.trim()) || /posted just now/i.test(text)) return "Just now";
    if (/^today$/i.test(text.trim()) || /posted today/i.test(text) || /new\s*$/i.test(text)) return "Today";
    if (/^yesterday$/i.test(text.trim()) || /posted yesterday/i.test(text)) return "Yesterday";

    // Look for specific relative patterns often in description footer like "Posted 3 days ago"
    const postedPattern = /posted\s+(\d+\s+(day|week|month)s?\s+ago)/i;
    const postedMatch = text.match(postedPattern);
    if (postedMatch) return postedMatch[1];

    return null;
}

export const isJobFresh = (jobDate: Date | null, days: number = 30): boolean => {
    if (!jobDate) return false; // If we can't parse a date, treat as old/unknown.

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return jobDate >= cutoff;
};

export function deduplicateAndFilter(rawJobs: any[], sortBySimilarity = false): any[] {
    const THIRTY_DAYS_AGO = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const seen = new Map<string, true>();
    const result: any[] = [];

    let domainFiltered = 0;
    let duplicateCount = 0;

    for (const job of rawJobs) {
        if (!job.url) continue;
        try { new URL(job.url); } catch { continue; }

        const dateStr = extractDateString(job.location) || extractDateString(job.description);
        const parsedDate = parseJobDate(dateStr || job.posted_date);

        // Filter by platform
        const allowedDomains = ['linkedin.com', 'indeed.', 'glassdoor.', 'naukri.com'];
        if (!allowedDomains.some(d => job.url?.toLowerCase().includes(d))) {
            domainFiltered++;
            continue;
        }

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

        result.push({ ...job, parsedDate });
    }

    console.log(`[UTILS] Dedup Summary: Input=${rawJobs.length}, DomainFiltered=${domainFiltered}, Duplicates=${duplicateCount}, Final=${result.length}`);

    if (sortBySimilarity) {
        return result.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    }

    return result.sort((a, b) => {
        const da = a.parsedDate || (a.created_at ? new Date(a.created_at) : new Date(0));
        const db = b.parsedDate || (b.created_at ? new Date(b.created_at) : new Date(0));
        return db.getTime() - da.getTime();
    });
}
