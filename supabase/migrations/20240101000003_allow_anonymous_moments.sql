-- Allow anonymous moment creation for M1 (pre-authentication milestone)
-- This policy allows creating moments without requiring authentication
-- Will be restricted when authentication is implemented in M2

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create moments" ON moments;

-- Allow anyone to create moments (for M1 development)
-- In production with auth (M2+), this should require auth.uid() = host_id
CREATE POLICY "Anyone can create moments"
  ON moments FOR INSERT
  WITH CHECK (true);

-- Also allow anonymous viewing of active moments
DROP POLICY IF EXISTS "Authenticated users can view active moments" ON moments;

CREATE POLICY "Anyone can view active moments"
  ON moments FOR SELECT
  USING (
    status = 'active'
    OR status = 'full'
  );

-- Allow updating moments by anyone for now (M1)
DROP POLICY IF EXISTS "Hosts can update own moments" ON moments;

CREATE POLICY "Anyone can update moments"
  ON moments FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deleting/cancelling moments by anyone for now (M1)
DROP POLICY IF EXISTS "Hosts can delete own moments" ON moments;

CREATE POLICY "Anyone can delete moments"
  ON moments FOR DELETE
  USING (true);
