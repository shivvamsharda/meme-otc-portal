-- Unschedule the reconcile cron job if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'reconcile-deals-every-10-min'
  ) THEN
    PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'reconcile-deals-every-10-min' LIMIT 1));
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- pg_cron not installed; nothing to do
  NULL;
END $$;