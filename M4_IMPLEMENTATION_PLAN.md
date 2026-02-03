# M4 Implementation Plan: Push Notifications & Reliability

**Milestone:** M4 - Push Notifications & Reliability
**Status:** Planning
**Started:** February 3, 2026
**Target:** TBD

---

## 🎯 M4 Goals

Replace in-app notifications with real push notifications and add reliability signals to build trust in the platform.

### Features

1. **Push Notifications** - Real push notifications (not just in-app toasts)
2. **Running Late Reminders** - Automatic 10-min-before-meal prompts
3. **Connection Reliability Signals** - Show user's history and no-show rate
4. **Enhanced "Eat Again" Matching** - Better logic for surfacing matched users

---

## 📋 Feature Breakdown

### Feature 1: Push Notifications

**Goal:** Replace in-app toast notifications with actual push notifications that work when app is closed.

**Current State:**
- ✅ In-app notification system exists (`InAppToast` component)
- ✅ Notification store tracks events
- ❌ No push notifications (only shows when app is open)

**Target State:**
- Users receive push notifications when app is closed/backgrounded
- Notifications trigger for: guest joins, arrives, cancels, running late
- Tapping notification opens app to relevant screen

#### Tasks

##### 1.1 Setup Expo Push Notifications

- [ ] Install Expo notifications package
  ```bash
  cd app
  npx expo install expo-notifications
  ```

- [ ] Configure app.json for push notifications
  ```json
  {
    "expo": {
      "plugins": [
        [
          "expo-notifications",
          {
            "icon": "./assets/notification-icon.png",
            "color": "#F97316"
          }
        ]
      ]
    }
  }
  ```

- [ ] Request notification permissions on app startup
- [ ] Test permissions flow (allow/deny handling)

**Files to create/modify:**
- `app/app.json` - Add notifications config
- `app/src/hooks/useNotifications.ts` - NEW: Push notification hook
- `app/src/config/notifications.ts` - NEW: Notification config

---

##### 1.2 Store Push Tokens in Database

- [ ] Add `push_token` column to users table
  ```sql
  ALTER TABLE users
  ADD COLUMN push_token TEXT;
  ```

- [ ] Update user profile when token received
- [ ] Handle token refresh (tokens can expire)

**Files to modify:**
- `supabase/migrations/` - NEW: Add push_token column
- `app/src/stores/authStore.ts` - Store push token
- `app/src/types/database.ts` - Update types

---

##### 1.3 Create Notification Service

- [ ] Create notification handler service
- [ ] Setup foreground notification listeners
- [ ] Setup background notification listeners
- [ ] Handle notification tap actions
- [ ] Route to correct screen based on notification type

**Files to create:**
- `app/src/services/notificationService.ts` - NEW: Core notification logic

**Notification Types to Handle:**
```typescript
type NotificationType =
  | "guest_joined"      // Someone joined your moment
  | "guest_arrived"     // Guest marked as arrived
  | "guest_cancelled"   // Guest cancelled
  | "guest_running_late" // Guest is late
  | "running_late_reminder" // Your meal starts soon
  | "eat_again_match"   // Mutual "eat again" match
```

---

##### 1.4 Send Notifications from Backend

**Option A: Supabase Edge Functions (Recommended)**
- Create Edge Function to send push notifications
- Trigger on database events (guest joins, arrives, etc.)
- Use Expo's push notification API

**Option B: Client-side (Quick but less secure)**
- Send notifications directly from app
- Simpler but exposes Expo push token

**Recommendation:** Start with Option B for MVP, migrate to Option A later.

- [ ] Create notification sender utility
- [ ] Integrate with existing notification triggers
- [ ] Test notification delivery

**Files to create:**
- `app/src/utils/sendPushNotification.ts` - NEW: Send notifications
- `supabase/functions/send-notification/` - FUTURE: Edge function

---

##### 1.5 Replace InAppToast with Push Notifications

