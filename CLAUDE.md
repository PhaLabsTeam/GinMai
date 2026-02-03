# GinMai

**กินไหม** — "Wanna eat?"

A meal-sharing app that solves one problem: eating alone when you don't want to.

---

## What This Is

GinMai lets someone say "I'm eating lunch here at 12:30" and makes that visible to others nearby. Someone else can join with one tap. They meet. They eat. The app disappears.

Not dating. Not networking. Not Meetup. Just: _shared meals with strangers who become acquaintances._

Launching in Chiang Mai, Thailand—a city full of nomads, remote workers, and travelers who are lonely in the moment, not lonely in life.

---

## Core Philosophy

Read these before writing any code:

1. **The app is a door, not a room.** Users don't come here to spend time. They come to leave—to step through into a real moment with a real person.

2. **"You're not hosting. You're just open."** Creating a Moment must feel like making yourself visible, not throwing a party.

3. **Zero performance burden.** No titles, no descriptions, no elaborate setup. Just: time, place, seats.

4. **The app disappears during the meal.** Success means the product becomes invisible.

5. **Empty states are calm lakes, not empty rooms.** Absence is permission, not failure.

---

## Current Status: M4 Complete! ✅

**Milestones Completed:**
- ✅ **M1 - The First Moment**: Map, moment creation, moment visibility
- ✅ **M2 - Identity**: Phone auth with OTP, user profiles, verification badges
- ✅ **M3 - The Loop**: Join moments, host notifications, arrival flow, post-meal feedback
- ✅ **M4 - Push Notifications & Reliability**: Push notifications, running late reminders, reliability signals, enhanced matching

**Current Focus: Manual Testing**

### What Works Now
- Users can sign up with phone verification
- Create moments (time, place, seats, duration, note)
- Browse and join moments from map
- Real-time host notifications (guests join, arrive, cancel, running late)
- Guest arrival flow with "Found them!" confirmation
- Post-meal feedback with "eat again" matching
- **NEW:** Push notifications (background & foreground)
- **NEW:** Running late reminders (10 min before meal)
- **NEW:** Reliability scores and badges on profiles
- **NEW:** Connections screen showing matched users
- **NEW:** Mutual "eat again" match notifications

### Next: Manual Testing & Bug Fixes
- Test all M4 features on physical device
- Fix any issues found during testing
- Polish UX based on feedback
- Then: M5 planning or feature refinement

---

## Technical Decisions

| Decision      | Choice                            | Rationale                                           |
| ------------- | --------------------------------- | --------------------------------------------------- |
| **Framework** | Expo (React Native)               | Ship iOS + Android together, fast iteration         |
| **Backend**   | Supabase                          | Real-time subscriptions, auth, Postgres, fast setup |
| **Maps**      | React Native Maps + Google Places | Reliable, good DX                                   |
| **State**     | Zustand                           | Simple, minimal boilerplate                         |
| **Styling**   | NativeWind (Tailwind for RN)      | Rapid UI development                                |

---

## Project Structure

```
ginmai/
├── CLAUDE.md                 ← You are here
├── docs/
│   ├── architecture.md       ← Full technical architecture
│   ├── user-flow.md          ← Every screen, every state
│   ├── decisions.md          ← Technical decision log
│   └── milestones.md         ← Roadmap
├── app/                      ← Expo app
│   ├── src/
│   │   ├── components/       ← Reusable UI components
│   │   ├── screens/          ← Screen components
│   │   ├── stores/           ← Zustand stores
│   │   ├── hooks/            ← Custom hooks
│   │   ├── utils/            ← Helpers
│   │   ├── types/            ← TypeScript types
│   │   └── config/           ← Environment config
│   ├── assets/               ← Images, fonts
│   ├── app.json              ← Expo config
│   └── App.tsx               ← Entry point
├── supabase/
│   ├── migrations/           ← Database migrations
│   └── seed.sql              ← Test data
└── README.md
```

---

## Key Data Models

### Moment

```typescript
interface Moment {
  id: string;
  host_id: string;
  host_name: string;

  // When
  starts_at: DateTime;
  duration: "quick" | "normal" | "long"; // 30min, 1hr, 2hr+

  // Where
  location: {
    lat: number;
    lng: number;
    place_name?: string; // "Khao soi place"
    area_name?: string; // "Nimman"
  };

  // What
  seats_total: number; // 1-4
  seats_taken: number; // 0 to seats_total
  note?: string; // "First week in CM. Nothing fancy."

  // State
  status: "active" | "full" | "completed" | "cancelled";
  created_at: DateTime;
  expires_at: DateTime; // starts_at + duration + 1hr buffer
}
```

### User (M2+)

```typescript
interface User {
  id: string;
  phone: string;
  first_name: string;
  verified: boolean;
  created_at: DateTime;

  // Earned over time
  meals_hosted: number;
  meals_joined: number;
  no_shows: number;
}
```

---

## Design Tokens

### Colors

```
Background:    #FAFAF9  (warm white)
Surface:       #FFFFFF
Text Primary:  #1C1917
Text Secondary:#78716C
Accent:        #F97316  (warm orange)
Success:       #22C55E
Error:         #EF4444
```

### Typography

```
Heading:       SF Pro Display / Inter, 24px, semibold
Body:          SF Pro Text / Inter, 16px, regular
Caption:       SF Pro Text / Inter, 14px, regular
```

### Spacing

```
Base unit: 4px
xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px
```

---

## Commands

```bash
# Start development
cd app && npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Database migrations
cd supabase && supabase db push

# Generate types from database
supabase gen types typescript --local > ../app/src/types/database.ts
```

---

## Testing

### E2E Testing with Maestro
```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all E2E tests
maestro test .maestro/flows/

# Run specific flow
maestro test .maestro/flows/02-create-moment.yaml

# Visual test recorder
maestro studio
```

### Unit Testing with Jest
```bash
cd app

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Critical Test Flows
- Authentication signup with OTP
- Create moment (3-step flow)
- Join moment with seat tracking
- Arrival flow and host notifications
- Post-meal feedback submission

---

## Git Workflow

### Rules
- ALWAYS create a feature branch before starting major changes
- NEVER commit directly to `main`
- Branch naming: `feature/description` or `fix/description`

### Workflow for Major Changes
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Develop and commit on the feature branch
3. Test locally before pushing
4. Push the branch: `git push -u origin feature/your-feature-name`
5. Only merge to main when fully tested

### Commit Messages
- `feat: description` — new feature
- `fix: description` — bug fix
- `refactor: description` — code cleanup
- `docs: description` — documentation

---

## Files to Read

For full context, see:

- `docs/architecture.md` — Complete technical architecture
- `docs/user-flow.md` — Every screen and interaction mapped
- `docs/decisions.md` — Why we made each technical choice

---

## Current Focus

**We've completed M1-M3. The core loop works.**

Now focusing on:
1. **Testing infrastructure** — E2E and unit tests for reliability
2. **Manual testing** — Validate all flows work end-to-end
3. **M4 features** — Push notifications and reliability signals

The app is functional. Time to make it solid.
