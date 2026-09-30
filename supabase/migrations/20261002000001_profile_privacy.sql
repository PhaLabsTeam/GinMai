-- Profile privacy (#61, #62).
--
-- Hosts saw guests as "Guest" (#61). The only rule for reading someone else's
-- profile was "they're hosting an active Moment" (20240101000004 dropped the
-- shared-Moment part to avoid policy recursion). Found in the #42 full-table
-- test: Kai showed as "Guest"; Sam only showed because of a stale Moment.
--
-- Adds one more read rule, alongside the existing ones: people you share a
-- Moment with (host and guests, any status, for history). SECURITY DEFINER
-- so it doesn't recurse through the connections and moments policies.

CREATE OR REPLACE FUNCTION public.my_table_mate_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Hosts of Moments I joined
  SELECT m.host_id FROM moments m
    JOIN connections c ON c.moment_id = m.id
   WHERE c.user_id = auth.uid() AND m.host_id IS NOT NULL
  UNION
  -- Guests of Moments I host
  SELECT c.user_id FROM connections c
    JOIN moments m ON m.id = c.moment_id
   WHERE m.host_id = auth.uid()
  UNION
  -- Other guests of Moments I joined
  SELECT c2.user_id FROM connections c2
    JOIN connections c ON c.moment_id = c2.moment_id
   WHERE c.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.my_table_mate_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_table_mate_ids() TO authenticated;

DROP POLICY IF EXISTS "Users see people they share a moment with" ON public.users;
CREATE POLICY "Users see people they share a moment with"
  ON public.users FOR SELECT TO authenticated
  USING (id IN (SELECT public.my_table_mate_ids()));

-- Phone numbers and push tokens were readable by any signed-in user (#62):
-- read rules are per row, so whoever could see a profile saw every column.
-- Found while fixing #61 (a stranger could read Tester's and Sam's numbers).
-- Others now get only the columns the app shows; your own full row comes from
-- my_profile(). Users also could edit their own counts and status (no_shows,
-- status = 'banned'); writes are limited to the fields the app sets.

CREATE OR REPLACE FUNCTION public.my_profile()
RETURNS SETOF public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_profile() TO authenticated;

REVOKE ALL ON public.users FROM anon;
REVOKE SELECT, INSERT, UPDATE ON public.users FROM authenticated;

GRANT SELECT (
  id, first_name, phone_verified, verified_at,
  meals_hosted, meals_joined, no_shows, status, created_at, updated_at
) ON public.users TO authenticated;

GRANT INSERT (id, phone, first_name, phone_verified, verified_at)
  ON public.users TO authenticated;

GRANT UPDATE (
  phone, first_name, phone_verified, verified_at,
  push_token, notify_reminders, notify_joins, updated_at
) ON public.users TO authenticated;