- [ ] Keep InAppToast for when app is open (better UX)
- [ ] Send push notification when app is backgrounded
- [ ] Determine app state (foreground vs background)
- [ ] Show toast if foreground, push if background

**Files to modify:**
- `app/src/stores/notificationStore.ts` - Add push logic
- `app/src/components/InAppToast.tsx` - Keep for foreground

---

### Feature 2: Running Late Reminders

**Goal:** Automatically remind users 10 minutes before their meal starts with "Running late?" prompt.

**User Flow:**
1. 10 minutes before meal → User gets push notification: "Your lunch starts in 10 minutes. Running late?"
2. Tap notification → Opens app with "Running late?" prompt
3. Tap "Yes, I'm late" → Notifies other participants
4. Tap "No, on time" → Dismisses

#### Tasks

##### 2.1 Schedule Running Late Reminders

- [ ] Create background task scheduler
- [ ] Schedule reminder 10 min before moment starts
- [ ] Send push notification at scheduled time
- [ ] Cancel reminder if moment is cancelled

**Files to create:**
- `app/src/services/reminderService.ts` - NEW: Schedule reminders

**Technical Challenge:**
- React Native doesn't have reliable background tasks
- **Options:**
  1. Use Expo Task Manager for background tasks
  2. Schedule local notifications (simpler)
  3. Backend-triggered notifications (best, requires Supabase function)

**Recommendation:** Start with local notifications (Option 2), migrate to backend (Option 3) later.

---

##### 2.2 Running Late UI Flow

- [ ] Create "Running late?" modal/screen
- [ ] Add "Yes, I'm late" button
- [ ] Add "No, on time" button
- [ ] Update moment status if late

**Files to create:**
- `app/app/running-late.tsx` - NEW: Running late screen
- Or add modal to existing screens

---

##### 2.3 Notify Other Participants

- [ ] When user marks "I'm late", notify:
  - Host (if user is guest)
  - Other guests (if user is host or guest)
- [ ] Send push notification: "[Name] is running a few minutes late"
- [ ] Update moment status/UI

**Files to modify:**
- `app/src/stores/momentStore.ts` - Add late status
- Notification service - Send late notifications

---

### Feature 3: Connection Reliability Signals

**Goal:** Show users' connection history and no-show rate to build trust.

