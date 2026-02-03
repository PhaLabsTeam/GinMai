# M4 Manual Testing Checklist

**Date:** February 3, 2026
**Tester:** Manual testing session
**Build:** Latest (commit 00a3ab9)

---

## 🎯 Testing Goals

Verify all M4 features work correctly:
1. Push Notifications
2. Running Late Reminders
3. Reliability Signals
4. Enhanced Eat Again Matching

---

## ⚙️ Pre-Test Setup

### Step 1: Database Migration (REQUIRED)

```bash
cd /Users/soporte_it/ginmai/supabase
supabase db push
```

**What this does:** Creates the `eat_again_matches` table needed for Phase 4

**Expected output:** Migration successful

---

### Step 2: Verify App is Running

- [ ] iOS Simulator is open
- [ ] GinMai app is loaded
- [ ] No red error screens
- [ ] Expo dev server running (already confirmed ✅)

---

## 📱 Phase 1 Testing: Push Notifications

### Test 1.1: Permission Request

**Steps:**
1. Fresh install or clear app data
2. Open app
3. Look for notification permission prompt

**Expected:**
- iOS permission dialog appears
- Options: "Allow" / "Don't Allow"

**Result:** ⏳ PENDING

---

### Test 1.2: Push Token Generated

**Steps:**
1. After granting permissions
2. Check Expo dev server console output

**Expected:**
```
✅ Notification permissions granted
📱 Expo Push Token: ExponentPushToken[xxxxx]
✅ Push token received: ExponentPushToken[xxxxx]
```

**Result:** ⏳ PENDING

**Actual Token Received:**
```
[Note: Copy actual token here for reference]
```

---

### Test 1.3: Push Token Stored in Database

**Steps:**
1. After authenticating with phone/OTP
2. Check console for: `📝 Storing push token for user: [userId]`

**Expected:**
- Token stored without errors
- Console confirms storage

**Result:** ⏳ PENDING

---

### Test 1.4: Local Notification Test

**Steps:**
1. You can test local notifications by scheduling one
2. Use the `sendTestNotification` function

**Expected:**
- Notification appears after delay
- Can tap notification

**Result:** ⏳ PENDING

---

## ⏰ Phase 2 Testing: Running Late Reminders

### Test 2.1: Create Future Moment

**Steps:**
1. Create a moment that starts in 15 minutes from now
2. Check console for: `⏰ Scheduled reminder for moment: [momentId]`
3. Note the time: Reminder should fire in ~5 minutes (10 min before meal)

**Expected:**
- Moment created successfully
- Reminder scheduled (check console)
- Console shows: "Reminder will fire in X minutes"

**Result:** ⏳ PENDING

**Moment created at:** ___________
**Meal starts at:** ___________
**Reminder should fire at:** ___________

---

### Test 2.2: Reminder Notification Appears

**Steps:**
1. Wait until 10 minutes before the moment starts
2. Watch for notification

**Expected:**
- Notification appears with title: "Your meal starts soon"
- Body: "Your lunch at [location] starts in 10 minutes. Running late?"

**Result:** ⏳ PENDING

---

### Test 2.3: Running Late Screen

**Steps:**
1. Tap the reminder notification
2. App should open to "Running late?" screen

**Expected:**
- Screen shows: "Your lunch starts soon"
- Location and time displayed
- Two buttons: "Yes, I'm running late" and "No, I'm on time"

**Result:** ⏳ PENDING

---

### Test 2.4: Mark as Running Late

**Steps:**
1. On "Running late?" screen
2. Tap "Yes, I'm running late"

**Expected:**
- Console shows: `✅ User marked as running late for moment: [momentId]`
- Screen closes
- Status updated in database

**Result:** ⏳ PENDING

---

### Test 2.5: Cancel Reminder

**Steps:**
1. Create a moment with reminder
2. Cancel the moment before reminder fires
3. Check console for: `✅ Cancelled running late reminder for moment: [momentId]`

**Expected:**
- Reminder cancelled
- No notification appears

**Result:** ⏳ PENDING

---

## ⭐ Phase 3 Testing: Reliability Signals

### Test 3.1: View Profile Reliability

**Steps:**
1. Go to Profile screen
2. Scroll to "Reliability" section

**Expected:**
- Reliability card is displayed
- Shows: badge, percentage, stats
- New users show "🆕 New" badge

**Result:** ⏳ PENDING

---

### Test 3.2: Reliability Calculation

**Steps:**
1. Check your user stats in profile
2. Verify reliability calculation

**Expected:**
For new users (< 3 meals):
- Badge: 🆕 New
- Percentage: 100% (or N/A)
- Description: "New to GinMai"

