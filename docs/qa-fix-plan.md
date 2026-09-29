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
| 2 | Host flow & navigation | `fix/host-flow` | ⬜ | — |
| 3 | Create & sign-in inputs | `fix/create-flow` | ⬜ | — |
| 4 | Settings, safety, App Store readiness | `fix/app-store-readiness` | ⬜ | — |
| 5 | Map & product-feel UX | `fix/ux-polish` | ⬜ | — |
| 6 | Visual consistency | `refactor/design-consistency` | ⬜ | — |
| 7 | Two-user end-to-end testing | `test/two-user-e2e` | ⬜ | — |

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
| 3 | A host can't get back to their live Moment: no back button, "Your moment" is disabled, My Moments is a dead end | ⬜ | |
| 4 | "Cancel this meal" cancels on one tap with no confirmation | ⬜ | |
| 5 | Hard-coded "8 min walk" and "~฿150" on moment detail | ⬜ | |
| 11 | Unlabeled floating `›` button on 13 screens with different actions (join, skip, duplicate submit, stacked maps) | ⬜ | |
| 16 | Menu → Safety only closes the menu | ⬜ | |

## Phase 3: Create & sign-in inputs

| # | Issue | Status | Commit |
|---|---|---|---|
| 12 | "Pick a time…" has no time picker and silently uses "now" | ⬜ | |
| 13 | Place search uses the address geocoder and can't find restaurants; switch to Google Places | ⬜ | |
| 14 | The keyboard covers the place search input and results | ⬜ | |
| 15 | One-time code: fast typing drops digits, paste breaks, no SMS autofill | ⬜ | |
| 24 | "Lunch" is hard-coded at every time of day | ⬜ | |
| 32 | No obvious way to close the keyboard on the note field | ⬜ | |

## Phase 4: Settings, safety, App Store readiness

| # | Issue | Status | Commit |
|---|---|---|---|
| 6 | Settings toggles don't save and have no effect; "Auto-accept" has nothing to control | ⬜ | |
| 7 | "Delete account" does nothing (App Store requirement) | ⬜ | |
| 17 | The "terms" link isn't tappable, and no terms exist | ⬜ | |
| 18 | Test "Report Inappropriate Behavior" button shows on the Safety screen | ⬜ | |
| 19 | The Safety banner promises location sharing that doesn't exist | ⬜ | |
| 20 | Notification permission is requested at launch | ⬜ | |
| 21 | The location permission prompt uses generic text | ⬜ | |
| 28a | Safety lists only the US embassy; Tourist Police should come first | ⬜ | |

## Phase 5: Map & product-feel UX

| # | Issue | Status | Commit |
|---|---|---|---|
| 22 | The map doesn't center on the user; the location dot sometimes disappears | ⬜ | |
| 23 | The list panel covers the whole map; your own Moment isn't marked | ⬜ | |
| 25 | The table sign is too quiet: no host name, low contrast, the screen can sleep | ⬜ | |
| 26 | Reliability shows "100%" for a user with 0 meals | ⬜ | |
| 27 | "Build your network" / "GinMai story" copy conflicts with the product philosophy | ⬜ | |
| 28b | The country picker has only 10 countries | ⬜ | |
| 29 | "Your location is visible" sounds like live tracking | ⬜ | |
| 30 | Area shows "Suthep" instead of "Nimman" | ⬜ | |

## Phase 6: Visual consistency

| # | Issue | Status | Commit |
|---|---|---|---|
| 33 | Hard-coded off-token colors; the accent color is unused | ⬜ | |
| 34 | The Safety screen uses a different visual style | ⬜ | |
| 35 | Emoji and line icons are mixed; back arrows are inconsistent | ⬜ | |
| 36 | Mixed 12h and 24h time formats | ⬜ | |
| 37 | Map header safe-area gap, card/button seam, empty space on welcome/location screens | ⬜ | |
| 38 | Duplicate titles ("Almost there", the Connections header) | ⬜ | |

## New issues (found during Phase 1, not yet scheduled)

| # | Issue | Status | Commit |
|---|---|---|---|
| 39 | `create-moment` calls `getCurrentPositionAsync` without a catch, so an unavailable location causes an unhandled promise rejection | ⬜ | |
| 40 | expo-notifications 57 API changes: `removeNotificationSubscription` was removed (still called in `useNotifications.ts` cleanup), the handler needs `shouldShowBanner`/`shouldShowList`, and triggers need a `type` | 📦 ✅ | `4a8a2e2` |
| 41 | `tsc` fails: TypeScript 6 rejects `baseUrl` in `tsconfig.json`, and the test files have no Jest type definitions. Also `notificationStore.ts` builds an `"info"` payload that isn't in `PushNotificationData`'s type union (type-only; sending works) | ⬜ | |

## Phase 1.5: expo-notifications 57 (#40)

Done ahead of Phase 2 because it was a runtime regression from the SDK upgrade.

**Verified:**
- **Jest:** new `useNotifications.test.tsx` checks that listeners are removed without the removed API, that the handler uses banner/list, and that triggers are typed. All 3 tests fail against the old code. The full suite passes: 44 tests in 7 suites.
- **Simulator:** with the old code, each fast refresh logged `TypeError: undefined is not a function` from the listener cleanup. With the fix, two fast refreshes logged 0 errors.
- **Simulator:** a foreground push sent with `xcrun simctl push` shows a banner, and the app logs "Notification received".

## Phase 7: Two-user E2E

| Flow | Status | Notes |
|---|---|---|
| Join as a guest | ⬜ | |
| Arrival / "Found them!" | ⬜ | |
| Running late | ⬜ | |
| Feedback / "eat again" match | ⬜ | |
| Guest moment-detail view | ⬜ | |
| Block / report a real user | ⬜ | |
| Profile Edit | ⬜ | |
| Real push delivery (physical device) | ⬜ | |
