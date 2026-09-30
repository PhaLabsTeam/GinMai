-- New users couldn't finish signing up after #62 ("permission denied for
-- table users"): PostgREST's upsert needs table-wide read access, which the
-- column grants took away. Found by re-running 18-delete-account.
--
-- The name step now calls complete_my_profile(), which creates or renames the
-- caller's own row. The phone number comes from the sign-in record rather
-- than from the app, so nobody can register someone else's number.

CREATE OR REPLACE FUNCTION public.complete_my_profile(p_first_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  v_phone TEXT;
  v_name TEXT := btrim(p_first_name);
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF v_name = '' OR char_length(v_name) > 30 THEN
    RAISE EXCEPTION 'invalid: first name must be 1-30 characters' USING ERRCODE = 'P0001';
  END IF;

  SELECT '+' || ltrim(phone, '+') INTO v_phone FROM auth.users WHERE id = uid;

  INSERT INTO users (id, phone, first_name, phone_verified, verified_at)
  VALUES (uid, v_phone, v_name, true, now())
  ON CONFLICT (id) DO UPDATE
    SET first_name = EXCLUDED.first_name, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.complete_my_profile(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_my_profile(TEXT) TO authenticated;

-- Rows are only created through the function now
REVOKE INSERT ON public.users FROM authenticated;
