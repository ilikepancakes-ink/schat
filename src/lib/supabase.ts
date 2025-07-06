import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key';

// Validate environment variables in production
if (process.env.NODE_ENV === 'production' && (
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseAnonKey === 'placeholder_anon_key' ||
  supabaseServiceKey === 'placeholder_service_role_key'
)) {
  console.warn('Warning: Using placeholder Supabase credentials. Please set proper environment variables.');
}

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database schema SQL for reference
export const DATABASE_SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_site_owner BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  profile_picture_url TEXT,
  bio TEXT,
  display_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (for main chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- This will store encrypted content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Chatrooms table
CREATE TABLE IF NOT EXISTS chatrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  is_staff_only BOOLEAN DEFAULT FALSE,
  invite_code VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatroom members table
CREATE TABLE IF NOT EXISTS chatroom_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chatroom_id, user_id)
);

-- Chatroom messages table
CREATE TABLE IF NOT EXISTS chatroom_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- This will store encrypted content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Chatroom invites table
CREATE TABLE IF NOT EXISTS chatroom_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_user UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'reported')),
  invite_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chatroom_id, invited_user)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions table for audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User privacy settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  message_retention INTEGER DEFAULT 0 CHECK (message_retention >= 0 AND message_retention <= 365),
  allow_direct_messages BOOLEAN DEFAULT TRUE,
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  show_online_status BOOLEAN DEFAULT TRUE,
  data_minimization BOOLEAN DEFAULT FALSE,
  anonymous_mode BOOLEAN DEFAULT FALSE,
  auto_delete_messages BOOLEAN DEFAULT FALSE,
  block_analytics BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reports table
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  chatroom_message_id UUID REFERENCES chatroom_messages(id) ON DELETE CASCADE,
  private_message_id UUID REFERENCES private_messages(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT message_reports_one_message_type CHECK (
    (message_id IS NOT NULL AND chatroom_message_id IS NULL AND private_message_id IS NULL) OR
    (message_id IS NULL AND chatroom_message_id IS NOT NULL AND private_message_id IS NULL) OR
    (message_id IS NULL AND chatroom_message_id IS NULL AND private_message_id IS NOT NULL)
  )
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Private messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- This will store encrypted content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Security audit logs table for comprehensive security monitoring
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- login, logout, failed_login, message_sent, admin_action, etc.
  event_category VARCHAR(50) NOT NULL, -- authentication, authorization, data_access, admin, security
  severity VARCHAR(20) NOT NULL DEFAULT 'info', -- critical, high, medium, low, info
  source_ip INET,
  user_agent TEXT,
  session_id TEXT,
  resource_accessed TEXT,
  action_details JSONB,
  risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
  threat_indicators JSONB, -- Array of detected threat indicators
  geolocation JSONB, -- Country, city, etc.
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false -- For incident response processing
);

-- Security challenges table for CTF-style challenges
CREATE TABLE IF NOT EXISTS security_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- web, crypto, forensics, reverse, pwn, misc
  difficulty VARCHAR(20) NOT NULL, -- beginner, intermediate, advanced, expert
  points INTEGER NOT NULL DEFAULT 100,
  flag_format VARCHAR(100), -- Expected flag format (e.g., "flag{...}")
  flag_hash TEXT NOT NULL, -- Hashed correct flag
  hints JSONB, -- Array of hints with point deductions
  files JSONB, -- Array of file URLs/paths for challenge
  docker_image TEXT, -- Docker image for sandbox challenges
  is_active BOOLEAN DEFAULT true,
  max_attempts INTEGER DEFAULT 0, -- 0 = unlimited
  time_limit INTEGER DEFAULT 0, -- 0 = no time limit (in minutes)
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge attempts and solutions
CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES security_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submitted_flag TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  time_taken INTEGER, -- Time in seconds
  hint_penalties INTEGER DEFAULT 0,
  submission_details JSONB, -- Additional submission metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id, created_at) -- Prevent duplicate submissions at same time
);

