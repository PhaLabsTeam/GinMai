# GinMai — Technical Architecture

---

## Overview

This document translates the product philosophy into technical structure. Every decision here answers: *Does this make the path from hunger to human connection shorter?*

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                      │
│                         (Expo React Native)                              │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│   │    Map      │  │   Moment    │  │   Create    │  │   Profile   │    │
│   │   Screen    │  │   Detail    │  │    Flow     │  │   Screen    │    │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                        State (Zustand)                           │   │
│   │   moments[] | user | location | ui                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     Supabase Client                              │   │
│   │   Real-time subscriptions | Auth | Storage | REST                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket + HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             SUPABASE                                     │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│   │  Realtime   │  │    Auth     │  │  Database   │  │   Storage   │    │
│   │  (moments)  │  │   (phone)   │  │ (Postgres)  │  │  (avatars)  │    │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      Edge Functions                              │   │
│   │   create-moment | join-moment | expire-moments | notifications   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (future)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                               │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│   │   Twilio    │  │   Google    │  │    Expo     │                     │
│   │  (SMS/OTP)  │  │   Places    │  │    Push     │                     │
│   └─────────────┘  └─────────────┘  └─────────────┘                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

#### `moments`

The core entity. A time-bound opportunity to share a meal.

```sql
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Host
  host_id UUID REFERENCES users(id),
  host_name TEXT NOT NULL,
  
  -- When
  starts_at TIMESTAMPTZ NOT NULL,
  duration TEXT NOT NULL CHECK (duration IN ('quick', 'normal', 'long')),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Where
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  place_name TEXT,
  area_name TEXT,
  
  -- What
  seats_total SMALLINT NOT NULL DEFAULT 2 CHECK (seats_total BETWEEN 1 AND 4),
  seats_taken SMALLINT NOT NULL DEFAULT 0,
  note TEXT CHECK (char_length(note) <= 140),
  
  -- State
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  
  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for geo queries and active moments
CREATE INDEX idx_moments_location ON moments USING gist (
  ll_to_earth(lat, lng)
);
CREATE INDEX idx_moments_active ON moments (status, starts_at) 
  WHERE status = 'active';
CREATE INDEX idx_moments_host ON moments (host_id);
```

#### `users`

Minimal identity. First name + phone verification.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  phone TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 30),
  
  -- Verification
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Trust signals (earned over time)
  meals_hosted INTEGER NOT NULL DEFAULT 0,
  meals_joined INTEGER NOT NULL DEFAULT 0,
  no_shows INTEGER NOT NULL DEFAULT 0,
  
  -- State
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'limited', 'banned')),
  
  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_phone ON users (phone);
```

#### `connections`

When someone joins a moment.

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- State
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'completed')),
  
  -- Timestamps
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  arrived_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Unique constraint: one connection per user per moment
  UNIQUE (moment_id, user_id)
);

CREATE INDEX idx_connections_moment ON connections (moment_id);
CREATE INDEX idx_connections_user ON connections (user_id);
```

#### `relationships`

Mutual "eat again" connections.

```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_a UUID NOT NULL REFERENCES users(id),
  user_b UUID NOT NULL REFERENCES users(id),
  
  -- Both must say yes for this to exist
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure no duplicates (a,b) and (b,a)
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);

CREATE INDEX idx_relationships_user ON relationships (user_a);
CREATE INDEX idx_relationships_user_b ON relationships (user_b);
```

#### `feedback`

Post-meal responses (private, not public reviews).

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  moment_id UUID NOT NULL REFERENCES moments(id),
  from_user UUID NOT NULL REFERENCES users(id),
  about_user UUID NOT NULL REFERENCES users(id),
  
  -- Simple rating
  rating TEXT NOT NULL CHECK (rating IN ('great', 'okay', 'nope')),
  
  -- Optional elaboration (for 'nope' cases, reviewed by team)
  note TEXT,
  
  -- Would eat again?
  eat_again BOOLEAN,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (moment_id, from_user, about_user)
);
```

---

## Real-Time Architecture

GinMai needs to feel *alive*. When someone creates a Moment, others should see it appear. This requires real-time subscriptions.

### Supabase Realtime

Subscribe to moments in a geographic area:

```typescript
// Subscribe to active moments near user
const subscription = supabase
  .channel('nearby-moments')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'moments',
      filter: `status=eq.active`
    },
    (payload) => {
      // Filter by distance client-side (Supabase doesn't support geo filters in realtime yet)
      const moment = payload.new;
      if (isWithinRadius(moment, userLocation, radiusKm)) {
        handleMomentUpdate(payload.eventType, moment);
      }
    }
  )
  .subscribe();
