-- Enhanced match function that returns full job details with similarity scores
create or replace function match_jobs_for_user (
  user_id text
)
returns table (
  id bigint,
  title text,
  company text,
  location text,
  description text,
  url text,
  posted_date timestamp with time zone,
  salary_min numeric,
  salary_max numeric,
  currency text,
  job_type text,
  experience_level text,
  is_remote boolean,
  similarity float
)
language plpgsql
as $$
declare
  user_embedding vector(384);
begin
  -- Get user's resume embedding
  select embedding into user_embedding
  from resumes
  where resumes.user_id = match_jobs_for_user.user_id
  order by created_at desc
  limit 1;

  -- If no embedding found, return empty
  if user_embedding is null then
    return;
  end if;

  -- Return matched jobs with full details
  return query
  select
    jobs.id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.description,
    jobs.url,
    jobs.posted_date,
    jobs.salary_min,
    jobs.salary_max,
    jobs.currency,
    jobs.job_type,
    jobs.experience_level,
    jobs.is_remote,
    (1 - (jobs.embedding <=> user_embedding))::float as similarity
  from jobs
  where jobs.embedding is not null
    and (1 - (jobs.embedding <=> user_embedding)) > 0.5  -- 50% similarity threshold
  order by jobs.embedding <=> user_embedding
  limit 50;
end;
$$;

-- Original match function for direct embedding queries
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
  description text,
  url text,
  posted_date timestamp with time zone,
  salary_min numeric,
  salary_max numeric,
  currency text,
  job_type text,
  experience_level text,
  is_remote boolean,
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
    jobs.description,
    jobs.url,
    jobs.posted_date,
    jobs.salary_min,
    jobs.salary_max,
    jobs.currency,
    jobs.job_type,
    jobs.experience_level,
    jobs.is_remote,
    (1 - (jobs.embedding <=> query_embedding))::float as similarity
  from jobs
  where jobs.embedding is not null
    and (1 - (jobs.embedding <=> query_embedding)) > match_threshold
  order by jobs.embedding <=> query_embedding
  limit match_count;
end;
$$;
