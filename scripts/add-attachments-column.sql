-- Add attachments column to messages tables
-- This migration adds support for file attachments in messages

-- Add attachments column to main messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add attachments column to chatroom_messages table
ALTER TABLE chatroom_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add attachments column to private_messages table
ALTER TABLE private_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add indexes for better performance when querying attachments
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON messages USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_chatroom_messages_attachments ON chatroom_messages USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_private_messages_attachments ON private_messages USING GIN (attachments);

-- Add comments to document the structure
COMMENT ON COLUMN messages.attachments IS 'JSON array of file attachments with structure: [{"id": "uuid", "name": "filename", "size": 123456, "mimeType": "image/png", "url": "https://file.io/...", "key": "file-key", "expires": "2024-01-01T00:00:00Z", "maxDownloads": 10, "downloads": 0}]';
COMMENT ON COLUMN chatroom_messages.attachments IS 'JSON array of file attachments with structure: [{"id": "uuid", "name": "filename", "size": 123456, "mimeType": "image/png", "url": "https://file.io/...", "key": "file-key", "expires": "2024-01-01T00:00:00Z", "maxDownloads": 10, "downloads": 0}]';
COMMENT ON COLUMN private_messages.attachments IS 'JSON array of file attachments with structure: [{"id": "uuid", "name": "filename", "size": 123456, "mimeType": "image/png", "url": "https://file.io/...", "key": "file-key", "expires": "2024-01-01T00:00:00Z", "maxDownloads": 10, "downloads": 0}]';
