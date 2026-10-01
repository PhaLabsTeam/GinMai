-- Phase 8 backend audit, part 2: Connections list and legacy cleanup (#69).
-- Needs the app change that calls my_connections() instead of
-- get_user_connections(p_user_id).

-- ===========================================================================
-- 1. Connections: the caller's own, from eat_again_matches
-- ===========================================================================
-- get_user_connections(p_user_id) returned anyone's Connections, and the
-- legacy `relationships` table it read let users add a Connection with anyone.
CREATE OR REPLACE FUNCTION public.my_connections()
RETURNS TABLE (user_id UUID, first_name TEXT, phone_verified BOOLEAN, meals_hosted INTEGER, meals_joined INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.first_name, u.phone_verified, u.meals_hosted, u.meals_joined
    FROM users u
   WHERE u.id IN (
     SELECT CASE WHEN m.user_a_id = auth.uid() THEN m.user_b_id ELSE m.user_a_id END
       FROM eat_again_matches m
      WHERE auth.uid() IN (m.user_a_id, m.user_b_id)
   );
$$;
REVOKE ALL ON FUNCTION public.my_connections() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_connections() TO authenticated;

-- Matching no longer writes the legacy table
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a UUID := LEAST(NEW.from_user, NEW.about_user);
  v_user_b UUID := GREATEST(NEW.from_user, NEW.about_user);
  v_inserted INTEGER;
  v_from_name TEXT;
  v_about_name TEXT;
  v_from_token TEXT;
  v_about_token TEXT;
BEGIN
  IF NEW.eat_again IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM feedback
     WHERE moment_id = NEW.moment_id
       AND from_user = NEW.about_user
       AND about_user = NEW.from_user
       AND eat_again IS TRUE
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO eat_again_matches (user_a_id, user_b_id, moment_id)
  SELECT v_user_a, v_user_b, NEW.moment_id
   WHERE NOT EXISTS (
     SELECT 1 FROM eat_again_matches
      WHERE user_a_id = v_user_a AND user_b_id = v_user_b AND moment_id = NEW.moment_id
   );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Only announce a new match
  IF v_inserted > 0 THEN
    SELECT first_name, push_token INTO v_from_name, v_from_token FROM users WHERE id = NEW.from_user;
    SELECT first_name, push_token INTO v_about_name, v_about_token FROM users WHERE id = NEW.about_user;
    IF v_about_token IS NOT NULL THEN
      PERFORM send_expo_push(ARRAY[v_about_token], 'You matched!',
        'You and ' || COALESCE(v_from_name, 'your meal buddy') || ' would eat together again.',
        jsonb_build_object('type', 'eat_again_match'));
    END IF;
    IF v_from_token IS NOT NULL THEN
      PERFORM send_expo_push(ARRAY[v_from_token], 'You matched!',
        'You and ' || COALESCE(v_about_name, 'your meal buddy') || ' would eat together again.',
        jsonb_build_object('type', 'eat_again_match'));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ===========================================================================
-- 2. Blocks read only the `blocks` table (blocked_users is legacy, 0 rows)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.my_blocked_user_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id FROM blocks WHERE blocked_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.prevent_blocked_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host UUID;
BEGIN
  IF NEW.status <> 'confirmed' THEN
    RETURN NEW;
  END IF;

  SELECT host_id INTO v_host FROM moments WHERE id = NEW.moment_id;
  IF v_host IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM blocks
     WHERE (blocker_id = v_host AND blocked_id = NEW.user_id)
        OR (blocker_id = NEW.user_id AND blocked_id = v_host)
  ) THEN
    RAISE EXCEPTION 'blocked: cannot join this moment' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- ===========================================================================
-- 3. Remove what the app never uses
-- ===========================================================================
DROP FUNCTION IF EXISTS public.get_user_connections(UUID);
DROP FUNCTION IF EXISTS public.maybe_create_relationship(UUID, UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.join_moment(UUID, UUID);
DROP FUNCTION IF EXISTS public.leave_moment(UUID, UUID);
DROP FUNCTION IF EXISTS public.increment_user_stats(UUID);
DROP FUNCTION IF EXISTS public.nearby_moments(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP TABLE IF EXISTS public.relationships;
DROP TABLE IF EXISTS public.blocked_users;
-- Only nearby_moments used these. Its gist index on ll_to_earth(lat, lng)
-- goes too: the app's map query filters by status and expires_at, which
-- idx_moments_active and idx_moments_expires cover.
DROP INDEX IF EXISTS public.idx_moments_location;
DROP EXTENSION IF EXISTS earthdistance;
DROP EXTENSION IF EXISTS cube;

-- ===========================================================================
-- 4. Function hardening (Security Advisor)
-- ===========================================================================
ALTER FUNCTION public.protect_seats() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Trigger functions only run as triggers; nobody needs to call them
DO $$
DECLARE
  f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'claim_seat()', 'sync_seats_on_connection()', 'notify_host_of_guest_event()',
    'notify_guests_of_cancellation()', 'prevent_blocked_join()', 'set_reported_phone()',
    'create_match_on_mutual_feedback()', 'protect_seats()', 'update_updated_at_column()',
    'guard_moment()', 'guard_connection_status()', 'guard_feedback()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;