-- Penetration testing sandbox environments
CREATE TABLE IF NOT EXISTS sandbox_environments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  environment_type VARCHAR(50) NOT NULL, -- web_app, network, mobile, api
  docker_compose TEXT, -- Docker compose configuration
  target_services JSONB, -- Array of services and ports
  allowed_tools JSONB, -- Array of allowed penetration testing tools
  restrictions JSONB, -- Security restrictions and limitations
  max_duration INTEGER DEFAULT 3600, -- Max session time in seconds
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sandbox sessions for tracking user practice sessions
CREATE TABLE IF NOT EXISTS sandbox_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  environment_id UUID REFERENCES sandbox_environments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  container_id TEXT, -- Docker container ID
  status VARCHAR(20) DEFAULT 'starting', -- starting, running, stopped, error
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- Actual duration in seconds
  actions_log JSONB, -- Log of user actions in sandbox
  findings JSONB, -- Vulnerabilities found by user
  score INTEGER DEFAULT 0,
  notes TEXT
);

-- Multi-factor authentication settings
CREATE TABLE IF NOT EXISTS user_mfa_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  totp_secret TEXT, -- TOTP secret key (encrypted)
  backup_codes JSONB, -- Array of backup codes (hashed)
  webauthn_credentials JSONB, -- WebAuthn/FIDO2 credentials
  sms_phone TEXT, -- Phone number for SMS (encrypted)
  email_backup BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security incidents and threat detection
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type VARCHAR(100) NOT NULL, -- brute_force, suspicious_activity, data_breach, etc.
  severity VARCHAR(20) NOT NULL, -- critical, high, medium, low
  status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, false_positive
  title VARCHAR(200) NOT NULL,
  description TEXT,
  affected_users JSONB, -- Array of affected user IDs
  source_ips JSONB, -- Array of source IP addresses
  indicators JSONB, -- Threat indicators and IOCs
  timeline JSONB, -- Timeline of events
  response_actions JSONB, -- Actions taken in response
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Network monitoring and intrusion detection
CREATE TABLE IF NOT EXISTS network_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- connection, request, response, anomaly
  source_ip INET NOT NULL,
  destination_ip INET,
  source_port INTEGER,
  destination_port INTEGER,
  protocol VARCHAR(10), -- TCP, UDP, HTTP, HTTPS
  request_method VARCHAR(10), -- GET, POST, etc.
  request_path TEXT,
  response_code INTEGER,
  bytes_transferred BIGINT,
  user_agent TEXT,
  referer TEXT,
  threat_score INTEGER DEFAULT 0, -- 0-100 threat assessment
  blocked BOOLEAN DEFAULT false,
  rule_triggered TEXT, -- Which security rule was triggered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerability assessment results
CREATE TABLE IF NOT EXISTS vulnerability_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_type VARCHAR(50) NOT NULL, -- web_app, network, dependency, code
  target_url TEXT,
  target_description TEXT,
  scan_status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
  started_by UUID REFERENCES users(id) ON DELETE SET NULL,
  vulnerabilities_found JSONB, -- Array of vulnerabilities with details
  scan_config JSONB, -- Scan configuration and parameters
  raw_results JSONB, -- Raw scanner output
  risk_summary JSONB, -- Summary of risk levels
  recommendations JSONB, -- Remediation recommendations
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER -- Scan duration in seconds
);

-- Security education progress tracking
CREATE TABLE IF NOT EXISTS security_education_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id VARCHAR(100) NOT NULL, -- Module identifier
  module_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- web_security, network_security, cryptography, etc.
  progress_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  quiz_scores JSONB, -- Array of quiz scores
  time_spent INTEGER DEFAULT 0, -- Time in minutes
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, module_id)
);