```

### Geo-Filtering Strategy

Since Supabase Realtime doesn't support PostGIS filters, we:

1. **Subscribe broadly** — All active moments
2. **Filter client-side** — Check distance from user
3. **Optimize later** — If scale requires, add geo-partitioned channels

For Chiang Mai launch (small area), this is sufficient.

---

## API Design

### Edge Functions

#### `create-moment`

```typescript
// POST /functions/v1/create-moment
interface CreateMomentRequest {
  starts_at: string;          // ISO datetime
  duration: 'quick' | 'normal' | 'long';
  lat: number;
  lng: number;
  place_name?: string;
  area_name?: string;
  seats_total?: number;       // default: 2
  note?: string;
}

interface CreateMomentResponse {
  moment: Moment;
}
```

#### `join-moment`

```typescript
// POST /functions/v1/join-moment
interface JoinMomentRequest {
  moment_id: string;
}

interface JoinMomentResponse {
  connection: Connection;
  moment: Moment;
}
```

#### `cancel-moment`

```typescript
// POST /functions/v1/cancel-moment
interface CancelMomentRequest {
  moment_id: string;
}
```

#### `leave-moment`

```typescript
// POST /functions/v1/leave-moment
interface LeaveConnectionRequest {
  moment_id: string;
}
```

### Database Functions

#### `nearby_moments`

Find active moments within radius:

```sql
CREATE OR REPLACE FUNCTION nearby_moments(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5
)
RETURNS SETOF moments AS $$
BEGIN
  RETURN QUERY
  SELECT m.*
  FROM moments m
  WHERE m.status = 'active'
    AND m.expires_at > now()
    AND earth_distance(
      ll_to_earth(m.lat, m.lng),
      ll_to_earth(user_lat, user_lng)
    ) / 1000 < radius_km
  ORDER BY m.starts_at ASC;
END;
$$ LANGUAGE plpgsql;
```

#### `expire_moments`

Cron job to mark expired moments:

```sql
CREATE OR REPLACE FUNCTION expire_moments()
RETURNS void AS $$
BEGIN
  UPDATE moments
  SET status = 'completed', updated_at = now()
  WHERE status = 'active'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
```

---

## Authentication Flow

### Phone-Based Auth (Supabase)

```typescript
// 1. Request OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+66812345678',
});

// 2. Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+66812345678',
  token: '123456',
  type: 'sms',
});

