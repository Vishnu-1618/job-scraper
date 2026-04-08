-- 06_create_resumes_table.sql

-- Enable pgvector extension if not already enabled (should be enabled from 03)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create resumes table for storing parsed resume text and embeddings
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(384),
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We do NOT enforce UNIQUE(user_id) if we want to allow users to upload multiple resumes, 
-- but if we only want one active resume per user, we can. 
-- For now, let's add an index to quickly find a user's latest resume:
CREATE INDEX IF NOT EXISTS idx_resumes_user_id_created_at ON public.resumes(user_id, created_at DESC);
