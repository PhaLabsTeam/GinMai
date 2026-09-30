-- Push notifications for Moment events, sent from the database (#45).
--
-- Before this, "guest joined/arrived/cancelled/running late" only reached the
-- host as an in-app toast while their live screen was open, and guests were
-- never told when a host cancelled. Triggers now send through Expo's push
-- service using pg_net, so it works whatever the apps are doing.
--
-- Delivery needs APNs credentials for com.ginmai.app in EAS. Every request and
-- Expo's reply are in net._http_response for debugging.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Sends one notification per token. Not callable by clients (see REVOKE), so
-- nobody can use it to spam other users.
CREATE OR REPLACE FUNCTION public.send_expo_push(
  p_tokens TEXT[],
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_messages JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
           'to', t, 'title', p_title, 'body', p_body, 'data', p_data, 'sound', 'default'))
    INTO v_messages
    FROM unnest(p_tokens) AS t
   WHERE t LIKE 'ExponentPushToken[%' OR t LIKE 'ExpoPushToken[%';

  IF v_messages IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := v_messages,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.send_expo_push(TEXT[], TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- Guest events -> host
CREATE OR REPLACE FUNCTION public.notify_host_of_guest_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID;
  v_token TEXT;
  v_notify_joins BOOLEAN;
  v_guest TEXT;
  v_type TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  SELECT host_id INTO v_host_id FROM moments WHERE id = NEW.moment_id;
  IF v_host_id IS NULL OR v_host_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT push_token, notify_joins INTO v_token, v_notify_joins FROM users WHERE id = v_host_id;
  IF v_token IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT first_name INTO v_guest FROM users WHERE id = NEW.user_id;
  v_guest := COALESCE(v_guest, 'Someone');

  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'cancelled') THEN
    -- Settings > "Someone wants to join"
    IF v_notify_joins IS FALSE THEN
      RETURN NEW;
    END IF;
    v_type := 'guest_joined';
    v_title := 'New guest!';
    v_body := v_guest || ' is joining your table';
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'arrived' AND OLD.status IS DISTINCT FROM 'arrived' THEN
    v_type := 'guest_arrived';
    v_title := 'Guest arrived';
    v_body := v_guest || ' is here';
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'arrived') THEN
    v_type := 'guest_cancelled';
    v_title := 'Guest cancelled';
    v_body := v_guest || ' can''t make it anymore';
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.running_late, false) AND NOT COALESCE(OLD.running_late, false) THEN
    v_type := 'guest_running_late';
    v_title := 'Running late';
    v_body := v_guest || ' is running a few minutes late';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM send_expo_push(
    ARRAY[v_token], v_title, v_body,
    jsonb_build_object('type', v_type, 'momentId', NEW.moment_id, 'guestName', v_guest)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_host_of_guest_event ON connections;
CREATE TRIGGER notify_host_of_guest_event
  AFTER INSERT OR UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_host_of_guest_event();

-- Host cancels (or deletes their account) -> guests
CREATE OR REPLACE FUNCTION public.notify_guests_of_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tokens TEXT[];
  v_place TEXT;
BEGIN
  SELECT array_agg(u.push_token)
    INTO v_tokens
    FROM connections c
    JOIN users u ON u.id = c.user_id
   WHERE c.moment_id = NEW.id
     AND c.status IN ('confirmed', 'arrived')
     AND u.push_token IS NOT NULL;

  IF v_tokens IS NULL THEN
    RETURN NEW;
  END IF;

  v_place := COALESCE(NEW.place_name, NEW.area_name);
  PERFORM send_expo_push(
    v_tokens,
    'Plans changed',
    NEW.host_name || ' had to cancel' || COALESCE(' at ' || v_place, '') || '.',
    jsonb_build_object('type', 'moment_cancelled', 'momentId', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_guests_of_cancellation ON moments;
CREATE TRIGGER notify_guests_of_cancellation
  AFTER UPDATE OF status ON moments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status IN ('active', 'full'))
  EXECUTE FUNCTION public.notify_guests_of_cancellation();
