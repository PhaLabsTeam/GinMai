-- Notification preferences from Settings (#6).
-- Both default to on, matching what users got before these were saved.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_joins BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN users.notify_reminders IS 'Running-late reminder before a meal';
COMMENT ON COLUMN users.notify_joins IS 'Alert the host when someone joins their Moment';
