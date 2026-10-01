-- Phase 8 backend audit, part 1: who can write what (#64-#68, #70).
-- Findings: docs/backend/access-matrix.md. Checks: app/scripts/security-check.mjs.
--
-- Pattern: every table gets
--   1. only the column privileges the app uses (REVOKE ALL first; RLS doesn't
--      limit columns, and TRUNCATE ignores RLS)
--   2. one policy per action, for `authenticated` (or `anon` where meant),
--      calling (select auth.uid()) once per query instead of once per row
--   3. a trigger for rules policies can't express (status changes, who may
--      give feedback about whom, server-set fields)
-- Guards that must limit the app but not server functions run as the caller
-- and check `current_user = 'authenticated'`: inside a SECURITY DEFINER
-- function (delete_my_account, cron, seat sync) current_user is the owner.

-- ===========================================================================
-- 0. Start from nothing: no table privileges for app roles
-- ===========================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
-- New tables and functions get nothing until granted on purpose
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Drop every policy on the tables rewritten here (live names differ from the repo)
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN ('moments', 'connections', 'users', 'feedback', 'reports', 'blocks', 'eat_again_matches')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- ===========================================================================
-- 1. moments (#64): hosts create and cancel; the server sets name and expiry
-- ===========================================================================
GRANT SELECT ON public.moments TO anon, authenticated;
GRANT INSERT (host_id, host_name, starts_at, expires_at, duration, lat, lng,
              place_name, area_name, seats_total, seats_taken, note, status)
  ON public.moments TO authenticated;
GRANT UPDATE (status) ON public.moments TO authenticated;

CREATE POLICY "Visitors see open moments" ON public.moments
  FOR SELECT TO anon
  USING (status IN ('active', 'full'));

CREATE POLICY "Members see open, own and joined moments" ON public.moments
  FOR SELECT TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR id IN (SELECT public.my_moment_ids())
    OR (status IN ('active', 'full') AND host_id NOT IN (SELECT public.my_blocked_user_ids()))
  );

CREATE POLICY "Members create their own moments" ON public.moments
  FOR INSERT TO authenticated
  WITH CHECK (host_id = (SELECT auth.uid()));

CREATE POLICY "Hosts update their own moments" ON public.moments
  FOR UPDATE TO authenticated
  USING (host_id = (SELECT auth.uid()))
  WITH CHECK (host_id = (SELECT auth.uid()));

-- Server-set fields and allowed status changes. Runs alongside protect_seats.
-- Runs as the caller (not SECURITY DEFINER): current_user is then
-- 'authenticated' for the app and the owner inside server functions
-- (seat sync, delete_my_account, cron), which this leaves alone.
CREATE OR REPLACE FUNCTION public.guard_moment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Shown name is the host's profile name, not whatever the request says
    SELECT first_name INTO NEW.host_name FROM users WHERE id = NEW.host_id;
    IF NEW.host_name IS NULL THEN
      RAISE EXCEPTION 'invalid: finish your profile first' USING ERRCODE = 'P0001';
    END IF;
    -- The app offers now .. +12 h; allow some slack either side
    IF NEW.starts_at < now() - interval '15 minutes' OR NEW.starts_at > now() + interval '24 hours' THEN
      RAISE EXCEPTION 'invalid: start time must be within the next day' USING ERRCODE = 'P0001';
    END IF;
    -- Same rule as the app: start + duration + 1 h
    NEW.expires_at := NEW.starts_at + CASE NEW.duration
      WHEN 'quick' THEN interval '30 minutes'
      WHEN 'normal' THEN interval '1 hour'
      ELSE interval '2 hours'
    END + interval '1 hour';
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- UPDATE: a host may only cancel an open Moment
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (NEW.status = 'cancelled' AND OLD.status IN ('active', 'full')) THEN
    RAISE EXCEPTION 'invalid: a Moment can only be cancelled' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_moment ON public.moments;
CREATE TRIGGER guard_moment
  BEFORE INSERT OR UPDATE ON public.moments
  FOR EACH ROW EXECUTE FUNCTION public.guard_moment();

-- ===========================================================================
-- 2. connections (#65): guests manage only their own row, within the flow
-- ===========================================================================
GRANT SELECT ON public.connections TO authenticated;
GRANT INSERT (moment_id, user_id, status) ON public.connections TO authenticated;
GRANT UPDATE (status, joined_at, arrived_at, cancelled_at, running_late, running_late_at)
  ON public.connections TO authenticated;

CREATE POLICY "Guests and hosts see a Moment's connections" ON public.connections
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR moment_id IN (SELECT id FROM public.moments WHERE host_id = (SELECT auth.uid()))
  );

-- Blocks are checked by the prevent_blocked_join trigger
CREATE POLICY "Members join as themselves" ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'confirmed');

