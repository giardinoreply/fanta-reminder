create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  installation_id text unique not null,
  expo_push_token text not null,
  timezone text not null,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists preferences (
  device_id uuid primary key references devices(id) on delete cascade,
  minutes_before int not null default 120,
  league_lock_minutes int not null default 15
);

create table if not exists matchdays (
  matchday int primary key,
  first_match_at timestamptz not null,
  first_home_team text not null,
  first_away_team text not null,
  updated_at timestamptz not null default now()
);

create table if not exists notifications_sent (
  id bigserial primary key,
  device_id uuid not null references devices(id) on delete cascade,
  matchday int not null,
  reminder_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique (device_id, matchday, reminder_at)
);
