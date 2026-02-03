# Manual Testing Guide - GinMai App

## 🎯 Purpose

This guide helps you manually test all M1-M3 features to verify the testing infrastructure didn't break anything.

**Current Status:**
- ✅ Expo dev server running
- ✅ iOS Simulator launched
- ⏳ Manual testing needed

---

## 📋 Pre-Test Checklist

Before you begin, ensure:

- [ ] Expo is running (you should see it in terminal)
- [ ] iOS Simulator is open and showing the GinMai app
- [ ] You have `MANUAL_TEST_RESULTS.md` open to record results
- [ ] Simulator is in a fresh state (consider resetting if needed)

**To reset simulator:**
```bash
# In simulator: Device → Erase All Content and Settings
# Then reload the app in Expo
```

---

## 🧪 Test Flows

### Flow 1: Authentication & Onboarding (First-Time User)

**Goal:** Verify user can sign up and reach the map screen

#### Steps:

1. **Launch App**
   - Look at simulator
   - Should see GinMai welcome/splash screen
   - **Record:** Does welcome screen appear? ✅ / ❌

2. **Start Signup**
   - Tap "Get started" button (or similar)
   - **Record:** Does button work? ✅ / ❌

3. **Location Permission**
   - iOS permission dialog should appear: "GinMai would like to access your location"
   - Tap "Allow While Using App"
   - **Record:** Permission granted? ✅ / ❌

4. **Phone Number Entry**
   - Screen should show phone input
   - Enter: `+66812345678` (or any Thai number)
   - Tap "Continue"
   - **Record:** Can enter phone and proceed? ✅ / ❌

5. **OTP Verification**
   - Screen should show OTP input (6 digits)
   - Enter: `1234` (DEV_MODE mock OTP)
   - Should auto-proceed or have a submit button
   - **Record:** OTP accepted? ✅ / ❌

6. **Name Entry**
   - Screen should ask for first name
   - Enter: `Test User`
   - Tap "Continue"
   - **Record:** Name saved and proceeded? ✅ / ❌

7. **Map Screen**
   - Should land on map view
   - Map should show Chiang Mai area (or your location)
   - Should see a button like "Share where you're eating" or similar
   - **Record:** Map loads correctly? ✅ / ❌

**✅ Flow 1 Complete if:** All steps passed and you're on the map screen

**❌ Flow 1 Failed if:** Any red screens, crashes, or stuck screens

---

### Flow 2: Create a Moment

**Goal:** Verify host can create a moment that appears on map

#### Prerequisites:
- You completed Flow 1 (authenticated and on map)

#### Steps:

1. **Open Create Flow**
   - From map screen, tap "Share where you're eating" button
   - Should open create moment screen
   - **Record:** Create screen opens? ✅ / ❌

2. **Select Time**
   - Should see time options (Now, 30min, 1hr, etc.)
   - Select "Now"
   - Tap "Next"
   - **Record:** Time selection works? ✅ / ❌

3. **Select Location**
   - Should see location selection screen
   - Options might include: "Use current location", "Search for place", or map picker
   - Tap "Use current location" (easiest)
   - Tap "Next"
   - **Record:** Location selected? ✅ / ❌

4. **Configure Moment**
   - Should see seats and duration options
   - Select seats: **2**
   - Select duration: **Normal (1 hour)**
   - (Optional) Add note: `Testing moment creation`
   - Tap "Make visible" or "Create moment"
   - **Record:** Configuration options work? ✅ / ❌

5. **Moment Live Screen**
   - Should redirect to "Moment Live" screen
   - Shows message like "Lunch visible" or "Your moment is live"
   - Should show moment details (time, seats, etc.)
   - Tap "View on map" button
   - **Record:** Moment live screen appears? ✅ / ❌

6. **Verify on Map**
   - Should return to map screen
   - Should see a marker with your name/avatar
   - Marker should be at the location you selected
   - **Record:** Moment visible on map? ✅ / ❌

**✅ Flow 2 Complete if:** Moment created and visible on map

**❌ Flow 2 Failed if:** Cannot create moment or it doesn't appear

---

### Flow 3: View Moment Details

**Goal:** Verify moment details sheet displays correctly

#### Prerequisites:
- You completed Flow 2 (moment visible on map)

#### Steps:

1. **Tap Moment Marker**
   - On map, tap the marker you just created
   - Should open a bottom sheet or modal with moment details
   - **Record:** Details sheet opens? ✅ / ❌

2. **Verify Details Display**
   - Check that these are shown correctly:
     - [ ] Time (should say "Now" or current time)
     - [ ] Location (should match what you selected)
     - [ ] Seats available (should show 2 total, 0 taken)
     - [ ] Duration (should say "Normal" or "1 hour")
     - [ ] Your name as host
     - [ ] Note if you added one
   - **Record:** All details correct? ✅ / ❌

3. **Verify Cannot Join Own Moment**
   - Look for "Join" button
   - Button should be:
     - Disabled/grayed out, OR
     - Not visible for your own moments
   - **Record:** Join button properly disabled? ✅ / ❌

4. **Close Details**
   - Tap outside sheet or close button
   - Should return to map view
   - **Record:** Can close details? ✅ / ❌

**✅ Flow 3 Complete if:** Details display correctly and you cannot join your own moment

**❌ Flow 3 Failed if:** Missing info or can incorrectly join own moment

---

### Flow 4: In-App Notifications

**Goal:** Verify notification system doesn't crash

#### Steps:

1. **Find Notification UI**
   - Look for bell icon, notification tab, or notification indicator
   - If you can't find it, that's okay - may not have visible UI yet
   - **Record:** Found notification UI? ✅ / ❌ / N/A

