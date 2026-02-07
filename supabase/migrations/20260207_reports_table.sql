-- M5 Phase 1: Create reports table for user reporting system
-- Allows users to report inappropriate behavior, no-shows, etc.

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  moment_id UUID REFERENCES moments(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Prevent duplicate reports
  CONSTRAINT unique_report_per_moment UNIQUE(reporter_id, reported_user_id, moment_id),

  -- Ensure reporter and reported are different people
  CONSTRAINT different_users CHECK (reporter_id != reported_user_id),

  -- Valid categories
  CONSTRAINT valid_category CHECK (category IN (
    'no_show',
    'inappropriate_behavior',
    'harassment',
    'fake_profile',
    'safety_concern',
    'other'
  )),

  -- Valid status
  CONSTRAINT valid_status CHECK (status IN (
    'pending',
    'reviewing',
    'resolved',
    'dismissed'
  ))
);

-- Indexes for faster lookups
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own submitted reports
CREATE POLICY "Users can view their own reports"
  ON reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can submit reports
CREATE POLICY "Users can submit reports"
  ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Only admins can update reports (for review)
-- Note: For now, we'll manage this through Supabase Studio
-- In future, add admin role check here

-- Add comment
COMMENT ON TABLE reports IS 'User-submitted reports for inappropriate behavior, no-shows, and safety concerns';
COMMENT ON COLUMN reports.category IS 'Type of report: no_show, inappropriate_behavior, harassment, fake_profile, safety_concern, other';
COMMENT ON COLUMN reports.status IS 'Review status: pending, reviewing, resolved, dismissed';
