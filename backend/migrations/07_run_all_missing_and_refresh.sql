-- 07_run_all_missing_and_refresh.sql

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create Required Tables (If they don't exist)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(384),
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    job_id BIGINT REFERENCES public.jobs(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS public.scraping_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    jobs_added INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create or Replace the Match Jobs RPC Layer
CREATE OR REPLACE FUNCTION match_jobs(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  title text,
  company text,
  location text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    jobs.id,
    jobs.title,
    jobs.company,
    jobs.location,
    -- Calculate cosine similarity (1 - cosine distance)
    1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM jobs
  WHERE 1 - (jobs.embedding <=> query_embedding) > match_threshold
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4. Force Supabase PostgREST API to flush its schema cache
-- This ensures that the newly created tables and RPC functions are immediately available to the frontend API
NOTIFY pgrst, 'reload schema';
