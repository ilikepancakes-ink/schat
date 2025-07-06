-- =====================================================
-- SCHAT SITE OWNER FEATURE - COMPLETE MIGRATION SCRIPT
-- =====================================================
-- This script adds the site owner feature to Schat
-- Run this in your Supabase SQL Editor
--
-- IMPORTANT: After running this script, you MUST set your first site owner:
-- UPDATE users SET is_site_owner = true WHERE username = 'YOUR_USERNAME_HERE';
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting Schat Site Owner Feature Migration...';

    -- Step 1: Add is_site_owner column to users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_site_owner'
    ) THEN
        ALTER TABLE users ADD COLUMN is_site_owner BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added is_site_owner column to users table';
    ELSE
        RAISE NOTICE '⚠️  is_site_owner column already exists';
    END IF;

    -- Step 2: Create message_reports table for future reporting feature
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'message_reports'
    ) THEN
        CREATE TABLE message_reports (
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
        RAISE NOTICE '✅ Created message_reports table';
    ELSE
        RAISE NOTICE '⚠️  message_reports table already exists';
    END IF;

    -- Step 3: Enable RLS on message_reports
    ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on message_reports table';

    -- Step 4: Create RLS policies for message_reports
    DROP POLICY IF EXISTS "Users can read their own reports" ON message_reports;
    CREATE POLICY "Users can read their own reports" ON message_reports
        FOR SELECT USING (auth.uid()::text = reported_by::text);
    RAISE NOTICE '✅ Created policy: Users can read their own reports';

    DROP POLICY IF EXISTS "Mods and site owners can read all reports" ON message_reports;
    CREATE POLICY "Mods and site owners can read all reports" ON message_reports
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id::text = auth.uid()::text
                AND (users.is_admin = true OR users.is_site_owner = true)
            )
        );
    RAISE NOTICE '✅ Created policy: Mods and site owners can read all reports';

    DROP POLICY IF EXISTS "Users can create reports" ON message_reports;
    CREATE POLICY "Users can create reports" ON message_reports
        FOR INSERT WITH CHECK (auth.uid()::text = reported_by::text);
    RAISE NOTICE '✅ Created policy: Users can create reports';

    DROP POLICY IF EXISTS "Mods and site owners can update reports" ON message_reports;
    CREATE POLICY "Mods and site owners can update reports" ON message_reports
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id::text = auth.uid()::text
                AND (users.is_admin = true OR users.is_site_owner = true)
            )
        );
    RAISE NOTICE '✅ Created policy: Mods and site owners can update reports';

    -- Step 5: Update admin actions policy to include site owners
    DROP POLICY IF EXISTS "Mods and site owners can read admin actions" ON admin_actions;
    CREATE POLICY "Mods and site owners can read admin actions" ON admin_actions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id::text = auth.uid()::text
                AND (users.is_admin = true OR users.is_site_owner = true)
            )
        );
    RAISE NOTICE '✅ Updated admin actions policy to include site owners';

    RAISE NOTICE '';
    RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT NEXT STEP:';
    RAISE NOTICE 'You must now set your first site owner by running:';
    RAISE NOTICE 'UPDATE users SET is_site_owner = true WHERE username = ''YOUR_USERNAME_HERE'';';
    RAISE NOTICE '';
    RAISE NOTICE 'Replace YOUR_USERNAME_HERE with your actual username!';
    RAISE NOTICE '';

END $$;

-- =====================================================
-- VERIFICATION QUERIES (Optional - run after migration)
-- =====================================================

-- Uncomment these to verify the migration worked:

-- Check if is_site_owner column exists
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name = 'is_site_owner';

-- Check if message_reports table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'message_reports';

-- View all users and their roles
-- SELECT username, is_admin, is_site_owner, is_banned FROM users ORDER BY username;

-- =====================================================
-- SET YOUR FIRST SITE OWNER (REQUIRED!)
-- =====================================================
-- UNCOMMENT AND MODIFY THE LINE BELOW WITH YOUR USERNAME:

-- UPDATE users SET is_site_owner = true WHERE username = 'YOUR_USERNAME_HERE';
