-- Enable required extensions (safe if they already exist)
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Schedule periodic reconciliation every 10 minutes
select
  cron.schedule(
    'reconcile-deals-every-10-min',
    '*/10 * * * *',
    $$
    select
      net.http_post(
        url := 'https://ebmiuqrdzzdliupgcqsy.supabase.co/functions/v1/reconcile-deals',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibWl1cXJkenpkbGl1cGdjcXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzYyNzQsImV4cCI6MjA2ODUxMjI3NH0.Ayq9GzSfcpERcoXSE2xu7Gk4GZQp94wRqPpe7e8bPq8"}'::jsonb,
        body := '{}'::jsonb
      );
    $$
  );