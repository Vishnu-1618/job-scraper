-- 04_create_match_jobs_rpc.sql

-- Creates a function to perform vector similarity search using pgvector
-- This assumes the jobs table has an `embedding` column of type `vector(384)` (or matching dimension)

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