CREATE POLICY "Guests update their own connection" ON public.connections
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- The app's status flow: join -> (running late) -> arrived -> completed;
-- leave any time before completed; re-join after leaving.
CREATE OR REPLACE FUNCTION public.guard_connection_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user <> 'authenticated' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF (OLD.status = 'confirmed' AND NEW.status IN ('arrived', 'completed', 'cancelled'))
     OR (OLD.status = 'arrived' AND NEW.status IN ('completed', 'cancelled'))
     OR (OLD.status = 'cancelled' AND NEW.status = 'confirmed') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid: can''t go from % to %', OLD.status, NEW.status USING ERRCODE = 'P0001';
END;
$$;

DROP TRIGGER IF EXISTS guard_connection_status ON public.connections;
CREATE TRIGGER guard_connection_status
  BEFORE UPDATE OF status ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.guard_connection_status();

-- ===========================================================================
-- 3. users (#66): read safe columns of people you deal with; edit name/settings
-- ===========================================================================
GRANT SELECT (id, first_name, phone_verified, verified_at,
              meals_hosted, meals_joined, no_shows, status, created_at, updated_at)
  ON public.users TO authenticated;
GRANT UPDATE (first_name, push_token, notify_reminders, notify_joins)
  ON public.users TO authenticated;

CREATE POLICY "Members see themselves and people they deal with" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    -- hosts of open Moments (Moment detail)
    OR id IN (SELECT host_id FROM public.moments WHERE status IN ('active', 'full'))
    -- host and guests of Moments you're part of
    OR id IN (SELECT public.my_table_mate_ids())
    -- people you blocked (Blocked users screen)
    OR id IN (SELECT blocked_id FROM public.blocks WHERE blocker_id = (SELECT auth.uid()))
  );

CREATE POLICY "Members update their own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ===========================================================================
-- 4. feedback (#67): only about someone at the same table, for that Moment
-- ===========================================================================
GRANT SELECT ON public.feedback TO authenticated;
GRANT INSERT (moment_id, from_user, about_user, rating, eat_again, note)
  ON public.feedback TO authenticated;

CREATE POLICY "Members see feedback they gave" ON public.feedback
  FOR SELECT TO authenticated
  USING (from_user = (SELECT auth.uid()));

CREATE POLICY "Members give feedback as themselves" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (from_user = (SELECT auth.uid()) AND about_user <> (SELECT auth.uid()));

-- At the table = the host, or a guest who didn't leave
CREATE OR REPLACE FUNCTION public.at_table(p_moment_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM moments WHERE id = p_moment_id AND host_id = p_user_id)
      OR EXISTS (SELECT 1 FROM connections
                  WHERE moment_id = p_moment_id AND user_id = p_user_id AND status <> 'cancelled');
$$;
REVOKE ALL ON FUNCTION public.at_table(UUID, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the app writes feedback, so this always applies
  IF NOT (public.at_table(NEW.moment_id, NEW.from_user) AND public.at_table(NEW.moment_id, NEW.about_user)) THEN
    RAISE EXCEPTION 'invalid: you can only give feedback about someone you ate with' USING ERRCODE = 'P0001';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_feedback ON public.feedback;
CREATE TRIGGER guard_feedback
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.guard_feedback();

-- ===========================================================================
-- 5. reports (#68): reporters write the report; private fields stay private
-- ===========================================================================
GRANT SELECT (id, reporter_id, reported_user_id, moment_id, category, description, status, created_at)
  ON public.reports TO authenticated;
GRANT INSERT (reporter_id, reported_user_id, moment_id, category, description)
  ON public.reports TO authenticated;

CREATE POLICY "Members see reports they made" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Members report as themselves" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

-- The phone kept for retention (#59) always comes from the profile
CREATE OR REPLACE FUNCTION public.set_reported_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reported_user_id IS NOT NULL THEN
    SELECT phone INTO NEW.reported_phone FROM users WHERE id = NEW.reported_user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- 6. blocks and matches
-- ===========================================================================
GRANT SELECT, DELETE ON public.blocks TO authenticated;
GRANT INSERT (blocker_id, blocked_id) ON public.blocks TO authenticated;

CREATE POLICY "Members see their blocks" ON public.blocks
  FOR SELECT TO authenticated USING (blocker_id = (SELECT auth.uid()));
CREATE POLICY "Members block as themselves" ON public.blocks
  FOR INSERT TO authenticated WITH CHECK (blocker_id = (SELECT auth.uid()));
CREATE POLICY "Members unblock their blocks" ON public.blocks
  FOR DELETE TO authenticated USING (blocker_id = (SELECT auth.uid()));

-- Written only by create_match_on_mutual_feedback
GRANT SELECT ON public.eat_again_matches TO authenticated;
CREATE POLICY "Members see their matches" ON public.eat_again_matches
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (user_a_id, user_b_id));
