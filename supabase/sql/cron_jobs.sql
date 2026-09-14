do $$
begin
  if exists(select 1 from cron.job where jobname = 'sync-serie-a-every-6h') then
    perform cron.unschedule('sync-serie-a-every-6h');
  end if;
  if exists(select 1 from cron.job where jobname = 'send-reminders-every-2m') then
    perform cron.unschedule('send-reminders-every-2m');
  end if;
end $$;

select cron.schedule(
  'sync-serie-a-every-6h',
  '0 */6 * * *',
  $$
  select net.http_post(
    url:='https://qnlkbhfqxctrvaztbbuy.supabase.co/functions/v1/sync_serie_a_matches',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

select cron.schedule(
  'send-reminders-every-2m',
  '*/2 * * * *',
  $$
  select net.http_post(
    url:='https://qnlkbhfqxctrvaztbbuy.supabase.co/functions/v1/send_due_notifications',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
