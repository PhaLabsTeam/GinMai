# GinMai — Architecture Vision

**กินไหม** — "Wanna eat?"

## Core Philosophy

**The app is a door, not a room.**

Users don't come here to spend time. They come here to *leave*—to step through into a real moment with a real person. Every screen, every interaction, every pixel should push them toward that door.

---

## The Three Primitives

Everything in the system reduces to three concepts:

### 1. **Moment**
A time + place + openness.

```
{
  window: "13:00–14:00",
  area: { center: [lat, lng], radius: "10 min walk" },
  vibe: "Quick bite" | "Proper lunch" | "Just coffee",
  seats: 2,
  note: "First day in Lisbon. Nothing fancy."
}
```

A Moment is not a reservation. It's an *intention*. Flexible by design.

### 2. **Presence**
A person who has declared: "I exist, I'm open, I'm here."

Presence is lightweight. It can be:
- **Active**: "I created a Moment"
- **Passive**: "I'm open to joining something"
- **Invisible**: "Just browsing"

### 3. **Connection**
When a Presence joins a Moment.

Not a match. Not a friendship. Just: *we're eating together*.

Connections have no history by default. Each meal is complete in itself. (But patterns can emerge for those who want them.)

---

## The User Journey

### Phase 1: Arrival

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                     Eating soon?                            │
│                                                             │
│                                                             │
│                    ┌─────────────┐                          │
│                    │    [Map]    │                          │
│                    │             │                          │
│                    │   • • •     │   ← Gentle pulses        │
│                    │      •      │     (active Moments)     │
│                    │             │                          │
│                    └─────────────┘                          │
│                                                             │
│                                                             │
│         ┌─────────────────────────────────────┐             │
│         │        Host your own meal →         │             │
│         └─────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Zero friction entry.** Location permission is the only gate. Identity comes later—and only as much as needed.

### Phase 2: Discovery

Tapping a pulse reveals a Moment card:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🍜  Lunch at 13:10                                        │
│       Seafood place by the river                            │
│                                                             │
│   ┌───────────────────────────────────────────────────────┐ │
│   │  "First day in Lisbon. Nothing fancy."                │ │
│   └───────────────────────────────────────────────────────┘ │
│                                                             │
│       2 seats  ·  15 min walk  ·  ~€15                      │
│                                                             │
│                                                             │
│                    ┌───────────────┐                        │
│                    │     Join      │                        │
│                    └───────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What you DON'T see:**
- Full profile
- Chat history
- Social graph
- Reviews/ratings (initially)

**Why:** The less you know, the more it feels like serendipity. Profiles invite judgment. We want presence.

### Phase 3: Commitment

One tap: "Join."

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                        You're in.                           │
│                                                             │
│                   Say hi when you arrive.                   │
│                                                             │
│                                                             │
│                      ┌──────────┐                           │
│                      │  42:18   │  ← Countdown              │
│                      └──────────┘                           │
│                                                             │
│                                                             │
│                    ┌─────────────┐                          │
│                    │    [Map]    │                          │
│                    │      📍     │                          │
│                    └─────────────┘                          │
│                                                             │
│                                                             │
│    ┌────────────────────────────────────────────────────┐   │
│    │           Can't make it anymore →                  │   │
│    └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**No pre-meal chat.** The conversation happens at the table, not on the screen.

(Optional: A single-tap "Running 5 min late" button. Nothing more.)

### Phase 4: The Meal

The app does almost nothing here.

Maybe:
- A subtle table marker (digital or physical)
- A "I'm here" tap to help people find each other

Then: **silence.** The app disappears.

### Phase 5: After

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    How was lunch?                           │
│                                                             │
│      ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│      │   😊    │    │   😐    │    │   😕    │              │
│      │  Great  │    │  Fine   │    │  Meh    │              │
│      └─────────┘    └─────────┘    └─────────┘              │
│                                                             │
│                                                             │
│             ┌──────────────────────────────┐                │
│             │    Eat together again? →     │                │
│             └──────────────────────────────┘                │
│                                                             │
│                                                             │
│                      Skip                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Minimal feedback.** Just enough to build trust signals over time.

"Eat together again?" is how strangers become acquaintances—organically, without forcing it.

---

## Identity Design

**Principle:** You're joining a moment, not evaluating a person.

### What's Visible

| Element | Visible? | Why |
|---------|----------|-----|
| **First name** | ✓ | Humanizes without exposing |
| **Verification badge** | ✓ | Trust signal without biography |
| **Photo** | ✗ | Invites appearance-based judgment |
| **Bio/job title** | ✗ | Invites professional filtering |
| **Age** | ✗ | Irrelevant to sharing a meal |
| **Social connections** | ✗ | This isn't networking |

### The Moment Card

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   🍜  Lunch at 13:10                                    │
│       Seafood place by the river                        │
│                                                         │
│       Sara ✓                                            │
│                                                         │
│   "First day in Lisbon. Nothing fancy."                 │
│                                                         │
│       2 seats  ·  15 min walk  ·  ~€15                  │
│                                                         │
│                  ┌───────────┐                          │
│                  │   Join    │                          │
│                  └───────────┘                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Verification Tiers

