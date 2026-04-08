-- 05_create_job_matches_and_logs_tables.sql

-- Create scraping_logs table
CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    jobs_added INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_matches table for AI personalized matching
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    job_id BIGINT REFERENCES public.jobs(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON public.job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_platform ON public.scraping_logs(platform);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_created_at ON public.scraping_logs(created_at DESC);