// 3. Create/update user profile
if (data.user) {
  await supabase
    .from('users')
    .upsert({
      id: data.user.id,
      phone: data.user.phone,
      first_name: firstName,
      phone_verified: true,
      verified_at: new Date().toISOString(),
    });
}
```

### Session Management

- Supabase handles JWT tokens
- Tokens refresh automatically
- User stays logged in until explicit logout

---

## State Management

### Zustand Stores

#### `useMomentsStore`

```typescript
interface MomentsState {
  moments: Moment[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNearby: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  createMoment: (data: CreateMomentData) => Promise<Moment>;
  subscribeToNearby: (lat: number, lng: number) => () => void;
}
```

#### `useUserStore`

```typescript
interface UserState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  
  // Actions
  signIn: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

#### `useLocationStore`

```typescript
interface LocationState {
  location: { lat: number; lng: number } | null;
  permission: 'granted' | 'denied' | 'undetermined';
  loading: boolean;
  
  // Actions
  requestPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
}
```

---

## Map Implementation

### React Native Maps + Markers

```typescript
// Custom marker for moments
const MomentMarker = ({ moment, onPress }: MomentMarkerProps) => (
  <Marker
    coordinate={{ latitude: moment.lat, longitude: moment.lng }}
    onPress={() => onPress(moment)}
  >
    <View style={styles.pulse}>
      <View style={styles.pulseInner} />
    </View>
  </Marker>
);

// Animated pulse effect
const styles = StyleSheet.create({
  pulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F97316',
  },
});
```

### Location Permissions

```typescript
import * as Location from 'expo-location';

const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status === 'granted') {
    const location = await Location.getCurrentPositionAsync({});
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  }
  
  return null;
};
```

---

## Push Notifications (M3+)

### Expo Push Notifications

```typescript
import * as Notifications from 'expo-notifications';

// Register for push
const registerForPush = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
};

// Store token in user profile
await supabase
  .from('users')
  .update({ push_token: token })
  .eq('id', userId);
```

### Notification Types

| Event | Recipient | Message |
|-------|-----------|---------|
| Guest joins | Host | "Alex wants to join your lunch" |
| Confirmed | Guest | "You're in! See you at 12:30" |
| Reminder | Both | "Lunch in 10 minutes" |
| Running late | Host/Guest | "[Name] is running a few minutes late" |
| Cancelled | Guest | "Maya had to cancel. Sorry about that." |

---

## Security

### Row Level Security (RLS)

```sql
-- Users can only read/update their own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Moments are visible to all authenticated users
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active moments"
  ON moments FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'active');

CREATE POLICY "Users can create moments"
  ON moments FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own moments"
  ON moments FOR UPDATE
  USING (auth.uid() = host_id);
```

### Rate Limiting

- Moment creation: 5 per hour per user
- Join requests: 10 per hour per user
- OTP requests: 3 per hour per phone number

Implemented via Edge Functions with Redis/Upstash.

---

## Performance Considerations

### Moment Queries

- Index on `(status, starts_at)` for active moments
- PostGIS index for geo queries
- Client-side caching with stale-while-revalidate

### Real-Time

- Subscribe to broad channel, filter client-side
- Debounce location updates (don't re-query on every GPS tick)
- Unsubscribe when app backgrounds

### Images

- No profile photos in v1 (intentional)
- Place photos from Google Places (cached)
- Lazy load off-screen content

---

## Monitoring & Analytics

### Key Metrics

| Metric | What It Tells Us |
|--------|------------------|
| Moments created per day | Host activation |
| Moments joined per day | Guest activation |
| Join rate (joins / views) | Moment quality / trust |
| Show-up rate | Reliability |
| "Eat again" rate | Connection quality |
| Time to first moment | Onboarding friction |

### Tools

- **Supabase Dashboard** — Database metrics, auth stats
- **Expo Analytics** — App usage, crashes
- **Sentry** — Error tracking
- **Mixpanel/Amplitude** — Product analytics (M2+)

---

## Deployment

### Expo

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Supabase

- Hosted on Supabase Cloud (free tier for launch)
- Database in Singapore region (closest to Thailand)
- Edge Functions deployed via Supabase CLI

---

## Migration Path

### M1 → M2 (Add Auth)

- Add phone verification flow
- Create users table
- Link moments to host_id
- Add join functionality

### M2 → M3 (Full Loop)

- Add connections table
- Implement join/cancel flows
- Add push notifications
- Post-meal feedback

### M3 → M4 (Trust & Safety)

- Verification badges
- No-show tracking
- Report/block functionality
- "Eat again" relationships

---

## Open Technical Questions

| Question | Options | Leaning |
|----------|---------|---------|
| Geo queries at scale | PostGIS vs. Geohash vs. H3 | PostGIS for now, revisit at 10k users |
| Chat (if ever) | Supabase Realtime vs. Stream vs. None | None (preserve serendipity) |
| Offline support | Cache moments locally? | Minimal—this is a real-time app |
| Multi-city | Separate DBs vs. partition | Single DB with city column |

---

*This architecture is designed to get to launch fast, then iterate. We're optimizing for learning speed, not theoretical scale.*
