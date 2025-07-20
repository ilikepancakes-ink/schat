export interface User {
  id: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
  is_site_owner: boolean;
  is_banned: boolean;
  profile_picture_url?: string;
  bio?: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  content: string; // This will be encrypted
  encrypted_content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_by?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: 'ban_user' | 'unban_user' | 'delete_message' | 'grant_admin' | 'revoke_admin' | 'grant_site_owner' | 'revoke_site_owner';
  target_user_id?: string;
  target_message_id?: string;
  reason?: string;
  created_at: string;
}

export interface ChatUser {
  id: string;
  username: string;
  is_admin: boolean;
  is_site_owner: boolean;
  is_banned: boolean;
  is_online: boolean;
  profile_picture_url?: string;
  display_name?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  is_admin: boolean;
  is_deleted: boolean;
  embeds?: LinkEmbed[];
}

export interface LinkEmbed {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain: string;
  siteName?: string;
  type?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  is_admin: boolean;
  is_site_owner: boolean;
  is_banned: boolean;
  profile_picture_url?: string;
  display_name?: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  is_deleted: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  profile_picture_url?: string;
  is_admin: boolean;
  is_site_owner: boolean;
  is_online: boolean;
  created_at: string;
  friend_status?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
}

export type UserRole = 'user' | 'admin';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  confirmPassword: string;
}

// Security-focused interfaces
export interface SecurityAuditLog {
  id: string;
  user_id?: string;
  event_type: string;
  event_category: 'authentication' | 'authorization' | 'data_access' | 'admin' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source_ip?: string;
  user_agent?: string;
  session_id?: string;
  resource_accessed?: string;
  action_details?: Record<string, any>;
  risk_score: number;
  threat_indicators?: string[];
  geolocation?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  success: boolean;
  error_message?: string;
  created_at: string;
  processed: boolean;
}

export interface SecurityChallenge {
  id: string;
  title: string;
  description: string;
  category: 'web' | 'crypto' | 'forensics' | 'reverse' | 'pwn' | 'misc';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  points: number;
  flag_format?: string;
  flag_hash: string;
  hints?: Array<{
    text: string;
    point_deduction: number;
  }>;
  files?: Array<{
    name: string;
    url: string;
    description?: string;
  }>;
  docker_image?: string;
  is_active: boolean;
  max_attempts: number;
  time_limit: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeAttempt {
  id: string;
  challenge_id: string;
  user_id: string;
  submitted_flag: string;
  is_correct: boolean;
  points_awarded: number;
  time_taken?: number;
  hint_penalties: number;
  submission_details?: Record<string, any>;
  created_at: string;
}

export interface SandboxEnvironment {
  id: string;
  name: string;
  description?: string;
  environment_type: 'web_app' | 'network' | 'mobile' | 'api';
  docker_compose?: string;
  target_services?: Array<{
    name: string;
    port: number;
    protocol: string;
    description?: string;
  }>;
  allowed_tools?: string[];
  restrictions?: {
    network_access?: boolean;
    file_system_access?: boolean;
    internet_access?: boolean;
    custom_rules?: string[];
  };
  max_duration: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface SandboxSession {
  id: string;
  environment_id: string;
  user_id: string;
  container_id?: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  start_time: string;
  end_time?: string;
  duration?: number;
  actions_log?: Array<{
    timestamp: string;
    action: string;
    details?: Record<string, any>;
  }>;
  findings?: Array<{
    vulnerability_type: string;
    severity: string;
    description: string;
    evidence?: string;
  }>;
  score: number;
  notes?: string;
}

export interface UserMFASettings {
  id: string;
  user_id: string;
  totp_secret?: string;
  backup_codes?: string[];
  webauthn_credentials?: Array<{
    id: string;
    public_key: string;
    counter: number;
    created_at: string;
  }>;
  sms_phone?: string;
  email_backup: boolean;
  is_enabled: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityIncident {
  id: string;
  incident_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  title: string;
  description?: string;
  affected_users?: string[];
  source_ips?: string[];
  indicators?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  timeline?: Array<{
    timestamp: string;
    event: string;
    details?: string;
  }>;
  response_actions?: Array<{
    timestamp: string;
    action: string;
    performed_by: string;
    result?: string;
  }>;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface SecurityReport {
  id: string;
  reporter_name: string;
  reporter_email?: string;
  vulnerability_type: 'xss' | 'sql-injection' | 'csrf' | 'authentication' | 'authorization' | 'data-exposure' | 'encryption' | 'dos' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  steps_to_reproduce: string;
  potential_impact?: string;
  suggested_fix?: string;
  status: 'new' | 'reviewing' | 'confirmed' | 'fixed' | 'dismissed';
  reviewed_by?: string;
  admin_notes?: string;
  ip_address?: string;
  submitted_at: string;
  reviewed_at?: string;
  resolved_at?: string;
}

export interface NetworkEvent {
  id: string;
  event_type: 'connection' | 'request' | 'response' | 'anomaly';
  source_ip: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  protocol?: string;
  request_method?: string;
  request_path?: string;
  response_code?: number;
  bytes_transferred?: number;
  user_agent?: string;
  referer?: string;
  threat_score: number;
  blocked: boolean;
  rule_triggered?: string;
  created_at: string;
}

export interface VulnerabilityScan {
  id: string;
  scan_type: 'web_app' | 'network' | 'dependency' | 'code';
  target_url?: string;
  target_description?: string;
  scan_status: 'pending' | 'running' | 'completed' | 'failed';
  started_by?: string;
  vulnerabilities_found?: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    cvss_score?: number;
    description: string;
    location?: string;
    evidence?: string;
    remediation?: string;
    references?: string[];
  }>;
  scan_config?: Record<string, any>;
  raw_results?: Record<string, any>;
  risk_summary?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  recommendations?: string[];
  started_at: string;
  completed_at?: string;
  duration?: number;
}

export interface SecurityEducationProgress {
  id: string;
  user_id: string;
  module_id: string;
  module_name: string;
  category: string;
  progress_percentage: number;
  completed: boolean;
  quiz_scores?: Array<{
    quiz_id: string;
    score: number;
    max_score: number;
    attempts: number;
  }>;
  time_spent: number;
  last_accessed: string;
  completed_at?: string;
}

export interface Chatroom {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_default: boolean;
  is_staff_only: boolean;
  invite_code?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface ChatroomMember {
  id: string;
  chatroom_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  username?: string;
  display_name?: string;
  profile_picture_url?: string;
  is_admin?: boolean;
}

export interface ChatroomMessage {
  id: string;
  chatroom_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_by?: string;
  username?: string;
  display_name?: string;
  profile_picture_url?: string;
  is_admin?: boolean;
}

export interface ChatroomInvite {
  id: string;
  chatroom_id: string;
  invited_by: string;
  invited_user: string;
  status: 'pending' | 'accepted' | 'declined' | 'reported';
  invite_message?: string;
  created_at: string;
  updated_at: string;
  chatroom_name?: string;
  invited_by_username?: string;
}

export interface MessageReport {
  id: string;
  message_id?: string;
  chatroom_message_id?: string;
  private_message_id?: string;
  reported_by: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reporter_username?: string;
  reviewer_username?: string;
  message_content?: string;
  chatroom_name?: string;
}
