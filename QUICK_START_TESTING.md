# 🚀 Quick Start: Manual Testing

## Right Now: What You Need to Do

### 1. Check the iOS Simulator

Look at your screen - you should see the iOS Simulator with GinMai app loaded.

**See the app?** ✅ Great! Proceed to step 2.

**Don't see it?** Try:
- Look for Simulator.app in your dock or open applications
- In terminal running Expo, press `i` to launch iOS simulator
- Wait 30 seconds for app to load

---

### 2. Open the Test Guide

```bash
# Open in your editor:
open MANUAL_TEST_GUIDE.md

# Or read it from terminal:
cat MANUAL_TEST_GUIDE.md
```

This guide has **step-by-step instructions** for 5 test flows.

---

### 3. Test Flow 1: Authentication

**In the simulator, do this:**

1. Look at the app screen
2. Tap "Get started" button
3. Grant location permission when asked
4. Enter phone: `+66812345678`
5. Tap "Continue"
6. Enter OTP: `1234`
7. Enter name: `Test User`
8. Tap "Continue"

**Expected:** You land on a map screen

**Mark results in:** `MANUAL_TEST_RESULTS.md`

---

### 4. Test Flow 2: Create Moment

**From the map screen:**

1. Tap "Share where you're eating"
2. Select time: "Now"
3. Tap "Next"
4. Select "Use current location"
5. Tap "Next"
6. Set seats: 2, duration: "Normal"
7. Tap "Make visible"
8. Tap "View on map"

**Expected:** See your moment marker on map

**Mark results in:** `MANUAL_TEST_RESULTS.md`

---

### 5. Test Flows 3, 4, 5

Continue following `MANUAL_TEST_GUIDE.md` for:
- Flow 3: View moment details
- Flow 4: Notifications
- Flow 5: Profile & logout

---

### 6. After Manual Tests: Run Maestro

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all E2E tests
cd /Users/soporte_it/ginmai
maestro test .maestro/flows/
```

---

### 7. Document Results

Fill in `MANUAL_TEST_RESULTS.md` as you go:
- Mark ✅ for passing steps
- Mark ❌ for failures
- Add notes for any issues

---

### 8. Commit When Done

```bash
git add MANUAL_TEST_RESULTS.md TESTING.md
git commit -m "docs: manual test results - [all passed OR issues found]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

---

## 📊 Progress Tracker

- [ ] Flow 1: Auth & Onboarding
- [ ] Flow 2: Create Moment
- [ ] Flow 3: View Details
- [ ] Flow 4: Notifications
- [ ] Flow 5: Profile & Logout
- [ ] Maestro Tests (5 flows)
- [ ] Document Results
- [ ] Commit & Push

---

## ⏱️ Time: ~60-90 minutes total

- Manual: 30-45 min
- Maestro: 20-30 min
- Docs: 10 min

---

## 🆘 Problems?

**App crashed?**
- Document in MANUAL_TEST_RESULTS.md
- Note exact steps to reproduce
- Try to continue other flows

**Stuck on a screen?**
- Try restarting app (reload in Expo)
- Check Expo terminal for errors

**Can't find UI element?**
- Document in results
- Take screenshot if helpful
- Move to next flow

---

## ✅ Done Testing?

**If all tests passed:**
1. Update TESTING.md: change status to "fully verified ✅"
2. Commit results
3. **Next:** Plan M4 features (push notifications)

**If issues found:**
1. List all issues in MANUAL_TEST_RESULTS.md
2. Commit results
3. **Next:** Create fix plan

---

## 📁 Files

- **Read:** `MANUAL_TEST_GUIDE.md` (detailed steps)
- **Edit:** `MANUAL_TEST_RESULTS.md` (record results here)
- **Check:** `TESTING_SESSION_SUMMARY.md` (full overview)

---

**You got this! Start testing! 🎯**
