-- Migration V2: Add columns for Recommendation System

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS salary_min integer,
ADD COLUMN IF NOT EXISTS salary_max integer,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS job_type text, -- 'full-time', 'contract', 'internship', 'freelance'
ADD COLUMN IF NOT EXISTS experience_level text, -- 'entry', 'mid', 'senior', 'fresher'
ADD COLUMN IF NOT EXISTS is_remote boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS external_id text;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_salary_min ON public.jobs(salary_min);
CREATE INDEX IF NOT EXISTS idx_jobs_is_remote ON public.jobs(is_remote);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON public.jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_external_id ON public.jobs(external_id);
