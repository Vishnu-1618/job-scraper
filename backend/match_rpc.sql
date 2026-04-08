-- Create a function to search for jobs by embedding similarity
create or replace function match_jobs (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  company text,
  location text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    jobs.id,
    jobs.title,
    jobs.company,
    jobs.location,
    1 - (jobs.embedding <=> query_embedding) as similarity -- Cosine similarity
  from jobs
  where 1 - (jobs.embedding <=> query_embedding) > match_threshold
  order by jobs.embedding <=> query_embedding
  limit match_count;
end;
$$;
