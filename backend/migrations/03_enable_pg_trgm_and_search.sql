-- 03_enable_pg_trgm_and_search.sql

-- Enable the pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on title and company for faster ILIKE and similarity queries
-- Using gin_trgm_ops for the trigram operations
CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx ON jobs USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS jobs_company_trgm_idx ON jobs USING GIN (company gin_trgm_ops);

-- Example query that this optimizes:
-- SELECT * FROM jobs WHERE title ILIKE '%engineer%' ORDER BY similarity(title, 'engineer') DESC;
