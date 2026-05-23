-- Apple Health records table
create table if not exists apple_health_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  record_type text not null,
  value numeric,
  unit text,
  start_date timestamptz not null,
  end_date timestamptz,
  source_name text
);

-- Index for fast lookups by type + date
create index if not exists idx_ahr_type_date on apple_health_records(record_type, start_date desc);
