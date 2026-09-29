-- M4 Phase 4: Create eat_again_matches table
-- Tracks mutual "eat again" selections between users

CREATE TABLE IF NOT EXISTS eat_again_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_b_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE NOT NULL,
  matched_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Ensure we don't create duplicate matches (order doesn't matter)
  CONSTRAINT unique_match UNIQUE(user_a_id, user_b_id, moment_id),

  -- Ensure user_a and user_b are different people
  CONSTRAINT different_users CHECK (user_a_id != user_b_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_eat_again_matches_user_a ON eat_again_matches(user_a_id);
CREATE INDEX idx_eat_again_matches_user_b ON eat_again_matches(user_b_id);
CREATE INDEX idx_eat_again_matches_moment ON eat_again_matches(moment_id);
CREATE INDEX idx_eat_again_matches_matched_at ON eat_again_matches(matched_at DESC);

-- RLS policies
ALTER TABLE eat_again_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches they're part of
CREATE POLICY "Users can view their own matches"
  ON eat_again_matches
  FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- System can insert matches (will be done when both users select "eat again")
CREATE POLICY "System can create matches"
  ON eat_again_matches
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE eat_again_matches IS 'Tracks mutual eat-again selections between users who have shared a meal';
