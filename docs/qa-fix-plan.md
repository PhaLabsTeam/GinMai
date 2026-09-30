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
| 1 | Auth & data correctness | `fix/auth-and-data` | ⬜ | — |
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
| 1 | Auth listener race overwrites the fresh profile with stale data; the listener is re-registered on every `initialize` | ⬜ | |
| 2 | Returning users must re-enter their name, which overwrites the saved one. Change to phone → code → name only if new. | ⬜ | |
| 8 | After sign-up, `returnTo` is ignored; the welcome screen's redirect replaces the top screen | ⬜ | |
| 9 | A failed Moments fetch shows "Nothing here yet" plus an empty error toast | ⬜ | |
| 10 | Raw Twilio or Supabase errors are shown to users | ⬜ | |
| 31 | The code screen shows "999999999" without the country code | ⬜ | |

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