-- Security reports table for vulnerability reporting
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- Security-focused indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_source_ip ON security_audit_logs(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_risk_score ON security_audit_logs(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_id ON challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_challenge_id ON challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_user_id ON sandbox_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_status ON sandbox_sessions(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_network_events_source_ip ON network_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_network_events_threat_score ON network_events(threat_score DESC);
CREATE INDEX IF NOT EXISTS idx_network_events_created_at ON network_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vulnerability_scans_started_by ON vulnerability_scans(started_by);
CREATE INDEX IF NOT EXISTS idx_vulnerability_scans_scan_status ON vulnerability_scans(scan_status);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender_id ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient_id ON private_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatrooms_created_by ON chatrooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chatrooms_invite_code ON chatrooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_chatroom_members_chatroom_id ON chatroom_members(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_members_user_id ON chatroom_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_messages_chatroom_id ON chatroom_messages(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_messages_user_id ON chatroom_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_messages_created_at ON chatroom_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatroom_invites_chatroom_id ON chatroom_invites(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chatroom_invites_invited_user ON chatroom_invites(invited_user);
CREATE INDEX IF NOT EXISTS idx_chatroom_invites_status ON chatroom_invites(status);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatroom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatroom_invites ENABLE ROW LEVEL SECURITY;

-- Users can read their own data and public user info
CREATE POLICY "Users can read public user data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Messages policies
CREATE POLICY "Users can read all messages" ON messages
  FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Sessions policies
CREATE POLICY "Users can read their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Admin actions are read-only for mods and site owners
CREATE POLICY "Mods and site owners can read admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND (users.is_admin = true OR users.is_site_owner = true)
    )
  );

-- Privacy settings policies
CREATE POLICY "Users can read their own privacy settings" ON user_privacy_settings
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Message reports policies
CREATE POLICY "Users can read their own reports" ON message_reports
  FOR SELECT USING (auth.uid()::text = reported_by::text);

CREATE POLICY "Mods and site owners can read all reports" ON message_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND (users.is_admin = true OR users.is_site_owner = true)
    )
  );

CREATE POLICY "Users can create reports" ON message_reports
  FOR INSERT WITH CHECK (auth.uid()::text = reported_by::text);

CREATE POLICY "Mods and site owners can update reports" ON message_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND (users.is_admin = true OR users.is_site_owner = true)
    )
  );

-- Friends policies
CREATE POLICY "Users can read their own friend relationships" ON friends
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

CREATE POLICY "Users can create friend requests" ON friends
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own friend relationships" ON friends
  FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

-- Private messages policies
CREATE POLICY "Users can read their own private messages" ON private_messages
  FOR SELECT USING (auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text);

CREATE POLICY "Users can send private messages" ON private_messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their own private messages" ON private_messages
  FOR UPDATE USING (auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text);

-- Chatrooms policies
CREATE POLICY "Users can read chatrooms they are members of" ON chatrooms
  FOR SELECT USING (
    id IN (
      SELECT chatroom_id FROM chatroom_members WHERE user_id::text = auth.uid()::text
    ) OR is_default = true
  );

CREATE POLICY "Users can create chatrooms" ON chatrooms
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Chatroom owners can update their chatrooms" ON chatrooms
  FOR UPDATE USING (auth.uid()::text = created_by::text);

-- Chatroom members policies
CREATE POLICY "Users can read chatroom members for rooms they are in" ON chatroom_members
  FOR SELECT USING (
    chatroom_id IN (
      SELECT chatroom_id FROM chatroom_members WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can join chatrooms" ON chatroom_members
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can leave chatrooms" ON chatroom_members
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Chatroom messages policies
CREATE POLICY "Users can read messages from chatrooms they are in" ON chatroom_messages
  FOR SELECT USING (
    chatroom_id IN (
      SELECT chatroom_id FROM chatroom_members WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages to chatrooms they are in" ON chatroom_messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    chatroom_id IN (
      SELECT chatroom_id FROM chatroom_members WHERE user_id::text = auth.uid()::text
    )
  );

-- Chatroom invites policies
CREATE POLICY "Users can read their own invites" ON chatroom_invites
  FOR SELECT USING (auth.uid()::text = invited_user::text OR auth.uid()::text = invited_by::text);

CREATE POLICY "Users can send invites to chatrooms they are in" ON chatroom_invites
  FOR INSERT WITH CHECK (
    auth.uid()::text = invited_by::text AND
    chatroom_id IN (
      SELECT chatroom_id FROM chatroom_members WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own invites" ON chatroom_invites
  FOR UPDATE USING (auth.uid()::text = invited_user::text);

-- Storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for profile pictures
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
`;

export default supabase;
