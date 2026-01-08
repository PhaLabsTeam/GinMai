-- GinMai Row Level Security Policies
-- Secure access to all tables based on authentication

-- ============================================================================
-- USERS TABLE RLS
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can view basic info of other users (for moment details)
CREATE POLICY "Users can view other users basic info"
  ON users FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND id IN (
      -- Users who are hosting moments
      SELECT host_id FROM moments WHERE status = 'active'
      UNION
      -- Users in the same moment
      SELECT c.user_id FROM connections c
      WHERE c.moment_id IN (
        SELECT moment_id FROM connections WHERE user_id = auth.uid()
      )
      UNION
      -- Users in relationships
      SELECT user_a FROM relationships WHERE user_b = auth.uid()
      UNION
      SELECT user_b FROM relationships WHERE user_a = auth.uid()
    )
  );

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- MOMENTS TABLE RLS
-- ============================================================================
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view active moments
CREATE POLICY "Authenticated users can view active moments"
  ON moments FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'active'
      OR host_id = auth.uid()
      OR id IN (SELECT moment_id FROM connections WHERE user_id = auth.uid())
    )
  );

-- Users can create moments (as host)
CREATE POLICY "Users can create moments"
  ON moments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = host_id
  );

-- Hosts can update their own moments
CREATE POLICY "Hosts can update own moments"
  ON moments FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Hosts can delete (cancel) their own moments
CREATE POLICY "Hosts can delete own moments"
  ON moments FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================================================
-- CONNECTIONS TABLE RLS
-- ============================================================================
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can view connections for moments they're part of
CREATE POLICY "Users can view relevant connections"
  ON connections FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      user_id = auth.uid()
      OR moment_id IN (
        SELECT id FROM moments WHERE host_id = auth.uid()
      )
      OR moment_id IN (
        SELECT moment_id FROM connections WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create their own connections (join moments)
CREATE POLICY "Users can join moments"
  ON connections FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- Users can update their own connections
CREATE POLICY "Users can update own connections"
  ON connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own connections (leave moments)
CREATE POLICY "Users can leave moments"
  ON connections FOR DELETE
  USING (auth.uid() = user_id);

-- Hosts can update connections for their moments (mark no-show, etc.)
CREATE POLICY "Hosts can update connections for their moments"
  ON connections FOR UPDATE
  USING (
    moment_id IN (SELECT id FROM moments WHERE host_id = auth.uid())
  );

-- ============================================================================
-- RELATIONSHIPS TABLE RLS
-- ============================================================================
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- Users can view their own relationships
CREATE POLICY "Users can view own relationships"
  ON relationships FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (user_a = auth.uid() OR user_b = auth.uid())
  );

-- Relationships are created by the system (via function), not directly
-- But we allow insert if user is part of the relationship
CREATE POLICY "System can create relationships"
  ON relationships FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (user_a = auth.uid() OR user_b = auth.uid())
  );

-- Users can delete relationships they're part of
CREATE POLICY "Users can remove relationships"
  ON relationships FOR DELETE
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- ============================================================================
-- FEEDBACK TABLE RLS
-- ============================================================================
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback they gave
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = from_user);

-- Users can create feedback
CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = from_user
    AND auth.uid() != about_user
  );

-- Users cannot update or delete feedback (immutable)

-- ============================================================================
-- BLOCKED USERS TABLE RLS
-- ============================================================================
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = blocker_id
  );

-- Users can unblock others
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);
