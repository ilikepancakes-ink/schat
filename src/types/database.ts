export interface User {
  id: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
  is_banned: boolean;
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
  action_type: 'ban_user' | 'unban_user' | 'delete_message' | 'grant_admin' | 'revoke_admin';
  target_user_id?: string;
  target_message_id?: string;
  reason?: string;
  created_at: string;
}

export interface ChatUser {
  id: string;
  username: string;
  is_admin: boolean;
  is_banned: boolean;
  is_online: boolean;
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
  is_banned: boolean;
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
