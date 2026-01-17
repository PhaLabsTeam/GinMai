-- Add 'arrived' status to connections table
-- This status is set when a guest marks themselves as arrived at the moment

-- Drop the existing constraint
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_status_check;

-- Add the updated constraint with 'arrived' status
ALTER TABLE connections ADD CONSTRAINT connections_status_check
  CHECK (status IN ('confirmed', 'cancelled', 'no_show', 'completed', 'arrived'));

-- Add running_late columns if they don't exist (for M3 arrival flow)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'connections' AND column_name = 'running_late') THEN
    ALTER TABLE connections ADD COLUMN running_late BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'connections' AND column_name = 'running_late_at') THEN
    ALTER TABLE connections ADD COLUMN running_late_at TIMESTAMPTZ;
  END IF;
END $$;
