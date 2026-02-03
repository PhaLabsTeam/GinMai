# GinMai Development Backlog

## Current Sprint: M4 - Push Notifications & Reliability

**Focus:** Implement push notifications, running late reminders, and reliability signals

---

## 🐛 Known Issues (From Manual Testing - Feb 3, 2026)

### Priority: High (UX Issues)

#### Issue #1: No Navigation Back to Map from "Moment Live" Screen

**Status:** 🔴 Open
**Severity:** Major (UX Problem)
**Found:** Manual testing, February 3, 2026
**Location:** `app/moment-live.tsx`

**Description:**
After creating a moment, users land on the "Moment Live" screen but there's no way to navigate back to the map to browse other available moments without canceling their own moment.

**Current Behavior:**
- Only navigation options:
  1. "Cancel this meal" → Deletes moment and goes to map (destructive)
  2. "Show table sign" → Goes to table sign screen (different purpose)

**Expected Behavior:**
- Add "Back to map" or "View moments" button
- Should return to map without canceling moment
- Allow browsing other moments while keeping own moment active

**Impact:**
- Users cannot browse other moments after creating their own
- Limits discoverability
- Poor UX for hosts who want to explore

**Fix Estimate:** 30 minutes

**Implementation:**
```typescript
// Option 1: Add header back button
<Pressable onPress={() => router.push("/map")}>
  <Text>← Back</Text>
</Pressable>

// Option 2: Add navigation button below main content
<Pressable onPress={() => router.push("/map")}>
  <Text>View other moments →</Text>
</Pressable>
```

**Files to modify:**
- `app/moment-live.tsx` (lines ~185-315)

---

#### Issue #2: Moment Markers Not Clickable on Map

**Status:** 🔴 Open
**Severity:** Major (Interaction Problem)
**Found:** Manual testing, February 3, 2026
**Location:** `app/map.tsx` (likely)

**Description:**
When viewing the map, tapping on moment markers does nothing. Users cannot view moment details by tapping markers in the mobile app.

**Current Behavior:**
- Markers visible on map
- Tapping markers has no effect
- No details sheet opens

**Expected Behavior:**
- Tap marker → Open moment details sheet
- Show: time, location, seats, duration, note, host name
- Allow joining if not user's own moment

**Impact:**
- Users cannot interact with moments on map
- Cannot view details before joining
- Limits discovery and engagement

**Fix Estimate:** 1 hour (needs investigation)

**Investigation needed:**
- Check if marker onPress handlers exist
- Verify event propagation on mobile
- Test if issue is iOS-specific or general

**Workaround:**
- Functionality works correctly in browser/web version
- Suggests mobile-specific event handling issue

**Files to investigate:**
- `app/map.tsx`
- Map marker components
- Moment detail sheet component

---

## 📋 Future Enhancements (Post-M4)

### UX Improvements

- [ ] Add map zoom/pan animations when selecting moments
- [ ] Improve empty state messaging
- [ ] Add haptic feedback for key interactions
- [ ] Optimize map performance for many moments

### Features (M5+)

- [ ] Recurring moments (weekly lunch spots)
- [ ] Moment categories (casual, business, coffee, etc.)
- [ ] Favorite locations
- [ ] Block/report users
- [ ] Dietary preferences matching

### Technical Debt

- [ ] Optimize real-time subscriptions
- [ ] Add offline mode handling
- [ ] Improve error messages
- [ ] Add loading states consistency
- [ ] Performance monitoring setup

---

## 🎯 M4 Milestone Checklist

### Push Notifications
- [ ] Setup Expo push notification service
- [ ] Request notification permissions
- [ ] Store push tokens in database
- [ ] Implement notification triggers:
  - [ ] Guest joins moment
  - [ ] Guest arrives
  - [ ] Guest cancels
  - [ ] Guest running late
- [ ] Test notifications on iOS
- [ ] Test notifications on Android

### Running Late Feature
- [ ] Automatic reminder 10 min before meal
- [ ] "Running late?" prompt UI
- [ ] Send late notification to host/guests
- [ ] Update moment status if late

### Reliability Signals
- [ ] Track user's connection history
- [ ] Calculate no-show rate
- [ ] Display trust indicators on profiles
- [ ] Show reliability badges

### Enhanced "Eat Again" Matching
- [ ] Track mutual "eat again" selections
- [ ] Create matched users list
- [ ] Surface matched users in UI
- [ ] Make it easier to reconnect

---

## 🔧 Maintenance Tasks

- [ ] Update dependencies
- [ ] Review and clean up unused code
- [ ] Optimize bundle size
- [ ] Update documentation
- [ ] Review security best practices

---

## 📊 Metrics to Track (Future)

- [ ] Setup analytics
- [ ] Track moment creation rate
- [ ] Track successful connections
- [ ] Monitor no-show rate
- [ ] User retention metrics

---

**Last Updated:** February 3, 2026
**Next Review:** After M4 completion
