-- In-app account deletion (#7). Required by App Store Review Guideline 5.1.1(v).
--
-- public.users.id is not a foreign key to auth.users, so both rows are deleted
-- here. Before that, clean up what the cascades would get wrong:
--   * moments.host_id is ON DELETE SET NULL, so the user's upcoming Moments
--     would linger on the map as anonymous. Cancel them instead, which also
--     tells their guests through realtime.
--   * connections cascade-delete, but seats_taken on those Moments wouldn't
--     be given back. Free the seats first.
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

  UPDATE moments m
     SET seats_taken = GREATEST(m.seats_taken - 1, 0),
         status = CASE WHEN m.status = 'full' THEN 'active' ELSE m.status END,
         updated_at = now()
   WHERE m.status IN ('active', 'full')
     AND m.id IN (
       SELECT c.moment_id FROM connections c
        WHERE c.user_id = uid AND c.status IN ('confirmed', 'arrived')
     );

  DELETE FROM public.users WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