For users with history:
- Calculation: (meals_completed / total_meals) × 100
- Badge matches percentage:
  - 95%+: ⭐ Reliable
  - 80-94%: ✅ Good
  - 60-79%: 👍 Fair
  - <60%: ⚠️ Warning

**Result:** ⏳ PENDING

**Your stats:**
- Meals hosted: _____
- Meals joined: _____
- No-shows: _____
- Calculated reliability: _____%

---

### Test 3.3: Reliability Badge Colors

**Steps:**
1. Look at reliability badge
2. Verify color matches status

**Expected:**
- Reliable: Green (#22C55E)
- Good: Blue (#3B82F6)
- Fair: Amber (#F59E0B)
- Warning: Red (#EF4444)
- New: Gray (#9CA3AF)

**Result:** ⏳ PENDING

---

## 🤝 Phase 4 Testing: Enhanced Eat Again Matching

### Test 4.1: Submit Feedback with "Eat Again"

**Steps:**
1. Complete a meal with another user (or test with yourself)
2. Go to feedback screen
3. Select "I'd eat with them again"
4. Submit feedback

**Expected:**
- Feedback submitted successfully
- Console shows feedback processing

**Result:** ⏳ PENDING

---

### Test 4.2: Mutual Match Detection

**Steps:**
1. Both users submit feedback with "eat again" selected
2. Check console for: `🎉 Mutual eat-again match found!`

**Expected:**
- Match detected automatically
- Match record created
- Console confirms: `✅ Match created and notifications sent`

**Result:** ⏳ PENDING

**Note:** For full testing, you'll need two users/devices. Can partially test with single user.

---

### Test 4.3: Match Notification

**Steps:**
1. After mutual match is created
2. Check for push notification

**Expected:**
- Notification title: "You matched! 🎉"
- Body: "You and [Name] want to eat again!"
- Both users receive notification

**Result:** ⏳ PENDING

---

### Test 4.4: Connections Screen

**Steps:**
1. Go to Profile
2. Tap "Connections" card
3. Check connections screen

**Expected:**
- Screen shows "Connections" title
- List of matched users (if any)
- Each connection shows:
  - Name + verification badge
  - Reliability badge
  - Last meal together
  - Total meals together
- Empty state if no connections: "No connections yet"

**Result:** ⏳ PENDING

---

### Test 4.5: Connections Empty State

**Steps:**
1. New user with no matches
2. Open Connections screen

**Expected:**
- Shows: 🤝 emoji
- Text: "No connections yet"
- Helpful message about how to get connections

**Result:** ⏳ PENDING

---

## 🔄 Integration Tests

### Test I.1: Complete User Flow

**Full journey test:**

1. [ ] Sign up new user
2. [ ] Grant notification permissions
3. [ ] Create moment (15 min future)
4. [ ] Wait for reminder (10 min before)
5. [ ] Mark as running late
6. [ ] Complete meal
7. [ ] Submit feedback with "eat again"
8. [ ] Check profile reliability
9. [ ] Open connections screen

**Expected:** All features work together smoothly

**Result:** ⏳ PENDING

---

### Test I.2: Background/Foreground Switching

**Steps:**
1. Open app (foreground)
2. Create moment or trigger notification
3. Background the app
4. Trigger another notification
5. Return to foreground

**Expected:**
- Foreground: In-app toast appears
- Background: Push notification arrives
- Notifications don't duplicate

**Result:** ⏳ PENDING

---

## 📊 Test Results Summary

| Phase | Tests | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| 1. Push Notifications | 4 | 0 | 0 | 4 |
| 2. Running Late | 5 | 0 | 0 | 5 |
| 3. Reliability | 3 | 0 | 0 | 3 |
| 4. Matching | 5 | 0 | 0 | 5 |
| Integration | 2 | 0 | 0 | 2 |
| **TOTAL** | **19** | **0** | **0** | **19** |

---

## 🐛 Issues Found

### Critical Issues
_None identified yet_

### Major Issues
_None identified yet_

### Minor Issues
_None identified yet_

---

## 📝 Notes & Observations

_Add any observations during testing:_

---

## ✅ Sign-Off

**Testing Status:** ⏳ IN PROGRESS

**Date Started:** February 3, 2026
**Date Completed:** _____________

**Overall Result:**
- [ ] ✅ All tests passed
- [ ] ⚠️ Some issues found (see above)
- [ ] ❌ Critical issues blocking release

**Next Steps:**
_Based on test results, note what should happen next_

---

## 💡 Testing Tips

1. **Console is your friend** - Watch Expo console for debug logs
2. **Physical device recommended** - For push notification testing
3. **Test incrementally** - Don't skip to later phases
4. **Document everything** - Note exact steps and results
5. **Take screenshots** - For any issues found

---

**Good luck with testing! 🚀**
