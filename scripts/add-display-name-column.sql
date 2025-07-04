-- Add display_name column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
        
        -- Set display_name to username for existing users
        UPDATE users SET display_name = username WHERE display_name IS NULL;
        
        RAISE NOTICE 'Added display_name column to users table';
    ELSE
        RAISE NOTICE 'display_name column already exists';
    END IF;
END $$;
