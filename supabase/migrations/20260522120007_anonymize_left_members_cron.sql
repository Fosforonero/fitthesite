CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.anonymize_left_members() RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  WITH anonymized AS (
    UPDATE public.group_members
    SET display_name = 'Ex membro',
        share_settings = '{"preset":"none","anonymized":true}'::jsonb
    WHERE left_at IS NOT NULL
      AND left_at < now() - interval '30 days'
      AND share_settings->>'anonymized' IS DISTINCT FROM 'true'
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM anonymized;
  RETURN v_count;
END $$;

-- Schedule via pg_cron — daily at 03:15 UTC (~04:15 IT)
SELECT cron.schedule(
  'anonymize_left_members_daily',
  '15 3 * * *',
  $$ SELECT private.anonymize_left_members(); $$
);
