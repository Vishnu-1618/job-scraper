-- Add a column to track if job URL is still valid
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);

-- Optional: Add a function to mark jobs as inactive
CREATE OR REPLACE FUNCTION mark_job_inactive(job_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET is_active = false WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;
