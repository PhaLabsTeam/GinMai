# GinMai backend access matrix (Phase 8)

Live snapshot taken 2026-10-01 13:24 UTC with `supabase/schema/snapshot.sql`, plus the Supabase Security and Performance Advisors and the Auth settings.

For each table, function and channel this lists **what the app needs** (from `app/src/stores/*`) against **what live allows**. Anything allowed beyond what the app needs is a finding (#64+), fixed in Phase 8 and checked by `npm run security-check`.

Roles:
- **anon**: signed-out visitor
- **self**: a signed-in user acting on their own rows
- **other**: a signed-in user acting on someone else's rows

## Tables

### moments
| | App needs | Live allows | Finding |
|---|---|---|---|
| anon read | open Moments (map works signed out) | open Moments | ok (#60) |
| self insert | own Moment: time, place, seats, note | any `host_name`, `expires_at`, `starts_at` | **#64** host can post as any name, or keep a Moment live forever |
| self update | `status → cancelled` | every column, e.g. move time or place after guests joined | **#64** |
| self delete | none | own Moments | unused, remove |
| other | read open (minus blocks), own, joined | same | ok |

### connections
| | App needs | Live allows | Finding |
|---|---|---|---|
| anon | nothing | policies apply to `public` (anon included); they only fail because `auth.uid()` is null | **#65** limit to authenticated |
| self insert | join: `status = confirmed` | any status (`completed`, `arrived`, `no_show`) straight away | **#65** |
| self update | status confirmed / cancelled / arrived / completed, `arrived_at`, `cancelled_at`, `running_late(_at)`, `joined_at` | every column, **including `moment_id`** | **#65 (high)** changing `moment_id` moves you into another Moment and skips the seat check, the block check and the seat count (those triggers fire on `status` only) |
| host update | nothing (the app never updates guests' rows) | any column of any guest row in your Moment, with no check, e.g. set `user_id` to anyone | **#65 (high)** a host can put any user into their Moment |
| self delete | none (leaving sets `cancelled`) | own rows | remove |
| read | own rows, plus guests of Moments you host | same, but two overlapping policies | performance only |

### users
| | App needs | Live allows | Finding |
|---|---|---|---|
| self read | full own row via `my_profile()` | same | ok (#62) |
| other read | name, verified badge, meal counts | safe columns of active hosts and table-mates | ok (#61, #62) |
| self update | `first_name`, `push_token`, `notify_*` | also `phone`, `phone_verified`, `verified_at` | **#66** |
| self insert | via `complete_my_profile()` | stale "insert own profile" policy (no grant) | remove |

### feedback
| | App needs | Live allows | Finding |
|---|---|---|---|
| self insert | about someone you ate with, for that Moment | about **anyone**, for **any** Moment | **#67** fake ratings and "eat again" about strangers; it takes two to match, so no fake matches |
| self read | none | own feedback (`from_user`) | ok; others never see it (matches the Privacy Policy) |

### eat_again_matches
Select own only, written only by the trigger. ok. Table grants are still wide open; revoke them (defence in depth).

### reports
| | App needs | Live allows | Finding |
|---|---|---|---|
| self insert | reported user, Moment, category, description | also `status`, `admin_notes`, `reviewed_by`, **`reported_phone`** (only filled in when null) | **#68** a reporter can file reports already "resolved", or attach a fake phone number |
| self read | own reports, without private fields | `select *`, **including the reported person's `reported_phone`** and `admin_notes` | **#68 (high)** breaks the Privacy Policy |

### blocks / blocked_users
- `blocks`: own only. ok.
- `blocked_users`: legacy, 0 rows. Drop it, plus the references in `my_blocked_user_ids` and `prevent_blocked_join`.

### relationships (legacy)
| | App needs | Live allows | Finding |
|---|---|---|---|
| self insert | none (the trigger writes it) | a relationship with **anyone** | **#69** fake Connections; with `get_user_connections` this shows anyone's name and meal counts |
| `get_user_connections(p_user_id)` | your own Connections | **anyone's**, by passing their id | **#69** |

**Fix:** add `my_connections()`, which uses the caller and reads `eat_again_matches`. Move the app to it, then drop `relationships`, `get_user_connections` and `maybe_create_relationship`.

## Grants (all tables)
- `anon` and `authenticated` hold **every** table privilege on every table, including `TRUNCATE`, `TRIGGER` and `REFERENCES`.
- RLS blocks rows, but `TRUNCATE` isn't subject to RLS. The REST and GraphQL APIs don't expose it, so this isn't exploitable today.
- **#70:** grant only what the app needs, table by table.
  - `anon`: `SELECT` on `moments` only.
  - `authenticated`: as in the tables above.

## Functions
| Function | Callable by | Finding |
|---|---|---|
| `my_profile`, `complete_my_profile`, `delete_my_account`, `my_blocked_user_ids`, `my_moment_ids`, `my_table_mate_ids` | authenticated | ok: they use the caller only |
| `get_user_connections(p_user_id)` | authenticated | **#69** |
| `nearby_moments` | **anon, authenticated** | unused, ignores blocks, no `search_path`. Drop it, along with `cube` and `earthdistance` |
| `join_moment`, `leave_moment`, `increment_user_stats`, `maybe_create_relationship` | nobody (revoked in #60) | unused. Drop |
| trigger functions (`claim_seat`, `sync_seats_on_connection`, `notify_*`, `prevent_blocked_join`, `set_reported_phone`, `create_match_on_mutual_feedback`, `protect_seats`) | anon, authenticated | Postgres refuses to call them outside a trigger, so not exploitable. Revoke anyway to clear the Advisor warnings |
| `protect_seats`, `update_updated_at_column` | | no `search_path`; set it |

## Realtime
- **#71 (app mismatch):** the `supabase_realtime` publication has **no tables**.
  - The app subscribes to `moments` (map and seat counts) and to `connections` (the host's live screen: joins, arrivals, cancellations, running late). Neither ever fires.
  - Everything only refreshes on navigation.
  - **Fix:** add both tables. Realtime applies RLS to each subscriber, so the access rules above also decide who gets which events.

## Auth (dashboard settings, not SQL)
| Setting | Live | Finding |
|---|---|---|
| Phone OTP | 6 digits, 60 s expiry | ok |
| Email provider | looks enabled (OTP 3600 s, 8 digits) | **#72** to confirm. If on, anyone can get a signed-in account without a phone. The app is phone-only, so turn it off |
| Anonymous sign-ins | unknown | **#72** to confirm. Must be off: anonymous users get the `authenticated` role |
| SMS rate limit | 30 / hour, project-wide | **#73 (launch blocker)** caps sign-ins at about 30 an hour for everyone. Raise it before launch |
| OTP verifications | 30 / 5 min per IP | ok |
| Test numbers | 5, with codes written in the repo (Maestro flows, docs) | **#74 (before launch)** remove from Supabase at launch; keep the repo private |
| Leaked-password protection | off | not applicable: no passwords |

## Other
- **Extensions:**
  - `pg_graphql` is on, but the app doesn't use GraphQL. It respects RLS, so it's no extra hole, just more surface area. Optional: disable it.
  - `cube` and `earthdistance` are in `public`; they go when `nearby_moments` is dropped.
- **Performance (Advisor):** every policy calls `auth.uid()` once per row, and `users` and `connections` have overlapping policies. Fixed while rewriting the policies: use `(select auth.uid())` and one policy per action.
- Storage buckets: none.
- **#75 Cron:** only `expire-moments` (#63) is scheduled. `purge-expired-reports` from #59 never was, because pg_cron wasn't enabled when that migration ran, so the 12-month report deletion the Privacy Policy promises doesn't happen. Fix: schedule it.
