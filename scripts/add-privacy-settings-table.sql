-- Add user_privacy_settings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_privacy_settings'
    ) THEN
        -- Create the privacy settings table
        CREATE TABLE user_privacy_settings (
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

        -- Enable RLS
        ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can read their own privacy settings" ON user_privacy_settings
            FOR SELECT USING (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings
            FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

        CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings
            FOR UPDATE USING (auth.uid()::text = user_id::text);

        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);

        RAISE NOTICE 'Added user_privacy_settings table with RLS policies';
    ELSE
        RAISE NOTICE 'user_privacy_settings table already exists';
    END IF;
END $$;
