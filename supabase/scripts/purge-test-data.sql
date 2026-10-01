-- Purge old test data (Phase 8). Keeps the 5 Supabase test numbers and their
-- history; removes every other account (kiss, Maya, Husssss, ...) with all
-- their Moments, plus the Moments made by app/scripts/security-check.mjs.
-- Reports are kept: about deleted accounts they follow the 12-month rule (#59).
--
-- STEP 1: run only the PREVIEW block and check the numbers.
-- STEP 2: run the PURGE block (one transaction; all or nothing).

-- ============================== PREVIEW (read-only) =========================
WITH keep AS (
  SELECT id FROM auth.users
   WHERE phone IN ('66999999999', '66123456789', '66812345678', '66887654321', '66823456789')
)
SELECT 'auth accounts to delete' AS what, count(*) AS n
  FROM auth.users WHERE id NOT IN (SELECT id FROM keep)
UNION ALL
SELECT 'profiles to delete', count(*)
  FROM public.users WHERE id NOT IN (SELECT id FROM keep)
UNION ALL
SELECT 'their names', NULL::bigint
UNION ALL
SELECT '  ' || string_agg(DISTINCT first_name, ', '), NULL
  FROM public.users WHERE id NOT IN (SELECT id FROM keep)
UNION ALL
SELECT 'moments to delete (other hosts, no host, security-check)', count(*)
  FROM public.moments
 WHERE host_id IS NULL OR host_id NOT IN (SELECT id FROM keep) OR area_name = 'security-check'
UNION ALL
SELECT 'moments kept (test users'' history)', count(*)
  FROM public.moments
 WHERE host_id IN (SELECT id FROM keep) AND area_name IS DISTINCT FROM 'security-check'
UNION ALL
SELECT 'test accounts kept', count(*) FROM keep;

-- ============================== PURGE =======================================
-- BEGIN;
--
-- CREATE TEMP TABLE keep ON COMMIT DROP AS
--   SELECT id FROM auth.users
--    WHERE phone IN ('66999999999', '66123456789', '66812345678', '66887654321', '66823456789');
--
-- -- Moments go first (their connections, feedback and matches cascade)
-- DELETE FROM public.moments
--  WHERE host_id IS NULL OR host_id NOT IN (SELECT id FROM keep) OR area_name = 'security-check';
--
-- -- Profiles, then sign-in accounts (blocks, connections, feedback, matches cascade;
-- -- reports keep their row with the person set to NULL, as in #59)
-- UPDATE public.reports SET reported_account_deleted_at = now()
--  WHERE reported_user_id NOT IN (SELECT id FROM keep) AND reported_account_deleted_at IS NULL;
-- DELETE FROM public.users WHERE id NOT IN (SELECT id FROM keep);
-- DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM keep);
--
-- COMMIT;
