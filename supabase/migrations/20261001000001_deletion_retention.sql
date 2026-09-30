-- What happens to data when an account is deleted (#59), so the Privacy
-- Policy can describe it truthfully.
--
-- 1. Reports survived nothing: reported_user_id was ON DELETE CASCADE, so a
--    reported person could delete their account, erase every report, and
--    sign up again. Reports now outlive the account (links set to NULL) and
--    keep the reported phone number, and are purged 12 months after the
--    reported account is gone.
-- 2. A deleted host's first name and note stayed on their past Moments.
--    delete_my_account now removes them.

-- 1. Reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_phone TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_account_deleted_at TIMESTAMPTZ;

UPDATE reports r SET reported_phone = u.phone
  FROM users u
 WHERE u.id = r.reported_user_id AND r.reported_phone IS NULL;

ALTER TABLE reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE reports ALTER COLUMN reported_user_id DROP NOT NULL;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE reports ADD CONSTRAINT reports_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;
ALTER TABLE reports ADD CONSTRAINT reports_reported_user_id_fkey
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Record the reported phone at report time (users can't read others' phones)
CREATE OR REPLACE FUNCTION public.set_reported_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reported_phone IS NULL AND NEW.reported_user_id IS NOT NULL THEN
    SELECT phone INTO NEW.reported_phone FROM users WHERE id = NEW.reported_user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_reported_phone ON reports;
CREATE TRIGGER set_reported_phone
  BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION public.set_reported_phone();

-- Remove reports 12 months after the reported account was deleted.
-- Scheduled daily below when pg_cron is enabled; otherwise run it by hand.
CREATE OR REPLACE FUNCTION public.purge_expired_reports()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM reports
   WHERE reported_account_deleted_at IS NOT NULL
     AND reported_account_deleted_at < now() - interval '12 months';
$$;
REVOKE ALL ON FUNCTION public.purge_expired_reports() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('purge-expired-reports', '0 3 * * *', 'SELECT public.purge_expired_reports()');
  END IF;
END $$;

-- 2. Account deletion
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  UPDATE moments
     SET status = 'cancelled', updated_at = now()
   WHERE host_id = uid
     AND status IN ('active', 'full');

  -- The host's name and note go; time and place stay for guests' history
  UPDATE moments
     SET host_name = 'Former member', note = NULL, updated_at = now()
   WHERE host_id = uid;

  UPDATE moments m
     SET seats_taken = GREATEST(m.seats_taken - 1, 0),
         status = CASE WHEN m.status = 'full' THEN 'active' ELSE m.status END,
         updated_at = now()
   WHERE m.status IN ('active', 'full')
     AND m.id IN (
       SELECT c.moment_id FROM connections c
        WHERE c.user_id = uid AND c.status IN ('confirmed', 'arrived')
     );

  -- Start the 12-month clock on reports about this person
  UPDATE reports SET reported_account_deleted_at = now()
   WHERE reported_user_id = uid;

  DELETE FROM public.users WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
