# M5: Trust & Safety - Implementation Plan

**Goal:** Build essential safety features to protect users and enable confident launch

**Duration:** 1-2 weeks
**Status:** Planning
**Priority:** High (Required for public launch)

---

## 🎯 Milestone Goal

Make GinMai safe for real-world use. Users should feel confident meeting strangers, with clear escape routes and protection against bad actors.

---

## 📋 Feature Overview

| Phase | Feature | Priority | Est. Time |
|-------|---------|----------|-----------|
| 1 | Emergency & Reporting | Critical | 2-3 days |
| 2 | Blocking System | Critical | 2-3 days |
| 3 | Location Sharing | High | 1-2 days |
| 4 | Account Limits | Medium | 1-2 days |

**Total Estimated Time:** 6-10 days

---

## Phase 1: Emergency & Reporting

### 1.1 "I Don't Feel Safe" Button

**User Story:** As a user at a meal, I want to quickly access emergency resources if I feel unsafe.

**Features:**
- Prominent "I don't feel safe" button accessible during active moments
- Shows local emergency contacts:
  - 🚨 Emergency: 191 (Thai Police)
  - 🏥 Ambulance: 1669
  - 🚒 Fire: 199
  - 🏥 Chiang Mai Hospital: +66 53 920 300
  - 🇺🇸 US Embassy: +66 2 205 4000
- Quick actions:
  - "Call Now" buttons
  - "Copy Number" buttons
- Safety tips displayed
- Optional: "Share my location" link to SMS

**UI/UX:**
- Discreet access (not alarming to companion)
- Located in moment live screen menu
- Red color scheme for urgency
- One-tap to emergency numbers

**Technical Implementation:**
```typescript
// New screen: app/safety.tsx
- Display emergency contacts
- Linking.openURL for phone calls
- Share location via SMS/WhatsApp
```

---

### 1.2 Report User Flow

**User Story:** As a user, I want to report inappropriate behavior so the community stays safe.

