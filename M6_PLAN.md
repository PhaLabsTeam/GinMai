# M6: Launch Prep - Detailed Implementation Plan

**Goal:** Make GinMai production-ready for TestFlight and real users

**Approach:** Fix critical issues first, polish second, prep for store last

---

## 🔴 Priority 1: Critical (Must Fix Before Launch)

### 1.1 Remove Dev-Mode Backdoors

**Problem:** DEV_MODE bypasses phone auth, allowing any OTP to work. Mock data and test UUIDs are in production code.

**Files to fix:**
- `src/config/supabase.ts` - Audit DEV_MODE flag
- `app/app/sign-up.tsx` - Remove mock OTP bypass
- `app/app/safety.tsx` - Remove hardcoded test UUID `99999999-9999-9999-9999-999999999999`
- `app/app/profile.tsx` - Remove `mockConnections` array (lines 7-11)
- `app/src/stores/momentStore.ts` - Remove mock guest logic
- `app/src/stores/authStore.ts` - Remove mock user ID

**What to do:**
- Flag DEV_MODE to only be active when `__DEV__` is true (Expo's built-in dev flag)
- Remove mock data entirely from production paths
- Remove hardcoded test UUIDs

---

### 1.2 Add Error Boundary

**Problem:** A JavaScript crash anywhere in the app shows a white screen with no recovery path.

**Fix:** Wrap the app in a React Error Boundary that shows a friendly error screen with a "Reload app" button.

**Files to create:**
- `src/components/ErrorBoundary.tsx`

**Files to update:**
- `app/_layout.tsx` - Wrap root with ErrorBoundary

---

### 1.3 Handle Token Expiration / Session Loss

**Problem:** If a user's session expires while using the app (e.g., after a long break), there's no handling. The app will silently fail on API calls.

**Fix:**
- Listen to Supabase `SIGNED_OUT` auth events
- Show "Session expired" alert
- Redirect to sign-in screen

**Files to update:**
- `src/stores/authStore.ts` - Add session expiry listener
- `app/_layout.tsx` - Handle auth state changes

---

### 1.4 Remove Sensitive Console Logs

**Problem:** 100+ console.log statements log phone numbers, user IDs, push tokens, and auth tokens. This is a security risk and pollutes production logs.

**Fix:** Wrap all logging in a dev-only condition using Expo's `__DEV__` flag.

**Approach:**
- Create `src/utils/logger.ts` utility that only logs in dev
- Replace all `console.log` in stores and screens with `logger.log`
- Keep `console.error` for critical errors (but sanitize sensitive data)

---

## 🟡 Priority 2: Important (Should Fix Before Launch)

### 2.1 Offline Detection & Feedback

**Problem:** If the user loses internet, the app silently fails with no feedback.

**Fix:**
- Use `@react-native-community/netinfo` to detect connectivity
- Show a banner: "No internet connection. Some features may not work."
- Disable create/join buttons when offline
- Show cached moments when offline

**Files to create:**
- `src/hooks/useNetworkStatus.ts`
- `src/components/OfflineBanner.tsx`

**Files to update:**
- `app/_layout.tsx` - Add OfflineBanner
- `app/app/map.tsx` - Disable actions when offline

---

### 2.2 Fix Missing Loading States

**Problem:** Several screens have no loading indicator during async operations.

**Screens to fix:**

| Screen | Issue | Fix |
|--------|-------|-----|
| `confirmation.tsx` | No loading on join | Add spinner to Join button |
| `connections.tsx` | Already has loading ✅ | - |
| `blocked-users.tsx` | Already has loading ✅ | - |

---

### 2.3 Remove Hardcoded/Mock Data

**Problem:** Several values are hardcoded that should either be dynamic or removed.

**Issues:**
- `profile.tsx` - `mockConnections` array declared but never used → Remove
- `moment-detail.tsx` - `walkingDistance = "8 min walk"` is hardcoded → Remove or calculate
- `map.tsx` - Chiang Mai coordinates are fine as a default, but should be configurable

**Files to fix:**
- `app/app/profile.tsx` - Remove mockConnections
- `app/app/moment-detail.tsx` - Remove fake walking distance

---

### 2.4 Fix "Edit Profile" (Dead Button)

**Problem:** Profile screen has an "Edit" button that navigates nowhere.

**Options:**
- Remove the Edit button entirely (simplest)
- OR implement basic edit (first name only)

**Recommendation:** Remove for now, add post-launch.

---

### 2.5 Walking Distance Calculation

**Problem:** `moment-detail.tsx` shows "8 min walk" for all moments regardless of distance.

**Fix:** Calculate actual walking distance/time using the user's location and moment's coordinates.

```typescript
const getWalkingTime = (userLat, userLng, momentLat, momentLng) => {
  const distanceKm = haversineDistance(userLat, userLng, momentLat, momentLng);
  const walkingSpeedKmH = 5;
  const minutes = Math.round((distanceKm / walkingSpeedKmH) * 60);
  return `${minutes} min walk`;
};
```

---

### 2.6 Input Sanitization

**Problem:** User text inputs (moment notes, first names) aren't sanitized before being sent to the database. Though Supabase handles SQL injection, XSS is still possible in rendering.

**Fix:**
- Add basic text trim on all inputs
- Validate first name (letters only, no special chars except spaces)
- Trim whitespace from moment notes

---

## 🟢 Priority 3: Polish (Nice to Have)

### 3.1 Consistent Error Messages

**Problem:** Errors vary between technical Supabase error messages and user-friendly messages.

**Fix:** Create a centralized error message mapper:

```typescript
// src/utils/errorMessages.ts
export const getFriendlyError = (error: any): string => {
  if (error?.code === '23505') return 'You already joined this meal';
  if (error?.code === '23503') return 'This meal no longer exists';
  if (error?.message?.includes('network')) return 'Check your internet connection';
  return 'Something went wrong. Please try again.';
};
```

---

### 3.2 Empty States Polish

**Problem:** Some empty states are missing or inconsistent.

**Screens to check/improve:**
- Map: ✅ Has empty state
- Connections: ✅ Has empty state
- Blocked Users: ✅ Has empty state
- Notifications: Check if there's an empty state

---

### 3.3 Animation & Transition Polish

**Problem:** The `500ms` setTimeout in `moment-live.tsx` is a hacky workaround for store sync.

**Fix:** Replace with proper state reactivity or `useEffect` with a proper dependency.

---

### 3.4 App Icon & Splash Screen

**Problem:** Expo default icon and splash screen need to be replaced with GinMai branding.

**Requirements:**
- App icon: 1024x1024 PNG (กิน logo in orange)
- Splash screen: White background with กิน logo centered
- iOS icon variations

**Files to update:**
- `app.json` - Splash screen configuration
- `assets/icon.png` - Replace with real icon
- `assets/splash-icon.png` - Replace with real splash
- `assets/adaptive-icon.png` - Android adaptive icon

---

### 3.5 App Version & Build Numbers

**Fix `app.json`:**
```json
{
  "version": "1.0.0",
  "ios": {
    "buildNumber": "1"
  },
  "android": {
    "versionCode": 1
  }
}
```

---

## 🏗️ Priority 4: TestFlight Prep

### 4.1 EAS Build Configuration

**Create `eas.json`:**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Commands:**
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile preview
```

---

### 4.2 App Store Requirements

**Required before TestFlight:**
- [ ] Apple Developer account ($99/year)
- [ ] App Store Connect entry created
- [ ] Privacy policy URL
- [ ] App description (short + long)
- [ ] Screenshots (6.5", 5.5" iOS)
- [ ] App category: Social Networking
- [ ] Age rating: 17+ (meeting strangers)
- [ ] In-app purchases: None

**Required for review:**
- [ ] Notification permission explanation
- [ ] Location permission explanation
- [ ] Privacy policy (PDPA compliant for Thailand)

---

### 4.3 Privacy Policy & Terms

**Required:** Create simple privacy policy covering:
- What data is collected (phone, location, name)
- How it's used
- PDPA compliance (Thailand)
- Data deletion request process

---

## 📋 Implementation Order

### Week 1: Critical Fixes

**Day 1-2:**
- [ ] Remove dev-mode backdoors
- [ ] Clean up console logs (logger utility)
- [ ] Remove mock data and test UUIDs

**Day 3:**
- [ ] Add ErrorBoundary component
- [ ] Handle session expiration

**Day 4:**
- [ ] Add offline detection (NetInfo)
- [ ] Show offline banner

**Day 5:**
- [ ] Fix hardcoded values (walking distance, mockConnections)
- [ ] Fix Edit button on profile
- [ ] Input sanitization

### Week 2: Polish & TestFlight

**Day 6-7:**
- [ ] Consistent error messages
- [ ] Animation fixes (500ms hack)
- [ ] Empty state review

**Day 8:**
- [ ] App icon & splash screen
- [ ] App version configuration

**Day 9:**
- [ ] EAS Build setup
- [ ] First TestFlight build
- [ ] Privacy policy

**Day 10:**
- [ ] Internal testing on physical devices
- [ ] Fix any issues found
- [ ] Share with beta testers

---

## 🚨 Do NOT Launch Without

1. ✅ DEV_MODE backdoors removed
2. ✅ Session expiration handled
3. ✅ Error boundary added
4. ✅ Sensitive logs removed
5. ✅ Privacy policy URL
6. ✅ Real app icon (not Expo default)
7. ✅ Push notifications tested on physical device
8. ✅ TestFlight build successfully installed

---

## 📱 Out of Scope for M6

These will be addressed post-launch based on user feedback:

- Location sharing (Phase 3 - deferred)
- No-show penalties (Phase 4 - deferred)
- Edit profile
- Advanced search/filters
- Android testing (iOS only for MVP)
- Crash analytics (Sentry/Crashlytics)
- Advanced push notification management
- Multi-language support (Thai/English)
- Deep linking for moments

---

## Summary

| Priority | Tasks | Blocking Launch? |
|----------|-------|-----------------|
| 🔴 Critical | 4 tasks | YES |
| 🟡 Important | 6 tasks | Recommended |
| 🟢 Polish | 5 tasks | No |
| 🏗️ Store Prep | 4 tasks | YES (for TestFlight) |

**Minimum viable M6:** Complete all 🔴 Critical + 🏗️ Store Prep tasks.
