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

-- Admin actions are read-only for admins
CREATE POLICY "Admins can read admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.is_admin = true
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
