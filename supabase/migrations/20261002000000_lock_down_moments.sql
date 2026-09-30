-- Lock down moments (#60). Found during the #42 full-table test: the live
-- database still ran the M1 "Anyone can ..." policies, so the public anon key
-- alone could edit or delete any Moment (a no-op anonymous PATCH was accepted).
-- Guests could also only join because anyone could update moments: the app
-- counted seats itself (seats_taken + 1 from its cache), which could overbook.
--
-- After this:
--   * signed-out visitors can only read open Moments (the map works signed out)
--   * members read open Moments (minus blocks), their own, and ones they joined
--   * only a host can create, update or delete their Moment
--   * the database owns seats: a join is refused when the table is full, and
--     seats_taken / full <-> active follow the connections, one join at a time
--   * legacy SECURITY DEFINER functions that took a user id can't be called by
--     anyone else (join_moment / leave_moment let a caller act as any user)

-- 1. Policies. Live names differ from the repo's, so drop whatever is there.
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'moments' LOOP
    EXECUTE format('DROP POLICY %I ON public.moments', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- Moments the caller has a connection to (any status, for history). SECURITY
-- DEFINER so the moments policy doesn't recurse through the connections policies.
CREATE OR REPLACE FUNCTION public.my_moment_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT moment_id FROM connections WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.my_moment_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_moment_ids() TO authenticated;

CREATE POLICY "Visitors see open moments"
  ON public.moments FOR SELECT TO anon
  USING (status IN ('active', 'full'));

CREATE POLICY "Members see open, own and joined moments"
  ON public.moments FOR SELECT TO authenticated
  USING (
    host_id = auth.uid()
    OR id IN (SELECT public.my_moment_ids())
    OR (
      status IN ('active', 'full')
      AND host_id NOT IN (SELECT public.my_blocked_user_ids())
    )
  );

CREATE POLICY "Members create their own moments"
  ON public.moments FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts update their own moments"
  ON public.moments FOR UPDATE TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts delete their own moments"
  ON public.moments FOR DELETE TO authenticated
  USING (host_id = auth.uid());

-- 2. Seats. A connection holds a seat unless it's cancelled.

-- Before a connection starts holding a seat: lock the Moment so joins queue up,
-- then refuse when it's full, closed, or the joiner is the host.
CREATE OR REPLACE FUNCTION public.claim_seat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m moments;
  held INTEGER;
BEGIN
  IF NEW.status = 'cancelled' OR (TG_OP = 'UPDATE' AND OLD.status <> 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- Already in: let the unique constraint answer (the app treats 23505 as joined)
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM connections WHERE moment_id = NEW.moment_id AND user_id = NEW.user_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO m FROM moments WHERE id = NEW.moment_id FOR UPDATE;
  IF m.id IS NULL THEN
    RETURN NEW; -- the foreign key reports it
  END IF;

  IF m.host_id = NEW.user_id THEN
    RAISE EXCEPTION 'own: you can''t join your own moment' USING ERRCODE = 'P0001';
  END IF;
  IF m.status NOT IN ('active', 'full') THEN
    RAISE EXCEPTION 'closed: this moment is no longer open' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO held FROM connections
   WHERE moment_id = m.id AND status <> 'cancelled' AND id <> NEW.id;
  IF held >= m.seats_total THEN
    RAISE EXCEPTION 'full: this moment is full' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS claim_seat ON public.connections;
CREATE TRIGGER claim_seat
  BEFORE INSERT OR UPDATE OF status ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_seat();

-- After any change to connections: recount. Recounting (rather than +1/-1)
-- also repairs drift, e.g. delete_my_account's own decrement.
CREATE OR REPLACE FUNCTION public.sync_seats_taken(p_moment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  held INTEGER;
BEGIN
  SELECT count(*) INTO held FROM connections
   WHERE moment_id = p_moment_id AND status <> 'cancelled';

  PERFORM set_config('ginmai.seat_sync', 'on', true);
  UPDATE moments
     SET seats_taken = LEAST(held, seats_total),
         status = CASE
           WHEN status NOT IN ('active', 'full') THEN status
           WHEN held >= seats_total THEN 'full'
           ELSE 'active'
         END,
         updated_at = now()
   WHERE id = p_moment_id
     AND (seats_taken IS DISTINCT FROM LEAST(held, seats_total)
          OR (status IN ('active', 'full')
              AND status <> CASE WHEN held >= seats_total THEN 'full' ELSE 'active' END));
  PERFORM set_config('ginmai.seat_sync', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_seats_taken(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_seats_on_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_seats_taken(OLD.moment_id);
    RETURN OLD;
  END IF;
  PERFORM public.sync_seats_taken(NEW.moment_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_seats_on_connection ON public.connections;
CREATE TRIGGER sync_seats_on_connection
  AFTER INSERT OR DELETE OR UPDATE OF status ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_seats_on_connection();

-- Nobody but the recount sets seats_taken or flips full <-> active; hosts can
-- still cancel or complete. New Moments start empty.
CREATE OR REPLACE FUNCTION public.protect_seats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.seats_taken := 0;
    NEW.status := 'active';
    RETURN NEW;
  END IF;

  IF current_setting('ginmai.seat_sync', true) IS DISTINCT FROM 'on' THEN
    NEW.seats_taken := OLD.seats_taken;
    IF NEW.status IN ('active', 'full') AND OLD.status IN ('active', 'full') THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_seats ON public.moments;
CREATE TRIGGER protect_seats
  BEFORE INSERT OR UPDATE ON public.moments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_seats();

-- Fix any counts the app got wrong so far
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.moments WHERE status IN ('active', 'full') LOOP
    PERFORM public.sync_seats_taken(r.id);
  END LOOP;
END $$;

-- 3. Legacy SECURITY DEFINER functions (20240101000002). The app calls none of
-- them except get_user_connections; join_moment and leave_moment take any user
-- id. Revoke from callers (the owner and pg_cron keep access).
DO $$
DECLARE
  f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.join_moment(uuid, uuid)',
    'public.leave_moment(uuid, uuid)',
    'public.maybe_create_relationship(uuid, uuid, uuid, boolean)',
    'public.increment_user_stats(uuid)',
    'public.expire_moments()'
  ] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    END IF;
  END LOOP;

  IF to_regprocedure('public.get_user_connections(uuid)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.get_user_connections(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.get_user_connections(uuid) TO authenticated;
  END IF;
END $$;
