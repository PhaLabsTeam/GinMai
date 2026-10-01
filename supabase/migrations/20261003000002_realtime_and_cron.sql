-- Phase 8 backend audit, part 3: things the app expects that weren't on.

-- #71: the app subscribes to live changes on moments (map, seat counts) and
-- connections (the host's live screen), but the realtime publication had no
-- tables, so nothing ever arrived. Realtime applies each subscriber's read
-- rules, so people only get events for rows they could select anyway.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                  WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'moments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.moments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                  WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'connections') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
  END IF;
END $$;

-- #75: reports about deleted accounts are kept 12 months (#59, Privacy
-- Policy), but the purge job was never scheduled: pg_cron wasn't enabled when
-- 20261001000001 ran. Daily at 03:00 UTC; re-running updates the job.
SELECT cron.schedule('purge-expired-reports', '0 3 * * *', 'SELECT public.purge_expired_reports()');
