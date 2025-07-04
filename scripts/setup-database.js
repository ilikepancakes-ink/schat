const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Setting up database tables...');

  // Create chatrooms table
  const chatroomsSQL = `
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
  `;

  // Create chatroom_members table
  const membersSQL = `
    CREATE TABLE IF NOT EXISTS chatroom_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(chatroom_id, user_id)
    );
  `;

  // Create chatroom_messages table
  const messagesSQL = `
    CREATE TABLE IF NOT EXISTS chatroom_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
    );
  `;

  // Create chatroom_invites table
  const invitesSQL = `
    CREATE TABLE IF NOT EXISTS chatroom_invites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE,
      invited_user UUID REFERENCES users(id) ON DELETE CASCADE,
      invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'reported')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(chatroom_id, invited_user)
    );
  `;

  try {
    // First, let's check if the tables exist
    console.log('Checking existing tables...');

    // Try to query chatrooms table to see if it exists
    const { data: chatroomsTest, error: chatroomsTestError } = await supabase
      .from('chatrooms')
      .select('count')
      .limit(1);

    if (chatroomsTestError && chatroomsTestError.message.includes('does not exist')) {
      console.log('❌ Chatrooms table does not exist');
      console.log('⚠️  Database tables need to be created manually in Supabase dashboard');
      console.log('');
      console.log('Please go to your Supabase dashboard > SQL Editor and run the following SQL:');
      console.log('');
      console.log(chatroomsSQL);
      console.log(membersSQL);
      console.log(messagesSQL);
      console.log(invitesSQL);
      console.log('');
      console.log('After creating the tables, run this script again.');
      return;
    } else {
      console.log('✓ Chatrooms table exists');
    }

    // Create default chatrooms
    console.log('Creating default chatrooms...');
    
    // Check if default chatrooms already exist
    const { data: existingRooms } = await supabase
      .from('chatrooms')
      .select('name')
      .eq('is_default', true);

    if (!existingRooms || existingRooms.length === 0) {
      // Create General Chat room
      const { error: generalError } = await supabase
        .from('chatrooms')
        .insert({
          name: 'General Chat',
          description: 'Main chat room for all users',
          is_default: true,
          is_staff_only: false,
          invite_code: 'general-chat-default'
        });

      if (generalError) {
        console.error('Error creating General Chat room:', generalError);
      } else {
        console.log('✓ General Chat room created');
      }

      // Create Staff Announcements room
      const { error: staffError } = await supabase
        .from('chatrooms')
        .insert({
          name: 'Staff Announcements',
          description: 'Staff-only announcements and updates',
          is_default: true,
          is_staff_only: true,
          invite_code: 'staff-announcements-default'
        });

      if (staffError) {
        console.error('Error creating Staff Announcements room:', staffError);
      } else {
        console.log('✓ Staff Announcements room created');
      }
    } else {
      console.log('✓ Default chatrooms already exist');
    }

    console.log('\n🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
