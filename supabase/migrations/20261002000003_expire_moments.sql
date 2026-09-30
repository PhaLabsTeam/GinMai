-- Close Moments that have ended. expire_moments() existed since the first
-- migration but was never scheduled, and it skipped full tables, so ended
-- Moments stayed "active" or "full" forever (19 back to January). The app
-- hid them by expires_at, but signed-out visitors could still read them (#60).
--
-- Marking a Moment completed sends nothing: only cancellations notify guests.
-- The protect_seats trigger allows this (it only guards full <-> active).

CREATE OR REPLACE FUNCTION public.expire_moments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE moments
     SET status = 'completed', updated_at = now()
   WHERE status IN ('active', 'full')
     AND expires_at < now();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_moments() FROM PUBLIC, anon, authenticated;

-- Every 5 minutes; re-running this file updates the job instead of adding one
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('expire-moments', '*/5 * * * *', 'SELECT public.expire_moments()');
  ELSE
    RAISE WARNING 'pg_cron is not enabled: ended Moments will not be closed';
  END IF;
END $$;

-- Close the backlog now
SELECT public.expire_moments() AS moments_closed;