**V1 (Launch):**
- Phone number verification → basic ✓ badge
- Low friction, baseline trust

**V2 (Earned Trust):**
- "Showed up X times" indicator
- Optional government ID for enhanced badge
- Vouches from other verified users

### The Philosophy

The verification badge answers: *"Is this safe?"*
The first name answers: *"Is this human?"*
Everything else is discovered at the table.

---

Safety without bureaucracy. Here's the layered approach:

### Layer 1: Passive Trust
- Moments only suggest public places
- Daylight hours weighted in suggestions
- Group meals (3-4) offered as default option

### Layer 2: Verified Presence
- Optional: Connect a real identity (LinkedIn, government ID)
- Verified users get a subtle indicator
- Not required, but builds trust over time

### Layer 3: Reputation (Emergent)
- "Showed up 12 times"
- "Usually hosts" / "Usually joins"
- No scores. No reviews. Just *patterns*.

### Layer 4: Safety Net
- Share your meal plan with a friend (one tap)
- "I'm here" check-in
- Easy exit: "Something came up" button (no explanation needed)

---

## The Hardest Problem: Density

**If the map is empty, the product is dead.**

### Strategy: Concentrate, Don't Disperse

1. **Launch in one neighborhood of one city**
   - Not "Lisbon." Not "Baixa."
   - One 10-block radius. Saturate it.

2. **Seed with real humans**
   - Not bots. Not paid actors.
   - Nomads. Travelers. Remote workers who believe in this.
   - The founding 100 who host the first 1,000 meals.

3. **Time-box availability**
   - Don't show "nobody's here right now"
   - Show "Lunch tomorrow: 3 people already open"
   - Create anticipation, not emptiness.

4. **Ritual creation**
   - "Lisbon Lunch Club: Every Tuesday, 13:00, Timeout Market"
   - Recurring moments that people can count on
   - Structure creates spontaneity (paradoxically)

---

## What GinMai Is NOT

Clarity by negation:

- **Not dating.** No photos. No swiping. No flirting features.
- **Not networking.** No titles. No LinkedIn connect.
- **Not Meetup.** No groups. No memberships. No "interests."
- **Not a restaurant app.** We don't care about the food.
- **Not async.** No messaging threads. No "let's plan for next week."

GinMai is the anti-app. It exists to stop existing.

---

## The Host's Psychology (Core Truth)

A host isn't trying to lead. **They're trying not to eat alone—and realizing they don't have to.**

### The Three Fears

| Fear | The Quiet Voice | How GinMai Answers |
|------|-----------------|-------------------|
| **Rejection** | "What if no one joins?" | "You're still just having lunch." |
| **Obligation** | "What if I'm stuck entertaining them?" | The app carries the social load, not you. |
| **Being Misread** | "Will people think I'm lonely? Weird?" | Intent is framed by the app, not you. |

### The Psychological Switch

> Before: *"Am I brave enough to invite someone?"*
> After: *"Why not make lunch visible?"*

**Design mandate:** Every screen, every word, every interaction must flip this switch.

### The Host Mantra

> *"You're not hosting. You're just open."*

### What Hosts Are NOT Motivated By

- Not attention
- Not leadership
- Not social status
- Not control
- Not efficiency

They are motivated by **soft companionship**.

---

## The Empty Map (Day One Philosophy)

Most apps treat emptiness as failure. GinMai treats it as **potential**.

> **"An empty map should feel like a calm lake, not an empty room."**

### The Reframe

Not: "No users nearby."
But: "You're early. And that's powerful."

### The Exact Copy

```
Headline: Nothing here yet.

Body: Chiang Mai is full of people eating lunch.
      Someone just needs to make the first seat visible.

Primary CTA: Share where you're eating

Secondary (subtle): Or just look around
                    (does nothing — respects hesitation)
```

### The Creation Flow

Three taps. Maximum.

1. **Time** — defaults to now + 10 min
2. **Place** — uses current location
3. **Seats** — default: 1

Final confirmation:

> *"Lunch visible. You're just eating as planned."*

That last line removes all performance pressure.

### If They Don't Tap

Nothing breaks. They close the app. They eat alone.
And the seed is still planted.

Tomorrow, they might open it again—and this time, feel different.

### The Product Truth

> Early-stage density is not solved by incentives.
> It's solved by **dignity**.

---

## Open Questions

Things still to resolve:

1. **Identity minimum**: What's the least we need to know about someone? Just a first name? A photo? Nothing?

2. **The "match me" mode**: Does the passive option ("just match me with someone") exist at launch? Or is it a v2 feature?

3. **Revenue model**: How does this sustain itself? (Not urgent, but worth naming.)

4. **The physical artifact**: The table sign. Is it real? Digital? Both? What does it look like?

---

## Next Step

Define the first user story in full technical detail:

> "I just landed in Lisbon. I open the app. I join a lunch. I show up. I leave feeling less alone."

Every screen. Every state. Every edge case.

Then: build.
