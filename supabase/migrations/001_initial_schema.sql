-- Body metrics table
create table if not exists body_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  bmi numeric(4,1),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  notes text
);

-- Workout logs table
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  exercise_name text not null,
  sets integer,
  reps integer,
  weight_kg numeric(6,2),
  duration_min integer,
  notes text
);

-- Nutrition logs table
create table if not exists nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  meal_name text,
  calories numeric(6,1),
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fats_g numeric(6,1),
  notes text
);

-- Sleep logs table
create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  duration_hours numeric(4,2),
  quality integer check (quality between 1 and 5),
  bed_time time,
  wake_time time,
  notes text
);

-- Todos table
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  description text,
  completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date date,
  category text
);

-- Disable RLS for single-user personal app
alter table body_metrics disable row level security;
alter table workout_logs disable row level security;
alter table nutrition_logs disable row level security;
alter table sleep_logs disable row level security;
alter table todos disable row level security;
