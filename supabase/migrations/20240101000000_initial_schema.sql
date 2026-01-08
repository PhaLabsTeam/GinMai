-- GinMai Initial Schema
-- Creates core tables: users, moments, connections, relationships, feedback

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ============================================================================
-- USERS TABLE
-- Minimal identity. First name + phone verification.
-- ============================================================================
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

  -- Push notifications
  push_token TEXT,

  -- State
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'limited', 'banned')),

  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_phone ON users (phone);

-- ============================================================================
-- MOMENTS TABLE
-- The core entity. A time-bound opportunity to share a meal.
-- ============================================================================
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Host
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
CREATE INDEX idx_moments_expires ON moments (expires_at)
  WHERE status = 'active';

-- ============================================================================
-- CONNECTIONS TABLE
-- When someone joins a moment.
-- ============================================================================
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

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
CREATE INDEX idx_connections_status ON connections (status);

-- ============================================================================
-- RELATIONSHIPS TABLE
-- Mutual "eat again" connections.
-- ============================================================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Both must say yes for this to exist
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure no duplicates (a,b) and (b,a)
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);

CREATE INDEX idx_relationships_user_a ON relationships (user_a);
CREATE INDEX idx_relationships_user_b ON relationships (user_b);

-- ============================================================================
-- FEEDBACK TABLE
-- Post-meal responses (private, not public reviews).
-- ============================================================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  about_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Simple rating
  rating TEXT NOT NULL CHECK (rating IN ('great', 'okay', 'nope')),

  -- Optional elaboration (for 'nope' cases, reviewed by team)
  note TEXT,

  -- Would eat again?
  eat_again BOOLEAN,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (moment_id, from_user, about_user)
);

CREATE INDEX idx_feedback_moment ON feedback (moment_id);
CREATE INDEX idx_feedback_from_user ON feedback (from_user);
CREATE INDEX idx_feedback_about_user ON feedback (about_user);

-- ============================================================================
-- BLOCKED USERS TABLE
-- For safety - allow users to block others
-- ============================================================================
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users (blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users (blocked_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at column
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moments_updated_at
  BEFORE UPDATE ON moments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