**Features:**
- "Report" option in user/moment context menus
- Report categories:
  - 🚫 No-show (didn't arrive)
  - 😠 Inappropriate behavior
  - 💬 Harassment
  - 🤥 Fake profile
  - ⚠️ Safety concern
  - 📝 Other (text field)
- Optional description field
- Confirmation: "Report submitted. We'll review within 24 hours."
- Automatic blocking option: "Block this user?"

**Data Tracked:**
- Reporter ID
- Reported user ID
- Moment ID (context)
- Category
- Description
- Timestamp
- Status (pending/reviewed/resolved)

**Technical Implementation:**
```typescript
// Database: reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  moment_id UUID REFERENCES moments(id),
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

// Screen: app/report-user.tsx
// Store: reportStore.ts
```

---

### 1.3 Admin Review Dashboard (Basic)

**User Story:** As an admin, I want to review reports and take action.

**Features:**
- Simple web dashboard or in-app admin view
- List of pending reports
- Actions:
  - Dismiss (not a violation)
  - Warn user (send notification)
  - Suspend user (temp ban)
  - Ban user (permanent)
- Admin notes field

**Technical Implementation:**
```typescript
// Database: admin_actions table
// Supabase RLS for admin role
// Basic admin screen (can be Supabase Studio for MVP)
```

---

## Phase 2: Blocking System

### 2.1 Block User Functionality

**User Story:** As a user, I want to block people I don't want to interact with.

**Features:**
- "Block" button in user profile/moment card
- Confirmation: "Block [Name]? They won't see your moments and you won't see theirs."
- Instant effect (no delay)
- Silent (blocked user not notified)
- Can be undone in settings

**Effects of Blocking:**
- Blocked user's moments hidden from blocker
- Blocker's moments hidden from blocked user
- Existing connections severed
- Cannot join each other's moments
- Cannot message (if added later)

**Technical Implementation:**
```typescript
// Database: blocks table
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  blocker_id UUID REFERENCES users(id),
  blocked_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

// RLS Updates for moments:
// - Filter out moments from blocked users
// - Filter out moments for blocked users

// Store: blockStore.ts
```

---

### 2.2 Manage Blocks in Settings

**User Story:** As a user, I want to see who I've blocked and unblock them if needed.

**Features:**
- Settings → "Blocked Users" section
- List of blocked users:
  - Name
  - Blocked date
  - "Unblock" button
- Empty state: "You haven't blocked anyone"
- Confirmation before unblocking

**Technical Implementation:**
```typescript
// Screen: app/blocked-users.tsx
// Add to settings screen navigation
```

---

### 2.3 Database RLS Updates

**Critical:** Update Row Level Security policies to respect blocks

**Moments Table:**
```sql
-- Users should not see moments from blocked users
CREATE POLICY "Users cannot see blocked users moments"
  ON moments FOR SELECT
  USING (
    host_id NOT IN (
      SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
    )
    AND host_id NOT IN (
      SELECT blocker_id FROM blocks WHERE blocked_id = auth.uid()
    )
  );
```

**Connections Table:**
```sql
-- Prevent joining moments of blocked users
CREATE POLICY "Users cannot join blocked users moments"
  ON connections FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = ...)
         OR (blocker_id = ... AND blocked_id = auth.uid())
    )
  );
```

---

## Phase 3: Location Sharing

### 3.1 Share Live Location

**User Story:** As a user going to meet someone, I want to share my location with a trusted contact.

**Features:**
- "Share my location" button on moment detail/live screen
- Opens share sheet with message:
  ```
  "I'm meeting someone from GinMai at [Location] at [Time].
  Track my location: [Google Maps Link]"
  ```
- Can share via:
  - SMS
  - WhatsApp
  - iMessage
  - Any sharing app

**Technical Implementation:**
```typescript
// Use React Native Share API
import { Share, Linking } from 'react-native';

const shareLocation = async (lat, lng, location, time) => {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const message = `I'm meeting someone from GinMai at ${location} at ${time}.\nTrack: ${mapsUrl}`;

  await Share.share({ message });
};
```

---

### 3.2 Quick Emergency Share

**User Story:** As a user feeling unsafe, I want to quickly share my location.

**Features:**
- One-tap from safety screen
- Pre-filled emergency message
- Sends current location
- Auto-selects SMS (fastest)

**Technical Implementation:**
- Same as 3.1 but optimized for speed
- Direct SMS link if possible

---

## Phase 4: Account Limits

### 4.1 No-Show Penalty System

**User Story:** As the platform, we want to discourage repeated no-shows.

**Rules:**
- 4+ no-shows → account limited
- Limited accounts cannot:
  - Create new moments
  - Join moments
- Duration: 7 days
- Grace period: 3 no-shows = warning

**User Experience:**
- Warning after 3rd no-show:
  ```
  "You've missed 3 meals. One more no-show will temporarily
  limit your account. Please only join meals you can attend."
  ```
- Limit notification:
  ```
  "Your account has been temporarily limited due to repeated
  no-shows. You can browse but not create or join moments for 7 days."
  ```
- Countdown visible in profile
- Appeals process: "Contact support"

**Technical Implementation:**
```typescript
// Database: user_limits table
CREATE TABLE user_limits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT, -- 'no_show_penalty'
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

// Check before creating/joining:
async function canUserJoin(userId: string): Promise<boolean> {
  const activeLimit = await checkActiveLimit(userId);
  return !activeLimit;
}

// Store: limitStore.ts
```

---

### 4.2 Warning System

**User Story:** As a user approaching the limit, I want to know before I'm penalized.

**Features:**
- Warning badge in profile after 2 no-shows
- Toast notification after joining a meal (2+ no-shows):
  ```
  "⚠️ You have 2 no-shows. Please attend your meals."
  ```
- Email reminder before meals (if opted in)

**Technical Implementation:**
```typescript
// Calculate warnings in profileStore
const getNoShowWarning = (noShows: number) => {
  if (noShows >= 3) return 'critical';
  if (noShows >= 2) return 'warning';
  return null;
};
```

---

### 4.3 Appeal Process

**User Story:** As a user with a penalty, I want to explain extenuating circumstances.

**Features:**
- "Appeal" button in profile when limited
- Simple form:
  - Reason for no-shows
  - Explanation
  - Promise to improve
- Admin review (basic for MVP)
- Response within 48 hours

**Technical Implementation:**
```typescript
// Database: appeals table
CREATE TABLE appeals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  limit_id UUID REFERENCES user_limits(id),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Database Schema Changes

### New Tables

1. **reports**
   - id, reporter_id, reported_user_id, moment_id
   - category, description, status
   - created_at, reviewed_at, reviewed_by

