# GinMai — Milestones

---

## Philosophy

We ship in vertical slices, not horizontal layers.

Each milestone delivers a complete, testable experience. Users can touch it, feel it, react to it. We learn, then build the next slice.

---

## Milestone Overview

| Milestone | Name | Goal | Duration |
|-----------|------|------|----------|
| **M1** | The First Moment | A moment can exist on the map | 1-2 weeks |
| **M2** | Identity | Users can sign up and own their moments | 1 week |
| **M3** | The Loop | Someone can join a moment | 1-2 weeks |
| **M4** | The Meeting | Arrival and post-meal flow | 1 week |
| **M5** | Trust | Verification, reliability signals | 1-2 weeks |
| **M6** | Launch Prep | Polish, edge cases, TestFlight | 1-2 weeks |

**Total: 6-10 weeks to TestFlight**

---

# M1: The First Moment

> *"Can a Moment exist on the map?"*

## What We're Proving

The core interaction works. Someone can make their lunch visible. It appears. It feels right.

## Acceptance Criteria

### Map Screen

- [ ] App opens directly to map (no splash screen)
- [ ] Map centers on user's location (or Chiang Mai center if no permission)
- [ ] Location permission requested with clear explanation
- [ ] Map shows Chiang Mai area with appropriate zoom level

### Empty State

- [ ] When no moments exist, show:
  - "Nothing here yet." (headline)
  - "Chiang Mai is full of people eating lunch. Someone just needs to make the first seat visible." (body)
  - "Share where you're eating" (primary CTA)
  - "Or just look around" (secondary, does nothing)
- [ ] Empty state feels calm, not broken

### Create Flow

- [ ] Tapping CTA opens create flow
- [ ] Step 1: When? (Now, +30min, +1hr, or pick time)
- [ ] Step 2: Where? (Use current location, or search)
- [ ] Step 3: Seats + Duration + Note (optional)
- [ ] Final: "Make visible" button
- [ ] Confirmation: "Lunch visible. You're just eating as planned."

### Moment on Map

- [ ] Created moment appears as animated pulse
- [ ] Pulse is subtle, not aggressive
- [ ] Tapping pulse shows moment card
- [ ] Card shows: time, place, seats, host name (hardcoded for M1)

### Moment Card

