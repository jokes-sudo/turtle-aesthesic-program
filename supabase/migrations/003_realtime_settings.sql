-- Settings table (stores webhook API key and user prefs)
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Auto-generate a webhook API key on first run
insert into settings (key, value)
values ('webhook_api_key', gen_random_uuid()::text)
on conflict (key) do nothing;

-- Enable Supabase Realtime on apple_health_records so the dashboard
-- updates instantly when the iOS Shortcut pushes new readings
alter publication supabase_realtime add table apple_health_records;