2. **blocks**
   - id, blocker_id, blocked_id
   - created_at
   - UNIQUE constraint on (blocker_id, blocked_id)

3. **user_limits**
   - id, user_id, type
   - start_date, end_date, reason
   - created_at

4. **appeals** (optional for MVP)
   - id, user_id, limit_id
   - reason, status, admin_notes
   - created_at

5. **admin_actions** (optional for MVP)
   - id, admin_id, target_user_id
   - action_type, reason
   - created_at

---

## 🎨 UI/UX Design

### Safety Access Points

**During Moment (Live):**
- Three-dot menu → "Safety"
- Shows: Share Location, Emergency, Report

**User Profile:**
- Three-dot menu → "Report User" / "Block User"

**Settings:**
- "Safety & Privacy" section
  - Blocked Users
  - Reported Users
  - Emergency Contacts

### Colors & Iconography

- Emergency: Red (#EF4444)
- Warning: Amber (#F59E0B)
- Report: Orange (#F97316)
- Block: Gray (#6B7280)
- Success: Green (#22C55E)

---

## 🧪 Testing Plan

### Phase 1 Testing
- [ ] Emergency contacts display correctly
- [ ] Phone dialing works (iOS/Android)
- [ ] Report flow completes
- [ ] Reports stored in database
- [ ] Block option appears after report

### Phase 2 Testing
- [ ] Block user functionality works
- [ ] Blocked user's moments hidden
- [ ] Cannot join blocked user's moments
- [ ] Unblock works correctly
- [ ] RLS policies enforce blocks

### Phase 3 Testing
- [ ] Location sharing opens share sheet
- [ ] Message format correct
- [ ] Google Maps link works
- [ ] Works on iOS and Android

### Phase 4 Testing
- [ ] Warning displays at 2 no-shows
- [ ] Limit applies at 4 no-shows
- [ ] Cannot create/join when limited
- [ ] Limit expires after 7 days
- [ ] Appeal flow works

---

## 📝 Implementation Order

### Week 1 (Days 1-5)

**Day 1-2: Phase 1**
- ✅ Emergency contacts screen
- ✅ Report user flow
- ✅ Reports database table
- ✅ Basic admin tracking

**Day 3-4: Phase 2**
- ✅ Block functionality
- ✅ Blocks database table
- ✅ RLS policy updates
- ✅ Blocked users settings

**Day 5: Phase 3**
- ✅ Location sharing

### Week 2 (Days 6-7)

**Day 6: Phase 4**
- ✅ No-show penalties
- ✅ Warning system
- ✅ User limits

**Day 7: Testing & Polish**
- ✅ Integration testing
- ✅ Bug fixes
- ✅ Documentation

---

## 🚀 Success Criteria

M5 is complete when:

1. ✅ Users can access emergency contacts
2. ✅ Users can report inappropriate behavior
3. ✅ Users can block other users
4. ✅ Blocks are enforced in the database
5. ✅ Users can share their location
6. ✅ No-show penalties automatically apply
7. ✅ All safety features tested and working

---

## 🔒 Security Considerations

### Privacy
- Reports are confidential
- Blocking is silent (blocked user not notified)
- Location sharing is opt-in only
- Emergency contacts stored client-side only

### Data Protection
- RLS policies prevent data leaks
- Blocks enforced at database level
- Reports accessible only to admins
- User limits have expiration dates

### Abuse Prevention
- Rate limiting on reports (max 5/day)
- Cannot block more than 50 users
- Appeals limited to 1 per penalty
- Admin actions logged

---

## 📚 Documentation Tasks

- [ ] Safety features guide for users
- [ ] Admin review guidelines
- [ ] RLS policy documentation
- [ ] Testing checklist
- [ ] Privacy policy updates (for blocking/reporting)

---

## 🎯 Next After M5

With safety features complete, we'll be ready for:

**M6: Launch Prep**
- Polish UI/UX
- Performance optimization
- TestFlight distribution
- App Store preparation
- Beta testing with real users

**Target: 2-3 weeks to public launch**

---

## 💡 Future Enhancements (Post-M5)

- Two-factor verification for high-risk meetings
- In-app emergency button (calls authorities)
- Safety score (community reputation)
- Meeting check-in reminders
- Post-meal safety confirmation

---

**Ready to start implementation? Let's build a safe GinMai! 🔒**
