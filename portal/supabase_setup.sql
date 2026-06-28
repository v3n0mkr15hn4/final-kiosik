-- SUVIDHA Portal — run in Supabase Dashboard → SQL Editor
-- Run AFTER supabase_schema.sql (which creates submissions + documents tables)

-- ── 0. Expand org CHECK constraint — the live table only allowed
--      electricity/gas/municipal. Healthcare, sanitation, transport, water,
--      and general complaints were silently rejected at insert time (the
--      app's error handling then fell back to the offline queue, so these
--      submissions never reached Supabase or the portal). ────────────────
alter table submissions drop constraint if exists submissions_org_check;
alter table submissions add constraint submissions_org_check
  check (org in ('electricity','gas','municipal','healthcare','sanitation','transport','water','complaint','general'));

-- ── 1. Token table (for QR upload verification) ────────────────────────────
create table if not exists upload_tokens (
  token      text primary key,
  tracking_id text not null,
  org        text not null check (org in ('electricity','gas','municipal','healthcare','sanitation','transport','water','complaint','general')),
  expires_at timestamptz not null,
  used       boolean default false,
  created_at timestamptz default now()
);

alter table upload_tokens enable row level security;

-- Kiosk app (anon) can insert tokens
drop policy if exists "kiosk insert upload tokens" on upload_tokens;
create policy "kiosk insert upload tokens"
  on upload_tokens for insert to anon
  with check (true);

-- Portal (anon) can read tokens to verify
drop policy if exists "portal read upload tokens" on upload_tokens;
create policy "portal read upload tokens"
  on upload_tokens for select to anon
  using (true);

-- Portal (anon) can mark token used
drop policy if exists "portal update upload tokens" on upload_tokens;
create policy "portal update upload tokens"
  on upload_tokens for update to anon
  using (true);

-- ── 2. Add storage_path to documents if missing ────────────────────────────
alter table documents add column if not exists storage_path text;
alter table documents add column if not exists public_url text;

-- ── 2b. Portal read access ──────────────────────────────────────────────────
-- supabase_schema.sql only grants anon INSERT on submissions/documents.
-- The portal dashboard (index.html) queries these tables directly via
-- .select('*, documents(*)') — without a SELECT policy that query returns
-- empty under RLS even with valid rows present. Add it here.
drop policy if exists "portal read submissions" on submissions;
create policy "portal read submissions"
  on submissions for select to anon
  using (true);

drop policy if exists "portal read documents" on documents;
create policy "portal read documents"
  on documents for select to anon
  using (true);

-- ── 3. Storage bucket ──────────────────────────────────────────────────────
-- Run this separately if the Storage SQL API is available:
-- (In Supabase dashboard → Storage → New Bucket → name: uploads, public: true)
--
-- OR uncomment and run (10MB limit — if you already created the bucket via
-- the dashboard with the old 5MB default, run the UPDATE below instead):
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('uploads', 'uploads', true, 10485760, array['image/jpeg','image/jpg','image/png'])
-- on conflict (id) do nothing;

-- If the bucket already exists with the old 5MB limit, run this to bump it:
-- update storage.buckets set file_size_limit = 10485760 where id = 'uploads';

-- ── 4. Storage RLS (run AFTER creating bucket) ────────────────────────────
-- create policy "anon upload to uploads"
--   on storage.objects for insert to anon
--   with check (bucket_id = 'uploads');

-- create policy "public read uploads"
--   on storage.objects for select to anon
--   using (bucket_id = 'uploads');

-- ── 5. Useful view for portal dashboard ───────────────────────────────────
create or replace view submissions_with_docs as
select
  s.*,
  count(d.id) as doc_count,
  array_agg(d.file_name) filter (where d.file_name is not null) as doc_files
from submissions s
left join documents d on d.tracking_id = s.tracking_id
group by s.id, s.tracking_id, s.org, s.ref_id, s.receipt_type,
         s.consumer_name, s.submitted_at, s.created_at;

-- Allow anon to read the view
grant select on submissions_with_docs to anon;