2. **Open Notifications**
   - If UI exists, tap to open
   - Should show notification panel/screen
   - May be empty (that's fine)
   - **Record:** Notification panel works? ✅ / ❌ / N/A

3. **Verify No Crash**
   - Main goal: ensure notifications don't cause crashes
   - If panel opens and closes without errors, that's success
   - **Record:** No crashes? ✅ / ❌

**✅ Flow 4 Complete if:** Notification system works without crashes (even if empty)

**❌ Flow 4 Failed if:** Crashes when accessing notifications

---

### Flow 5: Profile & Settings

**Goal:** Verify profile, settings, logout, and re-login work

#### Steps:

1. **Navigate to Profile**
   - Find profile tab/button (usually bottom navigation or menu)
   - Tap to open profile screen
   - **Record:** Profile screen opens? ✅ / ❌

2. **Verify Profile Info**
   - Should display:
     - [ ] Your name: "Test User"
     - [ ] Your phone: +66812345678
     - [ ] Verified badge or indicator
     - [ ] Stats (may be 0 for new user)
   - **Record:** Profile info correct? ✅ / ❌

3. **Navigate to Settings**
   - Find and tap "Settings" button/link
   - Should open settings screen
   - **Record:** Settings screen loads? ✅ / ❌

4. **Logout**
   - In settings, find "Log out" button
   - Tap "Log out"
   - May show confirmation dialog
   - Confirm logout
   - **Record:** Logout works? ✅ / ❌

5. **Verify Logout Complete**
   - Should return to welcome/login screen
   - Should NOT still show map or authenticated state
   - **Record:** Returned to welcome? ✅ / ❌

6. **Re-Login**
   - Tap "Get started" again
   - Enter same phone: +66812345678
   - Enter OTP: 1234
   - Should recognize existing user (may skip name entry)
   - Should land back on map
   - **Record:** Re-login successful? ✅ / ❌

**✅ Flow 5 Complete if:** Can logout and log back in successfully

**❌ Flow 5 Failed if:** Logout fails or cannot re-login

---

## 📊 Recording Results

As you complete each flow, update `MANUAL_TEST_RESULTS.md`:

1. Mark each checkbox ✅ or ❌
2. Fill in "Actual Result" sections
3. Document any issues in "Issues Found"
4. Update the Pass/Fail status for each flow

Example:
```markdown
### Flow 1: Authentication & Onboarding

**Status:** ✅ PASSED

**Test Steps:**
1. [x] App opens to welcome screen
2. [x] Tap "Get started" button
...

**Actual Result:**
All steps completed successfully. User authenticated and landed on map screen.

**Issues Found:**
None

**Pass/Fail:** ✅ PASSED
```

---

## 🐛 If You Find Issues

### Critical Issues (Red Screens, Crashes)
1. **Don't panic** - document what you did
2. Take screenshot if possible
3. Note exact steps to reproduce
4. Check if it's consistent (happens every time)
5. Document in MANUAL_TEST_RESULTS.md under "Critical Issues"

### Minor Issues (UI glitches, typos)
1. Document in "Minor Issues" section
2. Note if it blocks testing or is cosmetic
3. Can likely proceed with other tests

### When to Stop Testing
- If app crashes repeatedly and won't start
- If authentication is completely broken
- If you cannot proceed past a certain point

---

## ✅ Success Criteria

**All tests pass if:**
- [ ] All 5 flows completed without critical errors
- [ ] Can authenticate, create moment, view details
- [ ] Profile and logout work
- [ ] No red screens or crashes
- [ ] All checkboxes in MANUAL_TEST_RESULTS.md are ✅

**Next step:** Run Maestro E2E tests

---

## 🤖 After Manual Testing: Maestro E2E Tests

Once manual tests pass, proceed to automated testing:

### Install Maestro

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro -v
```

### Run Tests

```bash
# Make sure app is running in simulator
# In one terminal: cd app && npx expo start --ios

# In another terminal, from project root:
cd /Users/soporte_it/ginmai

# Run all E2E tests
maestro test .maestro/flows/

# Or run individually:
maestro test .maestro/flows/01-auth-signup.yaml
maestro test .maestro/flows/02-create-moment.yaml
maestro test .maestro/flows/03-join-moment.yaml
maestro test .maestro/flows/04-arrival-flow.yaml
maestro test .maestro/flows/05-feedback-flow.yaml
```

### Record Maestro Results

Update MANUAL_TEST_RESULTS.md with:
- Which tests passed ✅
- Which tests failed ❌
- Any error messages
- Total execution time

---

## 📝 Final Steps

1. **Complete MANUAL_TEST_RESULTS.md**
   - All flows documented
   - All issues listed
   - Overall conclusion filled

2. **Update TESTING.md**
   - Change status to "fully verified ✅" if all passed
   - Or note issues found if any

3. **Commit Results**
   ```bash
   git add MANUAL_TEST_RESULTS.md TESTING.md
   git commit -m "docs: manual test results - [summary]"
   git push origin main
   ```

4. **Next Steps Decision**
   - If all passed → Plan M4 features
   - If issues found → Fix and re-test

---

## ⏱️ Estimated Time

- **Manual Testing (Flows 1-5):** 30-45 minutes
- **Maestro E2E Tests:** 20-30 minutes
- **Documentation:** 10 minutes
- **Total:** ~60-90 minutes

---

## 🆘 Need Help?

If you get stuck:
1. Check simulator console for errors
2. Check Expo terminal for error messages
3. Try resetting simulator and restarting
4. Document the issue and move to next flow if possible

**Safe Revert Point:** Commit `0af95e8` if everything is broken
