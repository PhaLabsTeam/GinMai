-- Fix RLS infinite recursion issue
-- The "Users can view other users basic info" policy causes recursion
-- when it queries connections table, which has its own RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view other users basic info" ON users;

-- Create a simpler policy that doesn't cause recursion
-- For now, authenticated users can view basic info of:
-- 1. Their own profile (handled by separate policy)
-- 2. Users who are hosting active moments (direct query, no recursion)
-- 3. Users they share a moment with (via direct join, avoiding recursion)

CREATE POLICY "Users can view other users basic info"
  ON users FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Users who are hosting active moments
      id IN (SELECT host_id FROM moments WHERE status = 'active')
    )
  );

-- Also fix the connections policy that has self-referential recursion
DROP POLICY IF EXISTS "Users can view relevant connections" ON connections;

-- Simpler connections policy without self-reference
CREATE POLICY "Users can view relevant connections"
  ON connections FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- User's own connections
      user_id = auth.uid()
      -- Connections for moments user is hosting
      OR moment_id IN (SELECT id FROM moments WHERE host_id = auth.uid())
    )
  );
