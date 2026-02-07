-- M5 Phase 2: Create blocks table for user blocking system
-- Allows users to block other users to prevent interaction

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Prevent duplicate blocks
  CONSTRAINT unique_block UNIQUE(blocker_id, blocked_id),

  -- Ensure blocker and blocked are different people
  CONSTRAINT different_users CHECK (blocker_id != blocked_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX idx_blocks_created_at ON blocks(created_at DESC);

-- RLS policies
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks (who they blocked)
CREATE POLICY "Users can view their own blocks"
  ON blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks"
  ON blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- Add comment
COMMENT ON TABLE blocks IS 'User blocking relationships - prevents interaction between users';

-- Update moments RLS to hide blocked users moments
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view active moments" ON moments;

-- Create new policy that includes block filtering
CREATE POLICY "Users can view active moments"
  ON moments
  FOR SELECT
  USING (
    status = 'active'
    AND expires_at > NOW()
    -- Hide moments from users I blocked
    AND host_id NOT IN (
      SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
    )
    -- Hide moments from users who blocked me
    AND host_id NOT IN (
      SELECT blocker_id FROM blocks WHERE blocked_id = auth.uid()
    )
  );

-- Update connections RLS to prevent joining blocked users' moments
-- First, let's check if there's an existing join policy
DROP POLICY IF EXISTS "Users can join moments" ON connections;

-- Create new policy that includes block filtering
CREATE POLICY "Users can join moments"
  ON connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    -- Prevent joining if there's a block relationship
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id IN (
        SELECT host_id FROM moments WHERE id = moment_id
      ))
      OR (blocked_id = auth.uid() AND blocker_id IN (
        SELECT host_id FROM moments WHERE id = moment_id
      ))
    )
  );

-- Add policy to view own connections
DROP POLICY IF EXISTS "Users can view their connections" ON connections;

CREATE POLICY "Users can view their connections"
  ON connections
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR moment_id IN (
      SELECT id FROM moments WHERE host_id = auth.uid()
    )
  );
