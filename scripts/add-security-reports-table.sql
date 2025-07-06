-- Add security_reports table for vulnerability reporting
-- This script should be run in your Supabase SQL Editor

-- Create security_reports table
CREATE TABLE IF NOT EXISTS security_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_name VARCHAR(100) DEFAULT 'Anonymous',
  reporter_email VARCHAR(255),
  vulnerability_type VARCHAR(50) NOT NULL CHECK (vulnerability_type IN (
    'xss', 'sql-injection', 'csrf', 'authentication', 'authorization',
    'data-exposure', 'encryption', 'dos', 'other'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  description TEXT NOT NULL,
  steps_to_reproduce TEXT NOT NULL,
  potential_impact TEXT,
  suggested_fix TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'confirmed', 'fixed', 'dismissed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  ip_address INET,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_reports_status ON security_reports(status);
CREATE INDEX IF NOT EXISTS idx_security_reports_severity ON security_reports(severity);
CREATE INDEX IF NOT EXISTS idx_security_reports_submitted_at ON security_reports(submitted_at);
CREATE INDEX IF NOT EXISTS idx_security_reports_vulnerability_type ON security_reports(vulnerability_type);

-- Enable Row Level Security (RLS)
ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only admins can view security reports
CREATE POLICY "Admins can view security reports" ON security_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Only admins can update security reports
CREATE POLICY "Admins can update security reports" ON security_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Allow anonymous inserts for security reports (public submission)
CREATE POLICY "Allow anonymous security report submissions" ON security_reports
  FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON security_reports TO authenticated;
GRANT INSERT ON security_reports TO anon;
GRANT ALL ON security_reports TO service_role;

-- Add comment to table
COMMENT ON TABLE security_reports IS 'Security vulnerability reports submitted by researchers and users';
COMMENT ON COLUMN security_reports.vulnerability_type IS 'Type of vulnerability: xss, sql-injection, csrf, authentication, authorization, data-exposure, encryption, dos, other';
COMMENT ON COLUMN security_reports.severity IS 'Severity level: critical, high, medium, low, info';
COMMENT ON COLUMN security_reports.status IS 'Report status: new, reviewing, confirmed, fixed, dismissed';
COMMENT ON COLUMN security_reports.ip_address IS 'IP address of the reporter for tracking purposes';
