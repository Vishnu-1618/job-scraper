-- Run this in your Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

create policy "Public Access"
on storage.objects for all
using ( bucket_id = 'resumes' )
with check ( bucket_id = 'resumes' );
