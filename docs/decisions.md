# GinMai — Technical Decisions Log

---

## Purpose

This document records *why* we made each technical choice. When future-us wonders "why did we do it this way?", this is where we look.

---

## Format

Each decision follows this structure:

```
## [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Decided | Revisiting | Superseded

**Context:** What situation prompted this decision?

**Options Considered:**
1. Option A — pros, cons
2. Option B — pros, cons

**Decision:** What we chose and why.

**Consequences:** What this means for the project.
```

---

## Decisions

---

## 001: Mobile Framework

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** We need to build a mobile app that works on iOS and Android. We're a small team optimizing for speed.

**Options Considered:**

1. **Native (Swift + Kotlin)** 
   - Pros: Best performance, best UX polish, platform-specific features
   - Cons: 2x development effort, 2x maintenance, slower iteration

2. **React Native (Expo)**
   - Pros: Single codebase, fast iteration, OTA updates, large ecosystem
   - Cons: Slight performance trade-off, occasional native bridge issues

3. **Flutter**
   - Pros: Single codebase, fast rendering, growing ecosystem
   - Cons: Dart learning curve, smaller package ecosystem, larger app size

**Decision:** Expo (React Native)

- Speed of iteration matters more than marginal performance gains
- Our UI is not graphically complex (maps + cards + forms)
- Expo's managed workflow reduces DevOps burden
- OTA updates let us ship fixes without App Store review
- Team knows TypeScript

**Consequences:**
- We accept that some animations may need optimization
- We may need to eject to bare workflow if we hit Expo limitations
- We commit to keeping Expo SDK updated

---

## 002: Backend Platform

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** We need authentication, database, and real-time subscriptions. We're optimizing for launch speed.

**Options Considered:**

1. **Custom (Node.js + Postgres + Socket.io)**
   - Pros: Full control, no vendor lock-in
   - Cons: Significant setup time, auth/security burden, infrastructure management

2. **Firebase**
   - Pros: Fast setup, good auth, real-time DB
   - Cons: NoSQL (harder for relational data), vendor lock-in, pricing at scale

3. **Supabase**
   - Pros: Postgres (relational), real-time built-in, auth included, open source
   - Cons: Younger than Firebase, some features still maturing

**Decision:** Supabase

- Postgres gives us relational power for moments/users/connections
- Real-time subscriptions work out of the box
- Phone auth supported
- Self-hostable if we ever need to leave
- Generous free tier for launch

**Consequences:**
- We learn Supabase's patterns and limitations
- We may need Edge Functions for complex logic
- We design schema carefully (Postgres migrations are heavier than NoSQL)

---

## 003: State Management

**Date:** 2024-XX-XX  
**Status:** Decided

**Context:** We need to manage client-side state: moments, user, location, UI state.

**Options Considered:**

1. **Redux**
   - Pros: Battle-tested, predictable, great devtools
   - Cons: Boilerplate-heavy, overkill for our scale

2. **Context + useReducer**
   - Pros: Built-in, no dependencies
   - Cons: Performance issues at scale, awkward patterns

3. **Zustand**
   - Pros: Minimal API, no boilerplate, good performance, TypeScript-first
   - Cons: Less ecosystem than Redux

4. **Jotai/Recoil**
   - Pros: Atomic state, great for derived state
   - Cons: Learning curve, less intuitive for server-state

**Decision:** Zustand

- Simple API matches our simple needs
- No boilerplate = faster development
- Plays well with React Native
- Easy to understand for any team member

**Consequences:**
- We organize into domain stores (moments, user, location)
- We don't get time-travel debugging (acceptable trade-off)
- We can add middleware (persist, devtools) if needed

---

## 004: Styling

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** We need a styling approach for React Native that's fast to write and maintain.

**Options Considered:**

1. **StyleSheet (built-in)**
   - Pros: Native performance, no dependencies
   - Cons: Verbose, no design system, hard to stay consistent

2. **Styled Components**
   - Pros: Component-based, familiar to web devs
   - Cons: Runtime overhead, harder debugging

3. **NativeWind (Tailwind for RN)**
   - Pros: Utility-first, rapid development, design system built-in
   - Cons: Learning curve, class strings can get long

**Decision:** NativeWind

- Tailwind's utility-first approach is fast for prototyping
- Design tokens (colors, spacing) are baked in
- Familiar to web developers
- Easy to maintain consistency across screens

**Consequences:**
- We commit to Tailwind's paradigm
- We define custom theme tokens for GinMai colors
- We accept longer className strings for complex components

---

## 005: Maps

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** The map is the core UI. We need reliable, performant maps with custom markers.

**Options Considered:**

1. **react-native-maps (Google/Apple)**
   - Pros: Native performance, mature, good marker support
   - Cons: Requires API key, some Google costs at scale

2. **Mapbox**
   - Pros: Beautiful maps, customizable styles
   - Cons: Higher cost, more complex setup

3. **OpenStreetMap / Leaflet wrapper**
   - Pros: Free, open data
   - Cons: Less polished, fewer React Native options

**Decision:** react-native-maps with Google Maps

