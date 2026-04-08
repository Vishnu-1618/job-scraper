import { create } from 'zustand';
import { getSavedJobIds, saveJob, unsaveJob, addViewedJob as lsAddViewedJob, getViewedJobs } from './localStorage';

export interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    posted_date: string;
    embedding?: any;
    // Extended fields
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    job_type?: string;
    experience_level?: string;
    is_remote?: boolean;
    similarity?: number;
    parsedDate?: Date | null;
    created_at?: string;
}

interface AppState {
    jobs: Job[];
    loading: boolean;
    filters: {
        search: string;
        location: string;
        job_type: string;
        experience_level: string;
        salary_min: number;
        is_remote: boolean;
        platform: string;
        date_posted: string;
    };
    savedJobIds: Set<number>;
    viewedJobs: Job[];
    setJobs: (jobs: Job[]) => void;
    addJob: (job: Job) => void;
    setLoading: (loading: boolean) => void;
    setFilters: (filters: Partial<AppState['filters']>) => void;
    toggleSave: (job: Job) => void;
    initSavedJobs: () => void;
    recordView: (job: Job) => void;
    initViewedJobs: () => void;
    activeResumeId: string | null;
    setActiveResumeId: (id: string | null) => void;
    clearActiveResume: () => void;
}

export const useStore = create<AppState>((set, get) => ({
    jobs: [],
    loading: false,
    filters: {
        search: '',
        location: '',
        job_type: '',
        experience_level: '',
        salary_min: 0,
        is_remote: false,
        platform: '',
        date_posted: '',
    },
    savedJobIds: new Set<number>(),
    viewedJobs: [],
    activeResumeId: null,

    setActiveResumeId: (id) => set({ activeResumeId: id }),
    clearActiveResume: () => set({ activeResumeId: null }),

    setJobs: (jobs) => set({ jobs }),
    addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
    setLoading: (loading) => set({ loading }),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

    /** Toggle saved state, syncing with localStorage */
    toggleSave: (job: Job) => {
        const current = get().savedJobIds;
        const newSet = new Set(current);
        if (newSet.has(job.id)) {
            newSet.delete(job.id);
            unsaveJob(job.id);
        } else {
            newSet.add(job.id);
            saveJob(job);
        }
        set({ savedJobIds: newSet });
    },

    /** Load saved IDs from localStorage on mount */
    initSavedJobs: () => {
        set({ savedJobIds: getSavedJobIds() });
    },

    /** Record a job view in history */
    recordView: (job: Job) => {
        lsAddViewedJob(job);
        const updated = getViewedJobs();
        set({ viewedJobs: updated });
    },

    /** Load viewed jobs from localStorage on mount */
    initViewedJobs: () => {
        set({ viewedJobs: getViewedJobs() });
    },
}));