**Metrics to Track:**
- Total meals completed
- No-shows (didn't arrive when expected)
- Reliability score (% of completed vs no-shows)

#### Tasks

##### 3.1 Track Connection History in Database

- [ ] Add tracking fields to users table
  ```sql
  ALTER TABLE users
  ADD COLUMN meals_completed INTEGER DEFAULT 0,
  ADD COLUMN no_shows INTEGER DEFAULT 0,
  ADD COLUMN reliability_score DECIMAL(3,2) DEFAULT 1.00;
  ```

- [ ] Update counts after each meal:
  - Increment `meals_completed` when feedback submitted
  - Increment `no_shows` if guest joined but never arrived
  - Recalculate `reliability_score`

**Files to modify:**
- `supabase/migrations/` - NEW: Add reliability columns
- `app/src/stores/authStore.ts` - Track stats
- `app/src/types/database.ts` - Update types

---

##### 3.2 Display Reliability Indicators

- [ ] Show reliability on user profiles
- [ ] Add badges for trusted users:
  - "Reliable" badge (95%+ reliability)
  - "New" badge (< 5 meals)
  - Warning for low reliability (< 70%)

**Files to modify:**
- `app/app/profile.tsx` - Show reliability stats
- `app/src/components/` - NEW: Reliability badge component

**UI Design:**
```
Profile:
  Hussein A.
  ⭐ Reliable (12 meals)

  Reliability: 95% (11/12 attended)
```

---

##### 3.3 Show Reliability in Moment Details

- [ ] Display host's reliability when viewing moment
- [ ] Show other guests' reliability (if visible)
- [ ] Helps users decide whether to join

**Files to modify:**
- `app/app/moment-detail.tsx` - Show host reliability
- `app/app/moment-live.tsx` - Show guest reliability

---

### Feature 4: Enhanced "Eat Again" Matching

**Goal:** Better logic for tracking mutual "eat again" selections and surfacing matched users.

**Current State:**
- ✅ Users can select "eat again" after meals
- ❌ No tracking of mutual matches
- ❌ No way to see matched users

#### Tasks

##### 4.1 Track Mutual Matches in Database

- [ ] Create `eat_again_matches` table
  ```sql
  CREATE TABLE eat_again_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID REFERENCES users(id),
    user_b_id UUID REFERENCES users(id),
    moment_id UUID REFERENCES moments(id),
    matched_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_a_id, user_b_id, moment_id)
  );
  ```

- [ ] When user selects "eat again", check if other person did too
- [ ] If mutual, create match record

**Files to create:**
- `supabase/migrations/` - NEW: Create matches table
- `app/src/stores/matchStore.ts` - NEW: Match store

---

##### 4.2 Notify on Mutual Match

- [ ] When mutual match happens, send push notification:
  - "You and [Name] want to eat again! 🎉"
- [ ] Deep link to matched user's profile or message

**Files to modify:**
- Notification service - Add match notification

---

##### 4.3 Surface Matched Users

- [ ] Create "People you've connected with" section
- [ ] Show matched users in profile or dedicated screen
- [ ] Add "Eat again with [Name]" quick action
- [ ] When creating moment, suggest inviting matched users

**Files to create:**
- `app/app/connections.tsx` - NEW: Connections screen
- Or add section to profile

**UI Design:**
```
Profile → Connections

People you've connected with:

  [Avatar] Sarah K.
  Ate together 2 times
  Last: 2 days ago
  → Invite to your next meal

  [Avatar] John D.
  Ate together 1 time
  Last: 1 week ago
  → Invite to your next meal
```

---

## 🗂️ Database Migrations Summary

### New Tables

```sql
-- M4 Migration 1: Eat Again Matches
CREATE TABLE eat_again_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  matched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id, moment_id)
);

CREATE INDEX idx_eat_again_matches_user_a ON eat_again_matches(user_a_id);
CREATE INDEX idx_eat_again_matches_user_b ON eat_again_matches(user_b_id);
```

### New Columns

```sql
-- M4 Migration 2: Push Tokens and Reliability
ALTER TABLE users
ADD COLUMN push_token TEXT,
ADD COLUMN meals_completed INTEGER DEFAULT 0,
ADD COLUMN no_shows INTEGER DEFAULT 0,
ADD COLUMN reliability_score DECIMAL(3,2) DEFAULT 1.00;

CREATE INDEX idx_users_push_token ON users(push_token);
```

---

## 📁 New Files to Create

### Configuration
- `app/src/config/notifications.ts` - Notification settings and config

### Services
- `app/src/services/notificationService.ts` - Core push notification logic
- `app/src/services/reminderService.ts` - Schedule running late reminders

### Stores
- `app/src/stores/matchStore.ts` - Manage eat-again matches

### Hooks
- `app/src/hooks/useNotifications.ts` - Push notification hook
- `app/src/hooks/useReminders.ts` - Reminder scheduling hook

### Screens
- `app/app/running-late.tsx` - Running late prompt screen
- `app/app/connections.tsx` - Matched users / connections screen

### Components
- `app/src/components/ReliabilityBadge.tsx` - Show reliability score
- `app/src/components/NotificationPermissionPrompt.tsx` - Request permissions

### Utils
- `app/src/utils/sendPushNotification.ts` - Send push notifications
- `app/src/utils/calculateReliability.ts` - Calculate reliability score

---

## 📝 Files to Modify

### Core App Files
- `app/app.json` - Add notification plugin config
- `app/App.tsx` - Initialize notification service

### Stores
- `app/src/stores/authStore.ts` - Store push token, reliability stats
- `app/src/stores/momentStore.ts` - Add late status handling
- `app/src/stores/notificationStore.ts` - Integrate push notifications

### Screens
- `app/app/profile.tsx` - Show reliability stats
- `app/app/moment-detail.tsx` - Show host reliability
- `app/app/moment-live.tsx` - Show guest reliability
- `app/app/feedback.tsx` - Update eat-again logic for matching

### Types
- `app/src/types/database.ts` - Update with new columns/tables

---

## 🧪 Testing Strategy

### Unit Tests to Add

- [ ] `notificationService.test.ts` - Test notification logic
- [ ] `reminderService.test.ts` - Test reminder scheduling
- [ ] `matchStore.test.ts` - Test match creation logic
- [ ] `calculateReliability.test.ts` - Test reliability calculations

### E2E Tests to Add

- [ ] `06-push-notifications.yaml` - Test notification flow
- [ ] `07-running-late.yaml` - Test running late flow
- [ ] `08-eat-again-matching.yaml` - Test match creation

### Manual Testing Checklist

- [ ] Push notification received when app closed
- [ ] Push notification received when app backgrounded
- [ ] Tapping notification opens correct screen
- [ ] Running late reminder arrives 10 min before
- [ ] Running late notification sent to participants
- [ ] Reliability score displays correctly
- [ ] Mutual "eat again" creates match
- [ ] Match notification sent

---

## ⏱️ Implementation Timeline

### Phase 1: Push Notifications (Priority 1)
**Estimated:** 4-6 hours

1. Setup Expo notifications (1h)
2. Store push tokens (1h)
3. Create notification service (2h)
4. Send notifications from app (1h)
5. Test notification delivery (1h)

### Phase 2: Running Late Reminders (Priority 2)
**Estimated:** 3-4 hours

1. Schedule reminders (1-2h)
2. Create running late UI (1h)
3. Notify participants (1h)
4. Test reminder flow (1h)

### Phase 3: Reliability Signals (Priority 3)
**Estimated:** 3-4 hours

1. Database schema updates (1h)
2. Track connection history (1h)
3. Display reliability indicators (1-2h)
4. Test reliability tracking (1h)

### Phase 4: Enhanced Matching (Priority 4)
**Estimated:** 4-5 hours

1. Create matches table (1h)
2. Track mutual matches (1h)
3. Notify on matches (1h)
4. Create connections screen (1-2h)
5. Test matching flow (1h)

**Total Estimated Time:** 14-19 hours

---

## 🚀 Getting Started

### Recommended Implementation Order

1. **Start with Push Notifications** (Most critical)
   - Biggest impact on user experience
   - Unlocks other features (reminders, matches)
   - Foundation for M4

2. **Then Running Late Reminders**
   - Builds on push notification foundation
   - High user value
   - Relatively simple

3. **Then Reliability Signals**
   - Independent feature
   - Can be done in parallel with matching
   - Builds trust in platform

4. **Finally Enhanced Matching**
   - Builds on existing feedback system
   - Nice-to-have, lower priority
   - Can be iterated on later

---

## ✅ Definition of Done (M4 Complete)

- [ ] Users receive push notifications when app is closed
- [ ] Notifications sent for: join, arrive, cancel, late
- [ ] Running late reminders sent 10 min before meal
- [ ] Running late status shown to participants
- [ ] Reliability score tracked and displayed
- [ ] Reliability badges shown on profiles
- [ ] Mutual "eat again" matches tracked
- [ ] Matched users surfaced in connections screen
- [ ] All features tested manually
- [ ] Unit tests written for core logic
- [ ] E2E tests added for critical flows
- [ ] Documentation updated

---

## 📚 Resources

### Expo Notifications Docs
- https://docs.expo.dev/push-notifications/overview/
- https://docs.expo.dev/versions/latest/sdk/notifications/

### Supabase Edge Functions
- https://supabase.com/docs/guides/functions

### Background Tasks
- https://docs.expo.dev/versions/latest/sdk/task-manager/

---

**Next Step:** Implement Phase 1 - Push Notifications

Ready to start? Let's begin with Feature 1.1: Setup Expo Push Notifications!
