import { Job } from './store';

// ─── SSR-safe storage helper ─────────────────────────────────────────────────
const isClient = typeof window !== 'undefined';

function getLS<T>(key: string, fallback: T): T {
    if (!isClient) return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function setLS<T>(key: string, value: T): void {
    if (!isClient) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage full or unavailable – silently ignore
    }
}

// ─── Keys ────────────────────────────────────────────────────────────────────
const SAVED_JOBS_KEY = 'jb_savedJobs';
const VIEWED_JOBS_KEY = 'jb_viewedJobs';
const SEARCH_STATE_KEY = 'jb_searchState';

// ─── Saved Jobs ───────────────────────────────────────────────────────────────
/** Returns a Set of saved job IDs */
export function getSavedJobIds(): Set<number> {
    const arr = getLS<number[]>(SAVED_JOBS_KEY, []);
    return new Set(arr);
}

/** Returns a full array of saved Job objects (need to merge with live data) */
export function getSavedJobs(): Job[] {
    return getLS<Job[]>(`${SAVED_JOBS_KEY}_data`, []);
}

export function saveJob(job: Job): void {
    const ids = getSavedJobIds();
    if (ids.has(job.id)) return; // already saved
    ids.add(job.id);
    setLS(SAVED_JOBS_KEY, Array.from(ids));

    const saved = getSavedJobs();
    if (!saved.find(j => j.id === job.id)) {
        setLS(`${SAVED_JOBS_KEY}_data`, [job, ...saved]);
    }
}

export function unsaveJob(jobId: number): void {
    const ids = getSavedJobIds();
    ids.delete(jobId);
    setLS(SAVED_JOBS_KEY, Array.from(ids));

    const saved = getSavedJobs().filter(j => j.id !== jobId);
    setLS(`${SAVED_JOBS_KEY}_data`, saved);
}

export function isJobSaved(jobId: number): boolean {
    return getSavedJobIds().has(jobId);
}

// ─── Recently Viewed Jobs ─────────────────────────────────────────────────────
const MAX_VIEWED = 10;

export function getViewedJobs(): Job[] {
    return getLS<Job[]>(VIEWED_JOBS_KEY, []);
}

export function addViewedJob(job: Job): void {
    const viewed = getViewedJobs().filter(j => j.id !== job.id); // deduplicate
    const updated = [job, ...viewed].slice(0, MAX_VIEWED);
    setLS(VIEWED_JOBS_KEY, updated);
}

// ─── Search / Filter State ────────────────────────────────────────────────────
export interface SearchState {
    search: string;
    location: string;
    job_type: string;
    experience_level: string;
    salary_min: number;
    is_remote: boolean;
    platform: string;
    date_posted: string;
}

export function getSearchState(): SearchState | null {
    return getLS<SearchState | null>(SEARCH_STATE_KEY, null);
}

export function saveSearchState(state: SearchState): void {
    setLS(SEARCH_STATE_KEY, state);
}