- Best balance of reliability and features
- Custom markers well-supported
- Google Places API for location search
- Familiar to users

**Consequences:**
- We need Google Cloud project with Maps API enabled
- We budget for API costs (minimal at launch scale)
- We can switch to Apple Maps on iOS for cost savings later

---

## 006: Authentication Method

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** We need minimal-friction auth that provides trust signals.

**Options Considered:**

1. **Email/password**
   - Pros: Universal, simple
   - Cons: Passwords are friction, recovery flows, spam accounts

2. **Social login (Google/Apple/Facebook)**
   - Pros: One-tap, trusted providers
   - Cons: Exposes more identity than needed, dependency on platforms

3. **Phone (SMS OTP)**
   - Pros: Minimal friction, real-world identity signal, works globally
   - Cons: SMS costs, carrier issues occasionally

**Decision:** Phone (SMS OTP) via Supabase Auth

- One real piece of identity (phone) = trust signal
- No password to remember
- Works for travelers (international numbers)
- Supabase handles the complexity

**Consequences:**
- We pay for SMS (Twilio via Supabase)
- We handle country code selection UI
- We rate-limit OTP requests to prevent abuse

---

## 007: No Profile Photos

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** Should users have profile photos?

**Options Considered:**

1. **Required photo**
   - Pros: Trust signal, recognition at meetup
   - Cons: Appearance-based judgment, friction, moderation burden

2. **Optional photo**
   - Pros: User choice
   - Cons: Creates two-tier system, "no photo = sketchy" perception

3. **No photos**
   - Pros: Prevents appearance bias, reduces friction, simplifies moderation
   - Cons: Harder to find person at venue

**Decision:** No profile photos

This is a philosophical decision, not a technical one:
- GinMai is about moments, not people
- We don't want appearance to be a factor in joining
- The table sign solves the "finding each other" problem
- Trust comes from verification, not photos

**Consequences:**
- No image storage/moderation needed
- We invest more in the table sign UX
- We may add photos later if trust becomes an issue (V2+)

---

## 008: No Pre-Meal Chat

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** Should users be able to message before meeting?

**Options Considered:**

1. **Full chat**
   - Pros: Coordinate details, build comfort
   - Cons: Moves conversation off table, vetting/judgment happens pre-meal

2. **Limited messages (templates)**
   - Pros: Some coordination without full chat
   - Cons: Feels restrictive, worst of both worlds

3. **No chat until after meal**
   - Pros: Preserves serendipity, conversation happens in person
   - Cons: Can't coordinate if location unclear

**Decision:** No pre-meal chat

- The magic is in the unknown
- Chat creates a "vetting" phase that kills spontaneity
- Practical coordination handled by: location pin, "running late" button
- We trust the simplicity

**Consequences:**
- No messaging infrastructure needed (for now)
- We need precise location/venue UX
- "Running late" and "Can't find" become more important

---

## 009: Database: Moments Expiration

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** When should a Moment disappear from the map?

**Options Considered:**

1. **At start time**
   - Too early—people might still be joining

2. **At start time + duration**
   - Logical but doesn't account for late arrivals

3. **At start time + duration + buffer**
   - More forgiving

4. **Manual host action**
   - Too much burden

**Decision:** starts_at + duration + 1 hour buffer

- A "quick" (30min) meal expires 1.5 hours after start
- A "normal" (1hr) meal expires 2 hours after start
- A "long" (2hr) meal expires 3 hours after start

This is generous but prevents stale moments cluttering the map.

**Consequences:**
- Cron job runs every 5 minutes to expire moments
- Status transitions: active → completed (expired) or active → full → completed

---

## 010: Geo-Queries Approach

**Date:** 2024-XX-XX
**Status:** Decided

**Context:** How do we find moments near a user?

**Options Considered:**

1. **PostGIS earth_distance**
   - Pros: Accurate, built into Postgres
   - Cons: Requires PostGIS extension, can be slow at scale

2. **Geohash**
   - Pros: Fast lookups, easy indexing
   - Cons: Edge cases at hash boundaries, less precise

3. **H3 (Uber's geo system)**
   - Pros: Elegant hexagons, no edge cases
   - Cons: Learning curve, overkill for our scale

**Decision:** PostGIS with earth_distance function

- Supabase supports PostGIS
- Our scale (Chiang Mai) doesn't need optimization yet
- Simple to understand and debug
- Can add geohash indexing later if needed

**Consequences:**
- We enable PostGIS extension in Supabase
- We add spatial index on (lat, lng)
- We revisit if queries become slow (10k+ moments)

---

## Future Decisions to Make

- [ ] Multi-tenancy for multi-city (separate DBs vs. single with city column?)
- [ ] Notification service (Expo Push vs. OneSignal vs. FCM direct?)
- [ ] Analytics platform (Mixpanel vs. Amplitude vs. PostHog?)
- [ ] Crash reporting (Sentry vs. Crashlytics?)
- [ ] CI/CD (GitHub Actions vs. EAS Build hooks?)

---

*Every decision is a trade-off. We optimize for learning speed at this stage.*
