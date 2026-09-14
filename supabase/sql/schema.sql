create extension if not exists pgcrypto;

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  installation_id text unique not null,
  expo_push_token text not null,
  timezone text not null,
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists preferences (
  device_id uuid primary key references devices(id) on delete cascade,
  minutes_before int not null default 120,
  league_lock_minutes int not null default 15,
  repeat_interval_minutes int not null default 3,
  max_extra_notifications int not null default 0,
  updated_at timestamptz not null default now()
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

create table if not exists matchday_dismissals (
  id bigserial primary key,
  device_id uuid not null references devices(id) on delete cascade,
  matchday int not null,
  dismissed_at timestamptz not null default now(),
  unique (device_id, matchday)
);

create index if not exists idx_devices_notifications_enabled on devices(notifications_enabled);
create index if not exists idx_matchdays_first_match_at on matchdays(first_match_at);
create index if not exists idx_notifications_sent_lookup on notifications_sent(device_id, matchday, reminder_at);
create index if not exists idx_matchday_dismissals_lookup on matchday_dismissals(device_id, matchday);
