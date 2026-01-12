-- M2 Feature 4: Require authentication for moment creation
-- This migration restores authentication requirements for moments
-- Now that users can sign up and log in (M2), we require auth for creating moments

-- ============================================================================
-- MOMENTS TABLE RLS - Require Authentication
-- ============================================================================

-- Drop the permissive M1 policies
DROP POLICY IF EXISTS "Anyone can create moments" ON moments;
DROP POLICY IF EXISTS "Anyone can view active moments" ON moments;
DROP POLICY IF EXISTS "Anyone can update moments" ON moments;
DROP POLICY IF EXISTS "Anyone can delete moments" ON moments;

-- Restore authenticated policies for creating moments
-- Users can only create moments as themselves (host_id = their user ID)
CREATE POLICY "Authenticated users can create moments"
  ON moments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = host_id
  );

-- Authenticated users can view active moments
CREATE POLICY "Authenticated users can view active moments"
  ON moments FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'active'
      OR status = 'full'
      OR host_id = auth.uid()
      OR id IN (SELECT moment_id FROM connections WHERE user_id = auth.uid())
    )
  );

-- Hosts can update their own moments
CREATE POLICY "Hosts can update own moments"
  ON moments FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() = host_id
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = host_id
  );

-- Hosts can delete (cancel) their own moments
CREATE POLICY "Hosts can delete own moments"
  ON moments FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid() = host_id
  );
