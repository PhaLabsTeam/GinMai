-- Mutual "eat again" matching, done by the database (#43, #55).
--
-- The app tried to detect matches itself, but feedback RLS only lets people
-- read feedback they wrote, so it could never see the other person's "yes"
-- and no match was ever made. Clients could also insert any match they liked
-- (INSERT ... WITH CHECK (true)), e.g. between two strangers.
--
-- Now a trigger on feedback creates the match (and the relationship behind
-- Connections) when both people said yes about each other for the same
-- Moment, and sends "You matched!" to both. Clients can only read matches.

CREATE OR REPLACE FUNCTION public.create_match_on_mutual_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a UUID := LEAST(NEW.from_user, NEW.about_user);
  v_user_b UUID := GREATEST(NEW.from_user, NEW.about_user);
  v_inserted INTEGER;
  v_from_name TEXT;
  v_about_name TEXT;
  v_from_token TEXT;
  v_about_token TEXT;
BEGIN
  IF NEW.eat_again IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM feedback
     WHERE moment_id = NEW.moment_id
       AND from_user = NEW.about_user
       AND about_user = NEW.from_user
       AND eat_again IS TRUE
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO relationships (user_a, user_b)
  VALUES (v_user_a, v_user_b)
  ON CONFLICT (user_a, user_b) DO NOTHING;

  INSERT INTO eat_again_matches (user_a_id, user_b_id, moment_id)
  SELECT v_user_a, v_user_b, NEW.moment_id
   WHERE NOT EXISTS (
     SELECT 1 FROM eat_again_matches
      WHERE user_a_id = v_user_a AND user_b_id = v_user_b AND moment_id = NEW.moment_id
   );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Only announce a new match
  IF v_inserted > 0 THEN
    SELECT first_name, push_token INTO v_from_name, v_from_token FROM users WHERE id = NEW.from_user;
    SELECT first_name, push_token INTO v_about_name, v_about_token FROM users WHERE id = NEW.about_user;
    IF v_about_token IS NOT NULL THEN
      PERFORM send_expo_push(ARRAY[v_about_token], 'You matched!',
        'You and ' || COALESCE(v_from_name, 'your meal buddy') || ' would eat together again.',
        jsonb_build_object('type', 'eat_again_match'));
    END IF;
    IF v_from_token IS NOT NULL THEN
      PERFORM send_expo_push(ARRAY[v_from_token], 'You matched!',
        'You and ' || COALESCE(v_about_name, 'your meal buddy') || ' would eat together again.',
        jsonb_build_object('type', 'eat_again_match'));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_match_on_mutual_feedback ON feedback;
CREATE TRIGGER create_match_on_mutual_feedback
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_feedback();

-- Clients no longer create matches
DROP POLICY IF EXISTS "System can create matches" ON eat_again_matches;

-- Backfill: pairs that both said yes before this trigger existed
INSERT INTO relationships (user_a, user_b)
SELECT DISTINCT LEAST(f1.from_user, f1.about_user), GREATEST(f1.from_user, f1.about_user)
  FROM feedback f1
  JOIN feedback f2
    ON f2.moment_id = f1.moment_id AND f2.from_user = f1.about_user AND f2.about_user = f1.from_user
 WHERE f1.eat_again IS TRUE AND f2.eat_again IS TRUE
ON CONFLICT (user_a, user_b) DO NOTHING;

INSERT INTO eat_again_matches (user_a_id, user_b_id, moment_id)
SELECT DISTINCT LEAST(f1.from_user, f1.about_user), GREATEST(f1.from_user, f1.about_user), f1.moment_id
  FROM feedback f1
  JOIN feedback f2
    ON f2.moment_id = f1.moment_id AND f2.from_user = f1.about_user AND f2.about_user = f1.from_user
 WHERE f1.eat_again IS TRUE AND f2.eat_again IS TRUE
   AND NOT EXISTS (
     SELECT 1 FROM eat_again_matches m
      WHERE m.user_a_id = LEAST(f1.from_user, f1.about_user)
        AND m.user_b_id = GREATEST(f1.from_user, f1.about_user)
        AND m.moment_id = f1.moment_id
   );
