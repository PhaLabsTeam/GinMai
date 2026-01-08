-- GinMai Database Functions
-- Utility functions for geo queries, moment management, and relationships

-- ============================================================================
-- NEARBY MOMENTS
-- Find active moments within radius of a location
-- ============================================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EXPIRE MOMENTS
-- Cron job to mark expired moments as completed
-- ============================================================================
CREATE OR REPLACE FUNCTION expire_moments()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE moments
  SET status = 'completed', updated_at = now()
  WHERE status = 'active'
    AND expires_at < now();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- JOIN MOMENT
-- Safely join a moment, checking availability
-- ============================================================================
CREATE OR REPLACE FUNCTION join_moment(
  p_moment_id UUID,
  p_user_id UUID
)
RETURNS connections AS $$
DECLARE
  v_moment moments;
  v_connection connections;
  v_existing_connection connections;
BEGIN
  -- Get the moment and lock it
  SELECT * INTO v_moment
  FROM moments
  WHERE id = p_moment_id
  FOR UPDATE;

  -- Check if moment exists and is active
  IF v_moment IS NULL THEN
    RAISE EXCEPTION 'Moment not found';
  END IF;

  IF v_moment.status != 'active' THEN
    RAISE EXCEPTION 'Moment is not active';
  END IF;

  -- Check if already joined
  SELECT * INTO v_existing_connection
  FROM connections
  WHERE moment_id = p_moment_id AND user_id = p_user_id;

  IF v_existing_connection IS NOT NULL THEN
    IF v_existing_connection.status = 'confirmed' THEN
      RAISE EXCEPTION 'Already joined this moment';
    ELSE
      -- Rejoin if previously cancelled
      UPDATE connections
      SET status = 'confirmed', joined_at = now(), cancelled_at = NULL
      WHERE id = v_existing_connection.id
      RETURNING * INTO v_connection;
    END IF;
  ELSE
    -- Check if seats available
    IF v_moment.seats_taken >= v_moment.seats_total THEN
      RAISE EXCEPTION 'No seats available';
    END IF;

    -- Check if user is blocked by host
    IF EXISTS (
      SELECT 1 FROM blocked_users
      WHERE blocker_id = v_moment.host_id AND blocked_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Cannot join this moment';
    END IF;

    -- Create the connection
    INSERT INTO connections (moment_id, user_id, status)
    VALUES (p_moment_id, p_user_id, 'confirmed')
    RETURNING * INTO v_connection;
  END IF;

  -- Update seats_taken
  UPDATE moments
  SET seats_taken = (
    SELECT COUNT(*) FROM connections
    WHERE moment_id = p_moment_id AND status = 'confirmed'
  )
  WHERE id = p_moment_id;

  -- Mark moment as full if needed
  IF v_moment.seats_taken + 1 >= v_moment.seats_total THEN
    UPDATE moments SET status = 'full' WHERE id = p_moment_id;
  END IF;

  RETURN v_connection;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LEAVE MOMENT
-- Safely leave a moment
-- ============================================================================
CREATE OR REPLACE FUNCTION leave_moment(
  p_moment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_connection connections;
BEGIN
  -- Get and update the connection
  UPDATE connections
  SET status = 'cancelled', cancelled_at = now()
  WHERE moment_id = p_moment_id
    AND user_id = p_user_id
    AND status = 'confirmed'
  RETURNING * INTO v_connection;

  IF v_connection IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update seats_taken
  UPDATE moments
  SET seats_taken = (
    SELECT COUNT(*) FROM connections
    WHERE moment_id = p_moment_id AND status = 'confirmed'
  )
  WHERE id = p_moment_id;

  -- Reopen moment if it was full
  UPDATE moments
  SET status = 'active'
  WHERE id = p_moment_id AND status = 'full';

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE RELATIONSHIP
-- Create a mutual "eat again" relationship if both users said yes
-- ============================================================================
CREATE OR REPLACE FUNCTION maybe_create_relationship(
  p_moment_id UUID,
  p_from_user UUID,
  p_about_user UUID,
  p_eat_again BOOLEAN
)
RETURNS relationships AS $$
DECLARE
  v_other_feedback feedback;
  v_relationship relationships;
  v_user_a UUID;
  v_user_b UUID;
BEGIN
  -- If this user doesn't want to eat again, no relationship
  IF NOT p_eat_again THEN
    RETURN NULL;
  END IF;

  -- Check if the other user also said yes
  SELECT * INTO v_other_feedback
  FROM feedback
  WHERE moment_id = p_moment_id
    AND from_user = p_about_user
    AND about_user = p_from_user
    AND eat_again = TRUE;

  IF v_other_feedback IS NULL THEN
    -- Other user hasn't responded yes yet
    RETURN NULL;
  END IF;

  -- Both said yes! Create relationship
  -- Ensure user_a < user_b for uniqueness
  IF p_from_user < p_about_user THEN
    v_user_a := p_from_user;
    v_user_b := p_about_user;
  ELSE
    v_user_a := p_about_user;
    v_user_b := p_from_user;
  END IF;

  -- Insert or return existing
  INSERT INTO relationships (user_a, user_b)
  VALUES (v_user_a, v_user_b)
  ON CONFLICT (user_a, user_b) DO NOTHING
  RETURNING * INTO v_relationship;

  IF v_relationship IS NULL THEN
    SELECT * INTO v_relationship
    FROM relationships
    WHERE user_a = v_user_a AND user_b = v_user_b;
  END IF;

  RETURN v_relationship;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GET USER CONNECTIONS (people they'd eat with again)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_connections(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  phone_verified BOOLEAN,
  meals_hosted INTEGER,
  meals_joined INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.first_name,
    u.phone_verified,
    u.meals_hosted,
    u.meals_joined
  FROM users u
  WHERE u.id IN (
    SELECT r.user_b FROM relationships r WHERE r.user_a = p_user_id
    UNION
    SELECT r.user_a FROM relationships r WHERE r.user_b = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INCREMENT USER STATS
-- Called after moment completion
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_moment_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_moment moments;
BEGIN
  SELECT * INTO v_moment FROM moments WHERE id = p_moment_id;

  IF v_moment IS NULL THEN
    RETURN;
  END IF;

  -- Increment host's meals_hosted
  UPDATE users
  SET meals_hosted = meals_hosted + 1
  WHERE id = v_moment.host_id;

  -- Increment guests' meals_joined
  UPDATE users
  SET meals_joined = meals_joined + 1
  WHERE id IN (
    SELECT user_id FROM connections
    WHERE moment_id = p_moment_id AND status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
