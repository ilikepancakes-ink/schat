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
