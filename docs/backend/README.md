# GinMai backend

Supabase project `nnjuxkfqekecfwfkdzvj`: Postgres, Auth (phone OTP via Twilio), Realtime, pg_cron and pg_net. There's no server code beyond the database: rules live in RLS policies, column grants, triggers and a few `SECURITY DEFINER` functions.

## The rules
`access-matrix.md` lists, for every table, function and realtime channel, what the app needs and what the database allows. Keep it current. Anything allowed beyond what the app needs is a bug.

**How the rules are built** (see `supabase/migrations/20261003000000_lock_down_writes.sql`):

- **Grants first:**
  - `anon` and `authenticated` start with no privileges, and only the columns the app uses are granted.
  - New tables and functions are private by default (`ALTER DEFAULT PRIVILEGES`), so **a new table or function needs explicit `GRANT`s before the app can use it.**
- **Policies:**
  - one policy per action, for a named role
  - use `(select auth.uid())`, not `auth.uid()`, so Postgres evaluates it once per query
- **Triggers for rules policies can't express:**
  - allowed status changes
  - who may give feedback about whom
  - server-set fields such as `host_name`, `expires_at` and the reported phone
  - seat counting
- **Guards and `current_user`:** guards that should limit the app but not server functions run as the caller and check `current_user = 'authenticated'`. Inside a `SECURITY DEFINER` function, `current_user` is the owner.
- **Own-row helpers:** a helper that returns the caller's own rows (`my_moment_ids()`, `my_table_mate_ids()`, `my_blocked_user_ids()`) is `SECURITY DEFINER`, so policies don't recurse.

## Changing the backend
1. Write a migration in `supabase/migrations/` with a new timestamp.
2. Apply it by pasting it into the **SQL editor**. Don't use `supabase db push`, and don't touch the migration history table.
3. Regenerate the app's view of the schema:
   ```bash
   cd supabase && supabase gen types typescript --linked --schema public > /tmp/live.ts
   ```
   Then replace everything below the two header comment lines of `app/src/types/supabase.generated.ts` with that output.
4. Run `cd app && npm test`. `src/types/__tests__/schema.test.ts` fails if `database.ts` no longer matches live, or if the app calls a function that doesn't exist.
5. Run `cd app && npm run security-check`. Every row must pass; add a row for any new rule.
6. Update `access-matrix.md`.

## Checking what's live
- **Snapshot:** `supabase/schema/snapshot.sql` is a read-only query that returns everything access-related as JSON: RLS, policies, table and column grants, functions with their ACLs, triggers, realtime tables, cron jobs, buckets, extensions and row counts. Run it in the SQL editor after any change made in the dashboard, and compare it with `access-matrix.md`.
- **Advisors:** Dashboard → Advisors → Security / Performance. Remaining warnings are explained in `access-matrix.md`.
- **Known issue:** `supabase db dump` and `supabase db query --linked` fail with CLI 2.118 ("permission denied to alter role cli_login_postgres"). `gen types` works. Use the SQL editor for queries.

## Scheduled jobs (pg_cron)
| Job | Schedule | Does |
|---|---|---|
| `expire-moments` | every 5 min | marks ended Moments `completed` (#63) |
| `purge-expired-reports` | daily 03:00 UTC | deletes reports about accounts deleted over 12 months ago (#59, #75) |

## Before launch
- **Auth → Rate limits:** raise the SMS limit from 30 an hour for the whole project (#73).
- **Auth → Providers:**
  - Email off, and anonymous sign-ins off (#72)
  - remove the test phone numbers (#74)
- **Repo:** keep it private. The Maestro flows contain the test numbers and their codes.