- [ ] Time displayed clearly (e.g., "12:30")
- [ ] Place name or area shown
- [ ] Seats shown (e.g., "2 seats")
- [ ] Host name shown (placeholder: "You" for M1)
- [ ] "Join" button visible but disabled (M1 doesn't support joining)

### Expiration

- [ ] Moment disappears from map after expiration time
- [ ] Expiration = starts_at + duration + 1 hour buffer

## Out of Scope

- User accounts / authentication
- Joining moments
- Multiple moments on map (test with 1)
- Push notifications
- Host/guest matching
- Any post-meal features

## Technical Tasks

1. Expo project setup with TypeScript
2. NativeWind configuration
3. Supabase project setup
4. Database migration (moments table only)
5. Map component with location permission
6. Empty state component
7. Create flow screens (3 steps)
8. Moment marker component with animation
9. Moment card component
10. Zustand store for moments
11. Supabase client integration
12. Real-time subscription (prepare for M3)

## Definition of Done

A user can:
1. Open the app
2. See the map
3. Tap "Share where you're eating"
4. Complete the 3-step flow
5. See their moment appear on the map
6. Tap it to see the card

---

# M2: Identity

> *"Who is this person?"*

## What We're Proving

Minimal signup works. Phone verification feels trustworthy. First name humanizes.

## Acceptance Criteria

### Signup Flow

- [ ] Triggered when creating first moment (not on app open)
- [ ] Screen 1: "Almost there. Just a name and phone number."
- [ ] First name input (required, 1-30 chars)
- [ ] Phone input with country code
- [ ] "Continue" sends OTP
- [ ] Screen 2: 4-digit code entry
- [ ] Auto-advance on correct code
- [ ] "Resend code" after 30 seconds
- [ ] Error handling for invalid code

### User Profile

- [ ] Moments now linked to user
- [ ] Host name on card shows real first name
- [ ] Verification badge appears: "Maya ✓"

### Persistence

- [ ] User stays logged in across app restarts
- [ ] Session stored securely

### Settings

- [ ] Basic profile screen accessible
- [ ] Shows: name, phone (masked), joined date
- [ ] "Log out" option

## Out of Scope

- Profile editing
- Enhanced verification (ID, etc.)
- Trust signals beyond basic badge

## Technical Tasks

1. Supabase Auth configuration (phone OTP)
2. Users table migration
3. Signup flow screens
4. OTP verification
5. User store (Zustand)
6. Link moments to users
7. Update moment card to show host name + badge
8. Session persistence
9. Basic settings screen

---

# M3: The Loop

> *"Can someone join?"*

## What We're Proving

The core loop works. Guest journey is smooth. Host gets notified.

## Acceptance Criteria

### Browse

- [ ] Map shows all active nearby moments
- [ ] Moments sorted by start time
- [ ] Tapping moment opens full detail screen

### Moment Detail

- [ ] Shows: time, place, walk distance, host name ✓, note, seats, price range
- [ ] "Join" button prominently displayed
- [ ] If full: "Full" badge, Join button disabled

### Join Flow

- [ ] Tap "Join" → confirmation screen
- [ ] If not logged in → signup first → then confirm
- [ ] "You're in. Say hi when you arrive."
- [ ] Countdown timer to meal
- [ ] Map showing destination
- [ ] "Can't make it" option

### Host Notification

- [ ] Host receives in-app notification: "Alex wants to join"
- [ ] (Push notifications in M4)
- [ ] Auto-accept by default (setting to change in M5)

### Guest Cancellation

- [ ] Guest can tap "Can't make it"
- [ ] Confirmation: "Maya is counting on you. But things happen."
- [ ] If cancelled: seat reopens, host notified

### Moment Full

- [ ] When all seats taken: status → 'full'
- [ ] Moment stays visible but not joinable
- [ ] If someone cancels, seat reopens

## Technical Tasks

1. Connections table migration
2. Join edge function
3. Cancel edge function
4. Moment detail screen
5. Join confirmation screen
6. Countdown/waiting screen
7. In-app notification system
8. Seat availability logic
9. Update moment card for full state

---

# M4: The Meeting

> *"Did the meal actually happen?"*

## What We're Proving

Arrival works. People find each other. Post-meal feedback closes the loop.

## Acceptance Criteria

### Pre-Arrival

- [ ] Reminder notification 10 min before (push)
- [ ] "Running late" one-tap button

### Arrival

- [ ] "I'm here" tap updates status
- [ ] Host sees: "Alex is here"
- [ ] Guest sees: "Look for the GinMai sign"
- [ ] Table sign screen for host (กิน logo)

### During Meal

- [ ] App is silent (no notifications)
- [ ] Minimal UI if opened

### Post-Meal

- [ ] 2 hours after, gentle prompt: "How was lunch?"
- [ ] Three options: Great / Okay / Nope
- [ ] If Great/Okay: "Eat with [name] again?"
- [ ] If Nope: "Tell us what happened" (optional)

### Connections

- [ ] If both say "eat again" → mutual connection
- [ ] Connections visible in profile
- [ ] (Future: see each other's moments first)

## Technical Tasks

1. Push notification setup (Expo)
2. Arrival status updates
3. Table sign screen
4. Post-meal feedback flow
5. Feedback table migration
6. "Eat again" matching logic
7. Relationships table migration
8. Profile connections list

---

# M5: Trust & Safety

> *"Can I trust this person?"*

## What We're Proving

Safety features work. Trust signals feel right. Bad actors can be handled.

## Acceptance Criteria

### Verification Tiers

- [ ] Basic: phone verified (everyone)
- [ ] Trusted: 5+ completed meals
- [ ] Badge reflects tier

### Reliability Signals

- [ ] Track no-shows
- [ ] 2+ no-shows → warning
- [ ] 4+ no-shows → temporary limit

### Safety Features

- [ ] "Share my location" to external contact
- [ ] "I don't feel safe" → shows local emergency info
- [ ] "Report this person" → flag for review, block

### Blocking

- [ ] Blocked users don't see each other's moments
- [ ] Managed in settings

## Technical Tasks

1. Verification tier logic
2. No-show tracking
3. Account limiting logic
4. Safety menu screens
5. Location sharing (deep link)
6. Report flow
7. Block table and logic
8. RLS updates for blocking

---

# M6: Launch Prep

> *"Is this ready for real people?"*

## What We're Proving

It works in the real world. Edge cases are handled. It feels polished.

## Acceptance Criteria

### Polish

- [ ] All animations smooth (60fps)
- [ ] Loading states feel right
- [ ] Error messages are human
- [ ] Empty states feel calm
- [ ] Typography consistent
- [ ] Colors consistent

### Edge Cases

- [ ] Network offline handling
- [ ] Location permission denied
- [ ] OTP retry limits
- [ ] Expired moment handling
- [ ] App backgrounding/foregrounding

### Testing

- [ ] TestFlight ready
- [ ] 10+ internal testers
- [ ] Core flow works on iOS 15+
- [ ] Core flow works on Android 10+
- [ ] Crash-free in 48hr soak test

### Launch Materials

- [ ] App Store screenshots
- [ ] App Store description
- [ ] Privacy policy
- [ ] Terms of service

## Technical Tasks

1. Error boundary implementation
2. Offline state handling
3. Crashlytics/Sentry setup
4. Performance profiling
5. TestFlight distribution
6. Android internal testing
7. App Store assets
8. Legal documents

---

## After Launch

### M7: Density

- Recurring moments ("Every Tuesday")
- "Notify me when something's nearby"
- Invite friends via link

### M8: Discovery

- Neighborhood hubs
- Popular times
- "Usually busy here"

### M9: Scale

- Multi-city support
- City-specific onboarding
- Local language support

---

## Tracking Progress

Each milestone has a tracking issue. Tasks move through:

```
Backlog → In Progress → Review → Done
```

Daily question: *"What's blocking the next task?"*

Weekly question: *"Is the milestone still the right next step?"*

---

*Ship fast. Learn faster. The goal isn't perfect—it's real.*
