# QA Fix Plan

Issues found in the iOS simulator QA pass on 2026-09-29, after the Expo SDK 57 upgrade. Fixes land in phases. Each phase gets its own branch, tests and pull request, and the next phase starts only after the previous one is reviewed.

**Status legend:** ⬜ open · 🔧 fixed · ✅ tested · 📦 committed

**Workflow**
- This file is updated in the same commit as each fix.
- Each phase ends with a pushed branch and a PR for review; nothing is merged to `main` directly.
- Phase N+1 starts only after sign-off on phase N.

**Test setup**
- Test login: +66 999999999, code 123456 (a Supabase test OTP).
- Maestro flows live in `.maestro/flows/`.

---

## Phase overview

| Phase | Scope | Branch | Status | PR |
|---|---|---|---|---|
| 0 | Baseline: SDK 57, iOS 27 scene fix, this doc | `fix/expo-sdk-57` | 📦 | — |
| 1 | Auth & data correctness | `fix/auth-and-data` | 📦 awaiting review | — |
| 1.5 | expo-notifications 57 API (#40) | `fix/notifications-sdk57` | 📦 awaiting review | — |
| 2 | Host flow & navigation | `fix/host-flow` | 📦 awaiting review | — |
| 3 | Create & sign-in inputs (+#39) | `fix/create-flow` | 🔧 in progress, #13 waiting on the Places key | — |
| 4 | Settings, safety, App Store readiness (+#46–#48) | `fix/app-store-readiness` | 📦 awaiting review, #17 waiting on terms URL | — |
| 5 | Map & product-feel UX | `fix/ux-polish` | 📦 awaiting review, #30 moves to #13 (Places) | — |
| 5.5 | Metro crash on style edits (#44) | `fix/metro-nativewind` | 📦 awaiting review | — |
| 5.6 | Host and guest push notifications (#45) | `feat/host-push-notifications` | 📦 awaiting review | — |
| 6 | Visual consistency | `refactor/design-consistency` | 📦 awaiting review | — |
| 7 | Two-user end-to-end testing | `test/two-user-e2e` | 📦 awaiting review | — |
| 7.5 | Google Places search (#13, #30, #52) | `feat/places-search` | 📦 awaiting review | — |
| 7.6 | TypeScript clean (#41) | `fix/typescript` | 📦 awaiting review | — |
| 7.7 | Terms of Use (#17) | `feat/terms` | 📦 awaiting review | — |
| 7.8 | Privacy Policy, deletion retention (#59) | `feat/privacy-policy` | 📦 awaiting review | — |
| 7.9 | Full table (#42), moments lock-down (#60), profile privacy (#61, #62), ended Moments (#63) | `test/full-table` | 📦 awaiting review | — |
| 8 | Backend audit: app match and security (#64–#75) | `security/backend-audit` | 🔧 fixes applied and tested; purge next | — |

**Needed from the team**
- Google Places API key (before Phase 3)
- Terms page URL (before Phase 4)
- Second Supabase test number, e.g. `66888888888=123456` (before Phase 7)

---

## Phase 0: Baseline

| Item | Status | Commit |
|---|---|---|
| Upgrade to Expo SDK 57 (RN 0.86), fix app.json schema | 📦 ✅ | `c16e696` |
| iOS 27 launch crash: UIScene lifecycle config plugin | 📦 ✅ | `bd0200b` |
| Remove outdated M4 testing notes | 📦 | `29ded70` |

**Verified:**
- `expo-doctor` passes 21/21
- `npm test` passes: 28 tests in 3 suites
- the app builds and launches on the iPhone 18 Pro simulator (iOS 27)

---

## Phase 1: Auth & data correctness

| # | Issue | Status | Commit |
|---|---|---|---|
| 1 | Auth listener race overwrites the fresh profile with stale data; the listener is re-registered on every `initialize` | 📦 ✅ | `b173bda` |
| 2 | Returning users must re-enter their name, which overwrites the saved one. Change to phone → code → name only if new. | 📦 ✅ | `b173bda` |
| 8 | After sign-up, `returnTo` is ignored; the welcome screen's redirect replaces the top screen | 📦 ✅ | `ba72b84` |
| 9 | A failed Moments fetch shows "Nothing here yet" plus an empty error toast | 📦 ✅ | `49554c9` |
| 10 | Raw Twilio or Supabase errors are shown to users | 📦 ✅ | `b173bda` |
| 31 | The code screen shows "999999999" without the country code | 📦 ✅ | `b173bda` |

**Verified:**
- **Jest:** `npm test` passes 41 tests in 6 suites. New tests:
  - `authStore.signIn.test.ts`: the listener is registered once; the verified profile survives a listener that fires mid-verify; a stale listener fetch landing after sign-in is ignored (this test fails without the fix); returning users aren't renamed; new users go through `completeProfile`
  - `authErrors.test.ts`: the Twilio account ID never reaches the user
  - `momentStore.fetch.test.ts`: a failed fetch sets `error`
- **Maestro:** `01-auth-signup.yaml` passes: phone only, `+66 999 999 999` shown, no name step for a returning user, lands back on create-moment
- **Maestro:** `06-signin-errors.yaml` passes: a wrong code shows "That code didn't work…"
- **Manual:** Profile shows the stored name ("Tester", previously the stale "kiss")
- **Manual:** with `.env` pointed at an invalid host, the map shows "Couldn't load meals." plus "Try again"; `.env` was restored afterwards

**Notes:**
- The red toast from #9 is React Native's dev-only error overlay for `console.error`; release builds don't show it.
- `01-auth-signup` enters the code one digit per command until #15 (Phase 3).

## Phase 2: Host flow & navigation

| # | Issue | Status | Commit |
|---|---|---|---|
| 3 | A host can't get back to their live Moment: no back button, "Your moment" is disabled, My Moments is a dead end | 📦 ✅ | `b0d9896` |
| 4 | "Cancel this meal" cancels on one tap with no confirmation | 📦 ✅ | `b0d9896` |
| 5 | Hard-coded "8 min walk" and "~฿150" on moment detail | 📦 ✅ | `b0d9896` |
| 11 | Unlabeled floating `›` button on 13 screens with different actions (join, skip, duplicate submit, stacked maps) | 📦 ✅ | `e930d18` |
| 16 | Menu → Safety only closes the menu | 📦 ✅ | `b0d9896` |

**Verified:**
- **Jest:** `npm test` passes 57 tests in 10 suites. New tests:
  - `momentStore.lookup.test.ts`: a full Moment can be fetched and found; updates reach cached Moments; leaving a full Moment gives the seat back (this test fails on the old lookup); `fetchMyActiveMoment` finds hosted and joined Moments, and returns nothing when none exist
  - `useMoment.test.tsx`: shows a spinner rather than "not found", then fetches Moments that aren't on the map
  - `distance.test.ts`
- **Maestro:** `07-host-manage.yaml` passes from a clean install: create → Back → reopen from the list ("N min walk", no ฿ price) → "Manage your moment" → My Moments → Cancel shows a confirmation → "Keep it" → Cancel meal → map empty → My Moments says "Nothing planned right now." → Menu > Safety
- **Maestro:** `01-auth-signup` and `06-signin-errors` still pass
- **Manual:** no floating `›` buttons remain; the only remaining `›` characters are list-row chevrons

**Notes:**
- The "table fills up while the host watches" case for #42 needs a second user; it's covered by unit tests and added to Phase 7.
- The `_launch.yaml` flow sets a GPS position. Without one, create-moment is stuck on "Loading…" and "Make visible" does nothing (#39).

## Phase 3: Create & sign-in inputs

| # | Issue | Status | Commit |
|---|---|---|---|
| 12 | "Pick a time…" has no time picker and silently uses "now" | 📦 ✅ | `6a34bb5` |
| 13 | Place search used the address geocoder and couldn't find restaurants; now Google Places | 📦 ✅ | `ab883fc` |
| 14 | The keyboard covers the place search input and results | 📦 ✅ | `6a34bb5` |
| 15 | One-time code: fast typing drops digits, paste breaks, no SMS autofill | 📦 ✅ | `2fc008d` |
| 24 | "Lunch" is hard-coded at every time of day | 📦 ✅ | `05ae86a` |
| 32 | No obvious way to close the keyboard on the note field | 📦 ✅ | `6a34bb5` |

**Verified so far (everything except #13):**
- **Jest:** `npm test` passes 73 tests in 12 suites. New tests: `pickTime.test.ts` (past time means tomorrow, over 12 h is rejected, the current minute stays today) and `mealWord.test.ts`.
- **Maestro:** `01-auth-signup` enters the whole code in one burst (#15).
- **Maestro:** `08-create-inputs` passes: meal-aware title, picker shown with "At HH:MM", Next goes to step 2, the note's Return key works.
- **Maestro:** `09-location-unavailable` passes: with location denied, "Couldn't find you. Tap to retry, or search for a place." appears, and Next shows "Where are you eating?".
- **Maestro:** `06` and `07` still pass.
- **Manual:** the search box and Next button stay above the keyboard (#14); after Return the keyboard closes and the note stays on one line (#32); the title reads "Share your dinner" for 16:50 (#24).

**Notes:**
- #39 also covered a bug found while fixing it: with location denied, the Moment was silently placed at the centre of Chiang Mai.
- The inline iOS time spinner pushes "Search for a place" below the fold on step 1; it's reachable by scrolling. This could be revisited in Phase 6.
- The time picker is native (`@react-native-community/datetimepicker` 9.1.0), so the app needs a rebuild.

## Phase 4: Settings, safety, App Store readiness

| # | Issue | Status | Commit |
|---|---|---|---|
| 6 | Settings toggles don't save and have no effect; "Auto-accept" has nothing to control | 📦 ✅ | `69dbcab` |
| 7 | "Delete account" does nothing (App Store requirement) | 📦 ✅ (verified end to end on a spare number) | `69dbcab` `6a04963` `405f201` |
| 17 | The "terms" link wasn't tappable and no terms existed | 📦 ✅ (draft: placeholders + legal review pending) | `3b6f982` |
| 18 | Test "Report Inappropriate Behavior" button shows on the Safety screen | 📦 ✅ | `8fcaa4e` |
| 19 | The Safety banner promises location sharing that doesn't exist | 📦 ✅ | `8fcaa4e` |
| 20 | Notification permission is requested at launch | 📦 ✅ | `58a2156` |
| 21 | The location permission prompt uses generic text | 📦 ✅ | `58a2156` |
| 28a | Safety lists only the US embassy; Tourist Police should come first | 📦 ✅ | `8fcaa4e` |

**Database:** the three migrations `20260929000000`–`20260929000002` were applied through the SQL editor. The CLI migration history is untouched, by choice. A check query confirmed 2 columns, 3 functions and 1 trigger.

**Verified:**
- **Jest:** `npm test` passes 84 tests in 15 suites. New tests: `authStore.account` (a saved setting rolls back on failure; deletion clears the session, or keeps it when deletion fails), `pushPermission` (no prompt at launch; the explanation comes before the system prompt; "Not now" never triggers the system prompt), `momentStore.blocks` (blocked hosts are hidden; the map still loads if the blocked list fails)
- **Maestro:** `10-permissions`: on a fresh install, no notification prompt at launch; the location prompt reads "GinMai shows meals happening near you. That's all we use it for."
- **Maestro:** `11-safety`: Tourist Police is shown; no US Embassy card, no "trusted contact" promise, no test button; Settings > Blocked users opens
- **Maestro:** `12-settings`, plus a screenshot: "Meal reminders" stays off after restarting the app
- **Logs:** `my_blocked_user_ids` runs after sign-in; before sign-in it's denied as intended and the map shows everything

**Not verified on a device:**
- Delete account (#7): it would delete the only test account. Add a spare test number to run it.
- "Report or block" on another person, and blocked-join rejection (#47, #48): these need a second account (Phase 7).

## Phase 5: Map & product-feel UX

| # | Issue | Status | Commit |
|---|---|---|---|
| 22 | The map doesn't center on the user; the location dot sometimes disappears | 📦 ✅ | `fe42ea8` |
| 23 | The list panel covers the whole map; your own Moment isn't marked | 📦 ✅ | `fe42ea8` |
| 25 | The table sign is too quiet: no host name, low contrast, the screen can sleep | 📦 ✅ | `617653d` |
| 26 | Reliability shows "100%" for a user with 0 meals | 📦 ✅ | `32d56f0` |
| 27 | "Build your network" / "GinMai story" copy conflicts with the product philosophy | 📦 ✅ | `32d56f0` |
| 28b | The country picker has only 10 countries | 📦 ✅ | `2dabaa7` |
| 29 | "Your location is visible" sounds like live tracking | 📦 ✅ | `32d56f0` |
| 30 | Area showed "Suthep" instead of "Nimman" | 📦 ✅ | `ab883fc` |

**Verified:**
- **Jest:** `npm test` passes 88 tests in 16 suites. New test: `countries.test.ts` (common countries first, word-start search, longest dial-code match).
- **Maestro:** `13-map-ux` passes end to end:
  - country search ("viet" → Vietnam, not Germany; "thai" → Thailand)
  - live screen says "Your table is on the map"
  - table sign reads "Tester's table"
  - list shows "You're hosting"
  - Profile says "New", not "100%"
  - new Connections wording
  - the test Moment is cancelled afterwards
- **Maestro:** `07`, `08` and `12` still pass
- **Screenshots:** the map is centred on the user; the list is compact and the map shows below it; the table sign is orange with the host's name

**Notes:**
- #30 (Nimman vs Suthep) needs neighborhood data from Places, so it's done together with #13.
- Found while testing: without notification permission (#20), reminders logged `UNErrorDomain 2003` for every Moment. They now skip quietly (`d18e02c`).
- Found while testing: the country picker exposed the whole list to VoiceOver as one element. Fixed in `2dabaa7`.
- Metro crashed (#44) on almost every file edit during this phase. It's worth scheduling soon.

## Phase 5.5: Metro crash on style edits (#44)

**Verified:**
- After `expo start -c` and loading the app, Metro survived 10 consecutive edits to `table-sign.tsx`, including 5 that each introduced a new Tailwind class (`mt-[61px]` … `mt-[65px]`) to force a CSS rebuild. Before the upgrade, a single style edit usually killed it.
- No `addedFiles` error in the Metro log.
- `expo-doctor` passes 21/21, `npm test` passes 88 tests, and the app renders the same.

## Phase 5.6: Push notifications for guest and host events (#45)

**Database:** migration `20260930000000_host_push_notifications.sql`, applied through the SQL editor. It enables `pg_net`, adds `send_expo_push()` (not callable by clients), and adds two triggers:
- `notify_host_of_guest_event` on `connections`: guest joined, re-joined, arrived, cancelled or running late → host
- `notify_guests_of_cancellation` on `moments`: Moment cancelled → guests

**Verified** (Tester and Sam on one simulator; Expo's replies read from `net._http_response`):
- Sam joins Tester's Moment → a push was sent to Tester (rows 1, 3, 4, 5)
- Sam leaves → a push was sent to Tester (row 2)
- Tester cancels with Sam still in → "Plans changed" was sent to Sam (row 6)
- Every reply was Expo's "Could not find APNs credentials": the triggers fire and reach Expo, and only Apple delivery is missing
- **Jest:** 93 tests pass (new `config/notifications` suite; tap routing in `useNotifications`)

**To finish (the owner):** set up the Apple push key with `npx eas credentials` → iOS → `com.ginmai.app` → Push Notifications. Until then no push reaches any iPhone, including the existing eat-again match.

**Notes:**
- The iOS 27 simulator stopped returning Expo push tokens after repeated permission resets. `getExpoPushTokenAsync` now times out and logs after 15 s. Sam's token was set by hand for the test. Recheck on a real device in Phase 7.
- New issues logged: #50 (a previous account's joined Moments stay in memory after sign-out), #51 (no back button on the guest confirmation screen), #52 (no place name for current-location Moments).

## Phase 6: Visual consistency

| # | Issue | Status | Commit |
|---|---|---|---|
| 33 | Hard-coded off-token colors; the accent color is unused | 📦 ✅ | `b3a7722` |
| 34 | The Safety screen uses a different visual style | 📦 ✅ | `2a6708a` |
| 35 | Emoji and line icons are mixed; back arrows are inconsistent | 📦 ✅ | `2a6708a` |
| 36 | Mixed 12h and 24h time formats | 📦 ✅ | `c096e0b` |
| 37 | Map header safe-area gap, card/button seam, empty space on welcome/location screens | 📦 ✅ | `2a6708a` `c3305d6` |
| 38 | Duplicate titles ("Almost there", the Connections header) | 📦 ✅ | `c3305d6` |

## Phase 7.5: Google Places (#13, #30, #52)

**Key:** `EXPO_PUBLIC_GOOGLE_PLACES_KEY` in `app/.env` (gitignored). It's restricted to the iOS app `com.ginmai.app` and to Places API (New); a request without the bundle header is rejected ("Requests from this iOS client application <empty> are blocked").

**Verified:**
- **Jest:** 105 tests pass (new `neighborhoods` suite)
- **Maestro:** `16-places.yaml`:
  - current location reads "Nimman" (not "Suthep")
  - searching "khao soi mae" lists real restaurants above the keyboard, "Khao Soi Maesai" first
  - choosing it and creating a Moment shows "Khao Soi Maesai" on the live screen and the map
  - the test Moment is cancelled afterwards
- **Database:** the Moment saved `place_name` "Khao Soi Maesai", `area_name` "Santitham", and Google's exact coordinates

**Notes:**
- Autocomplete accepts at most five `includedPrimaryTypes`; six gave a 400
- Android will need its own key, restricted to the Android package and signing certificate

## Phase 7.8: Privacy Policy and deletion retention (#59, #7)

**Database:** migration `20261001000001_deletion_retention.sql`, applied through the SQL editor.
- Reports now outlive the reported account: the links are set to NULL, `reported_phone` is recorded at report time, and a 12-month purge (`purge_expired_reports`) runs daily if `pg_cron` is enabled.
- `delete_my_account` sets a deleted host's Moments to "Former member" and removes their note.

**Verified** with spare number `66823456789` ("Dee"), flow `18-delete-account.yaml`:
- Dee hosts a Moment; Tester reports Dee; Dee deletes the account through both confirmations and lands on the welcome screen
- the Moment is gone from the map; signing in again with the same number asks for a name, so the profile is deleted
- **Database:** Dee's Moment has `host_name` "Former member", with `host_id` and `note` NULL
- **Database:** the report survives: reporter kept, account link cleared, `reported_phone` +66823456789, purge clock started
- **Jest:** 110 tests pass; the `legal` suite checks that the Terms and Privacy Policy match `docs/legal/*.md` and agree on 12-month report retention

**Before launch:** fill in the placeholders ([Company name], [Company address], [contact email], [hosting region], [backup period]), get a Thai lawyer's review, and host the Privacy Policy at a public URL for App Store Connect.

## Phase 7.9: Full table and moments lock-down (#42, #60)
Branch `test/full-table`, from `feat/privacy-policy`.

While getting ready for the full-table test I found that the live `moments` policies weren't the repo's: an anonymous PATCH using only the public key was accepted. The M1 migration `20240101000003` had opened moments to anyone, and `20240101000005`, which was meant to close them again, never reached the live database.

**Fix, migration `20261002000000_lock_down_moments.sql`:**
- drops every `moments` policy by name and recreates them:
  - signed-out visitors: read open Moments only
  - members: open (minus blocks), own and joined
  - host only: insert, update, delete
- `claim_seat` trigger: locks the Moment and refuses a join that is full (`full:`), closed (`closed:`) or the host's own (`own:`), so two last-seat joins can't both succeed
- `sync_seats_on_connection` trigger: recounts `seats_taken` and flips full ↔ active on every connection change
- `protect_seats` trigger: nobody else can set those two fields
- existing counts are recounted
- revokes the legacy definer functions that took a user id

**App:**
- `joinMoment` and `leaveMoment` no longer write to `moments`; they read back what the database counted
- refusals map to plain words ("This meal is full.")

**Verified after applying `20261002000000`:**
- anonymous PATCH and DELETE on a Moment change 0 rows; an anonymous insert is refused
- the legacy functions return "permission denied"
- Ben's API join to the full table is refused ("full: this moment is full")
- a host PATCH of `seats_taken` is ignored, and a new Moment can't start as full
- 5 rounds of Ben and Kai racing for 1 seat: exactly 1 guest each time; the loser waited on the lock and got "full"
- **Maestro `19-full-table`:** Tester hosts 2 seats, Sam and Kai join, and Kai's "You're in" shows "0 seats open"
- **Maestro `19b`:** Ben's direct link shows "Full" with no Join, and Tester's live screen lists 2 guests. It also showed Kai as "Guest", which led to #61 and #62

**#61 and #62, migration `20261002000001_profile_privacy.sql`:**
- new read rule: people you share a Moment with
- other users can read only safe columns: name, verified badge, meal counts and status
- your own full row comes from `my_profile()`
- users can write only the fields the app sets
- the app loads its own profile through `my_profile()`

**Regression found and fixed:** re-running `18-delete-account` after `20261002000001` showed that new users couldn't save their name ("permission denied for table users"). PostgREST's upsert needs table-wide read access. Migration `20261002000002_complete_my_profile.sql` adds `complete_my_profile()`, which creates the caller's own row and takes the phone from the sign-in record. Direct inserts are revoked.

**Ended Moments (#63):** `expire_moments()` was never scheduled and skipped full tables, so 19 ended Moments going back to January were still "active" or "full" and readable by signed-out visitors. Migration `20261002000003_expire_moments.sql` covers `full` too, runs every 5 minutes with pg_cron, and closes the backlog.

**Final run, with all four migrations applied:**
- flows `19-full-table`, `19b-full-table-after`, `15-two-user` and `18-delete-account` pass
- no ended Moments are readable by signed-out visitors
- Jest: 113 tests pass; typecheck: 0 errors

**Cleanup:** `_reset-tester` now cancels through My Moments, because the map list never shows a full Moment, so full ones were never cleaned up.

## Phase 8: Backend audit (#64–#75)
Branch `security/backend-audit`. Plan: `docs/backend/access-matrix.md`, which lists what the app needs against what live allows. The live snapshot came from `supabase/schema/snapshot.sql`, plus the Supabase Advisors and Auth settings.

**`npm run security-check`** (`app/scripts/security-check.mjs`) checks every rule against live, signed out and as Tester, Sam, Kai and Ben.

**Before the fixes, 20 passed and 14 failed:**
- **Signed out:** A4 `nearby_moments` callable
- **Moments:** M2 move time/place, M3 post as any name, M4 expire in 2099
- **Connections:** C2 join as "completed", C3 move into a full Moment, C4 host swaps a guest
- **Users and feedback:** U2 change `phone_verified`, F1 feedback about a stranger
- **Reports:** R1 fake phone or "resolved" status, R2 reporter reads the reported person's phone
- **Connections list:** L1 fake Connection, L2 someone else's Connections
- **Realtime:** RT1 no live event

**Fixes:**
- Migrations `20261003000000_lock_down_writes`, `…01_connections_and_cleanup` and `…02_realtime_and_cron`.
- App: `matchStore` uses `my_connections()`; `reportStore` doesn't set `status` and reads only public columns.
- Jest: new `privacy.test.ts`.

**After applying all three migrations:**
- **`npm run security-check`: 34 passed, 0 failed.** RT1 passed on the second run, once the realtime server had picked up the newly published tables.
- **Maestro:** `07-host-manage`, `15-two-user`, `18-delete-account`, `19-full-table` and `19b` all pass against the locked-down backend.
  - 07 failed once: a tap landed while the map list was re-rendering live, and the rerun passed.
- `20261003000001` first failed on `DROP EXTENSION earthdistance`, because the unused `idx_moments_location` index used it. The index is now dropped first (`64ae5fe`).

**App types now match live:**
- `src/types/supabase.generated.ts` is generated from live.
- `database.ts` was synced: the dropped tables are removed, `reports` has its retention columns, and only callable functions are typed.
- `src/types/__tests__/schema.test.ts` fails if they drift apart, or if the app calls a function that isn't live. It was checked by putting back `get_user_connections`: the test failed.
- How to change the backend: `docs/backend/README.md`.

## New issues (found during Phase 1, not yet scheduled)

| # | Issue | Status | Commit |
|---|---|---|---|
| 39 | **Higher priority than it looked:** `create-moment` calls `getCurrentPositionAsync` without a catch. When location is unavailable it stays on "Loading…" and "Make visible" silently does nothing | 📦 ✅ | `6a34bb5` |
| 40 | expo-notifications 57 API changes: `removeNotificationSubscription` was removed (still called in `useNotifications.ts` cleanup), the handler needs `shouldShowBanner`/`shouldShowList`, and triggers need a `type` | 📦 ✅ | `4a8a2e2` |
| 42 | Screens about one Moment (live, confirmation, arrival, running-late, feedback, detail) looked it up in the active-only map list, so they showed "not found" once it filled up or ended; leaving a full Moment never gave the seat back; running-late never reached the host of a full Moment | 📦 ✅ | `bc6945c` `b0d9896` |
| 43 | "Eat again" feedback reported failure and mutual matches were never created (the client can't read the other person's feedback) | 📦 ✅ | `40ee54a` + migration `20261001000000` |
| 44 | Dev only: Metro crashes (`Cannot read properties of undefined (reading 'addedFiles')`) when NativeWind 4.2.1's Tailwind watcher fires under SDK 57's Metro. Fixed by upgrading to NativeWind 4.2.7. | 📦 ✅ | `88d28b2` |
| 45 | No push when a guest joins, arrives, cancels or runs late, and none to guests when a host cancels | 📦 ✅ (triggers confirmed; delivery needs APNs key) | `0521db5` |
| 46 | Settings > Blocked users was a dead link | 📦 ✅ | `69dbcab` |
| 47 | Nobody could report or block anyone; the Safety test button was the only way into the report screen, and its "Block" option was a TODO | 📦 ✅ (entry points; full flow in Phase 7) | `8fcaa4e` |
| 48 | Blocking had no effect: `blocks` was never read, and the join check used the legacy `blocked_users` table | 📦 ✅ (map + trigger; join rejection in Phase 7) | `8fcaa4e` |
| 49 | Leaving a Moment and re-joining it failed with "already joined" | 📦 ✅ | `40ee54a` |
| 50 | Signing out didn't clear the user's joined Moments; the next account inherited them | 📦 ✅ | `40ee54a` |
| 51 | The guest confirmation screen had no back button | 📦 ✅ | `40ee54a` |
| 52 | Moments created with "current location" had no place name ("Somewhere tasty", area shown twice) | 📦 ✅ | `ab883fc` |
| 53 | Hosts had no way to give feedback, so a mutual "eat again" match could never happen | 📦 ✅ | `40ee54a` |
| 54 | The host's guest list emptied once a guest arrived or finished | 📦 ✅ | `40ee54a` |
| 55 | Security: any signed-in user could insert `eat_again_matches` rows between any two people | 📦 ✅ | migration `20261001000000` |
| 56 | Profile "Edit" did nothing | 📦 ✅ | `40ee54a` |
| 57 | "Running late" was only offered after arriving | 📦 ✅ | `312a563` |
| 58 | Signing in from a Moment, the Menu or Profile left that screen in the back history twice | 📦 ✅ | `312a563` |
| 59 | Deleting an account erased reports about that person (so a reported user could wipe them and re-register), and left a deleted host's name on their Moments | 📦 ✅ | `6a04963` + migration `20261001000001` |
| 60 | **Security:** the live database still had the M1 "Anyone can …" policies on `moments`, so the public anon key alone could edit or delete any Moment. Guests could only join because of that hole: the app counted seats itself from its cache, which could overbook. Legacy `join_moment`/`leave_moment` could act as any user | 📦 ✅ | `8106104` + migration `20261002000000` |
| 61 | A host saw every guest who wasn't also hosting as "Guest": the only rule for reading another profile was "they're hosting an active Moment". Hidden in earlier tests because Sam had a stale January Moment | 📦 ✅ | migration `20261002000001` |
| 62 | **Privacy:** any signed-in user could read the phone number and push token of anyone whose profile they could see (a stranger read Tester's and Sam's numbers). Users could also edit their own `no_shows` and `status` | 📦 ✅ | migration `20261002000001` |
| 63 | Ended Moments were never closed (19 stale "active"/"full" rows back to January, readable by signed-out visitors) | 📦 ✅ | migration `20261002000003` |
| 64 | Hosts could post under any name, keep a Moment live until 2099, or move its time and place after guests joined | 📦 ✅ | `20261003000000` |
| 65 | **Security:** guests could move their seat into another (even full) Moment, skipping the seat and block checks; hosts could swap a guest for any user; joins could start as "completed"; anon was covered by the connections policies | 📦 ✅ | `20261003000000` |
| 66 | Users could change their own `phone`, `phone_verified` and `verified_at` | 📦 ✅ | `20261003000000` |
| 67 | Feedback could be written about anyone, for any Moment | 📦 ✅ | `20261003000000` |
| 68 | **Privacy:** reporters could read the reported person's phone number and admin notes, and file reports with a made-up phone or an already "resolved" status | 📦 ✅ | `20261003000000` + app |
| 69 | Anyone could list anyone's Connections (`get_user_connections(p_user_id)`) or add a fake Connection (`relationships`) | 📦 ✅ | `20261003000001` + app |
| 70 | anon and signed-in users held every privilege on every table (incl. TRUNCATE); legacy functions callable by anon (`nearby_moments`), no `search_path` on 8 functions | 📦 ✅ | `20261003000000`, `…01` |
| 71 | **App mismatch:** realtime publication had no tables, so the host's live screen and seat counts never updated live | 📦 ✅ | `20261003000002` |
| 72 | Email sign-in (and maybe anonymous sign-in) may be on: accounts without a phone check | ⬜ dashboard | |
| 73 | **Launch blocker:** SMS limit 30/hour for the whole project | ⬜ dashboard, before launch | |
| 74 | Test numbers and codes are in the repo; remove from Supabase at launch, keep repo private | ⬜ before launch | |
| 75 | The 12-month report purge (#59) was never scheduled | 📦 ✅ | `20261003000002` |
| 41 | `tsc` failed (477 errors): TS 6 rejects `baseUrl` and no longer auto-loads `@types`; old tests used a stale `User` shape; an unused client push path had an invalid payload type | 📦 ✅ `npm run typecheck` passes | `f50060e` |

## Phase 1.5: expo-notifications 57 (#40)

Done ahead of Phase 2 because it was a runtime regression from the SDK upgrade.

**Verified:**
- **Jest:** new `useNotifications.test.tsx` checks that listeners are removed without the removed API, that the handler uses banner/list, and that triggers are typed. All 3 tests fail against the old code. The full suite passes: 44 tests in 7 suites.
- **Simulator:** with the old code, each fast refresh logged `TypeError: undefined is not a function` from the listener cleanup. With the fix, two fast refreshes logged 0 errors.
- **Simulator:** a foreground push sent with `xcrun simctl push` shows a banner, and the app logs "Notification received".

**Verified:**
- **Colors:** no hard-coded hex values remain outside `src/theme/colors.ts`, and none of the off-token grays (`#9CA3AF`, `#6B7280`, `#1F2937`) are left. `tailwind.config.js` and `colors.ts` are kept in sync by a test.
- **Jest:** `npm test` passes 96 tests (new `theme/colors` and `formatTime` suites)
- **Maestro:** `06`, `07`, `08`, `11` and `13` pass after the restyle
- **Screenshots:**
  - map header without the gap, and no card/button seam
  - outline icons in the menu, Profile and Safety
  - welcome and location screens centred
  - compact time picker, with "Where?" still in view
- **Accessibility:** decorative icons are hidden from VoiceOver, so rows read "Profile" and not ", Profile"; icon-only buttons are labelled

## Phase 7: Two-user E2E

**Database:** migration `20261001000000_server_side_matching.sql`, applied through the SQL editor. The first attempt hit a deadlock with the running app and rolled back cleanly; the second attempt with the app closed succeeded. It adds the `create_match_on_mutual_feedback` trigger, removes client inserts on `eat_again_matches`, and backfills existing mutual pairs.

**Verified** with Tester and Sam on one simulator (`15-two-user.yaml` plus manual steps):
- Sam signs in from Tester's Moment and joins. Back from "You're in" returns to the Moment and then the map; the map says "You're in", not "You're hosting".
- Sam leaves, then re-joins without an error.
- "Running a few minutes late" on "You're in" → "Tester knows you're running late"; then "I'm here" → "Found them!" → Great + eat again, with no error.
- Tester sees Sam as "Done" and taps "How was it with Sam?" → Great + eat again → both Connections show each other ("2 meals together").
- Tester reports Sam ("Report Submitted") and blocks Sam. Sam's map no longer shows Tester's Moments; joining one by direct link gives "You can't join this meal.". Unblock works.
- Profile Edit: rename to "Samuel" survives an app restart, then renamed back.
- **Jest:** 100 tests pass (new `momentStore.phase7` suite; the #43 test fails on the old code).

**Still open:**
- Real push delivery on a device (needs the APNs key)
- Delete account on a spare number (#7)


| Flow | Status | Notes |
|---|---|---|
| Join as a guest | ✅ | |
| Arrival / "Found them!" | ✅ | |
| Running late | ✅ (moved before arrival, #57) | |
| Feedback / "eat again" match | ✅ (match made by trigger) | |
| Guest moment-detail view | ✅ | |
| Host's live screen stays up when the table fills (#42) | ✅ | flows 19, 19b |
| "Eat again" feedback and mutual match (#43) | ✅ | |
| Report / block another user, blocked join rejected (#47, #48) | ✅ | |
| Leave and re-join a Moment (#49) | ✅ | |
| Delete account on a spare number (#7) | ✅ | flow 18 |
| Block / report a real user | ✅ | |
| Profile Edit | ✅ (#56) | |
| Real push delivery (physical device) | ⬜ (needs APNs key + device) | |
