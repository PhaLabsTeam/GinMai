-- Make blocking do something (#48). Blocks were stored in `blocks`, but nothing
-- read that table: blocked people still saw each other's Moments and could
-- join them (the old join_moment check reads the legacy `blocked_users` table,
-- and the app doesn't call join_moment anyway). Both tables are honoured here.

-- Everyone on the other side of a block with the caller, in either direction.
-- SECURITY DEFINER because RLS only lets users see blocks they created, and
-- a blocked person must stop seeing the blocker's Moments too.
CREATE OR REPLACE FUNCTION public.my_blocked_user_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id FROM blocks WHERE blocked_id = auth.uid()
  UNION
  SELECT blocked_id FROM blocked_users WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id FROM blocked_users WHERE blocked_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.my_blocked_user_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_blocked_user_ids() TO authenticated;

-- Server-side guard: no joining a Moment when either side has blocked the other.
-- Covers new joins and re-joins (a cancelled connection set back to confirmed).
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
    UNION ALL
    SELECT 1 FROM blocked_users
     WHERE (blocker_id = v_host AND blocked_id = NEW.user_id)
        OR (blocker_id = NEW.user_id AND blocked_id = v_host)
  ) THEN
    RAISE EXCEPTION 'blocked: cannot join this moment' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_blocked_join ON connections;
CREATE TRIGGER prevent_blocked_join
  BEFORE INSERT OR UPDATE OF status ON connections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_blocked_join();
