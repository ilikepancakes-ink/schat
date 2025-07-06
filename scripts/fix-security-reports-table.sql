-- Alternative script to fix security_reports table issues
-- Run this if you're having conflicts with existing policies

-- First, let's make sure the table exists with all required columns
CREATE TABLE IF NOT EXISTS security_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_name VARCHAR(100) DEFAULT 'Anonymous',
  reporter_email VARCHAR(255),
  vulnerability_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT NOT NULL,
  potential_impact TEXT,
  suggested_fix TEXT,
  status VARCHAR(20) DEFAULT 'new',
  reviewed_by UUID,
  admin_notes TEXT,
  ip_address INET,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add constraints if they don't exist
DO $$ 
BEGIN
  -- Add vulnerability_type constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'security_reports_vulnerability_type_check'
  ) THEN
    ALTER TABLE security_reports 
    ADD CONSTRAINT security_reports_vulnerability_type_check 
    CHECK (vulnerability_type IN ('xss', 'sql-injection', 'csrf', 'authentication', 'authorization', 'data-exposure', 'encryption', 'dos', 'other'));
  END IF;

  -- Add severity constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'security_reports_severity_check'
  ) THEN
    ALTER TABLE security_reports 
    ADD CONSTRAINT security_reports_severity_check 
    CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info'));
  END IF;

  -- Add status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'security_reports_status_check'
  ) THEN
    ALTER TABLE security_reports 
    ADD CONSTRAINT security_reports_status_check 
    CHECK (status IN ('new', 'reviewing', 'confirmed', 'fixed', 'dismissed'));
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_security_reports_status ON security_reports(status);
CREATE INDEX IF NOT EXISTS idx_security_reports_severity ON security_reports(severity);
CREATE INDEX IF NOT EXISTS idx_security_reports_submitted_at ON security_reports(submitted_at);
CREATE INDEX IF NOT EXISTS idx_security_reports_vulnerability_type ON security_reports(vulnerability_type);

-- Enable RLS
ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view security reports" ON security_reports;
DROP POLICY IF EXISTS "Admins can update security reports" ON security_reports;
DROP POLICY IF EXISTS "Allow anonymous security report submissions" ON security_reports;
DROP POLICY IF EXISTS "service_role_policy" ON security_reports;

-- Create new policies
CREATE POLICY "Admins can view security reports" ON security_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update security reports" ON security_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Allow anonymous security report submissions" ON security_reports
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, UPDATE ON security_reports TO authenticated;
GRANT INSERT ON security_reports TO anon;
GRANT ALL ON security_reports TO service_role;
