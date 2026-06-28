-- SUVIDHA Kiosk — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Submissions (from CloudSyncManager)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  tracking_id text unique not null,
  org text not null check (org in ('electricity','gas','municipal','healthcare','sanitation','transport','water','complaint','general')),
  ref_id text not null,
  receipt_type text,
  consumer_name text,
  submitted_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Documents (QR upload metadata)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null references submissions(tracking_id) on delete cascade,
  file_name text not null,
  file_size_bytes bigint,
  mime_type text,
  storage_path text,
  uploaded_at timestamptz default now()
);

-- NDMA alerts cache (optional — for cross-kiosk sync)
create table if not exists ndma_alerts (
  identifier text primary key,
  headline text not null,
  description text,
  severity text,
  urgency text,
  areas text[],
  effective_at timestamptz,
  expires_at timestamptz,
  fetched_at timestamptz default now()
);

-- Enable Row Level Security (anon key can only INSERT, not read others)
alter table submissions enable row level security;
alter table documents enable row level security;
alter table ndma_alerts enable row level security;

-- Policy: anyone with anon key can insert submissions
drop policy if exists "kiosk can insert submissions" on submissions;
create policy "kiosk can insert submissions"
  on submissions for insert
  to anon
  with check (true);

-- Policy: anyone with anon key can insert documents
drop policy if exists "kiosk can insert documents" on documents;
create policy "kiosk can insert documents"
  on documents for insert
  to anon
  with check (true);

-- Policy: anyone can read ndma_alerts
drop policy if exists "public can read ndma alerts" on ndma_alerts;
create policy "public can read ndma alerts"
  on ndma_alerts for select
  to anon
  using (true);

-- Policy: service role can upsert ndma_alerts (for server-side fetch)
drop policy if exists "service can upsert ndma alerts" on ndma_alerts;
create policy "service can upsert ndma alerts"
  on ndma_alerts for all
  to service_role
  using (true);
