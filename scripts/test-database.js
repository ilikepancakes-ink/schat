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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('Testing database connection and tables...');

  try {
    // Test users table
    console.log('\n1. Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✓ Users table accessible, found', users?.length || 0, 'users');
    }

    // Test chatrooms table
    console.log('\n2. Testing chatrooms table...');
    const { data: chatrooms, error: chatroomsError } = await supabase
      .from('chatrooms')
      .select('*')
      .limit(5);

    if (chatroomsError) {
      console.error('❌ Chatrooms table error:', chatroomsError.message);
    } else {
      console.log('✓ Chatrooms table accessible, found', chatrooms?.length || 0, 'chatrooms');
      if (chatrooms && chatrooms.length > 0) {
        console.log('   Sample chatroom:', chatrooms[0]);
      }
    }

    // Test chatroom_members table
    console.log('\n3. Testing chatroom_members table...');
    const { data: members, error: membersError } = await supabase
      .from('chatroom_members')
      .select('*')
      .limit(5);

    if (membersError) {
      console.error('❌ Chatroom_members table error:', membersError.message);
    } else {
      console.log('✓ Chatroom_members table accessible, found', members?.length || 0, 'members');
    }

    // Test chatroom_messages table
    console.log('\n4. Testing chatroom_messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('chatroom_messages')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.error('❌ Chatroom_messages table error:', messagesError.message);
    } else {
      console.log('✓ Chatroom_messages table accessible, found', messages?.length || 0, 'messages');
    }

    // Test chatroom_invites table
    console.log('\n5. Testing chatroom_invites table...');
    const { data: invites, error: invitesError } = await supabase
      .from('chatroom_invites')
      .select('*')
      .limit(5);

    if (invitesError) {
      console.error('❌ Chatroom_invites table error:', invitesError.message);
    } else {
      console.log('✓ Chatroom_invites table accessible, found', invites?.length || 0, 'invites');
    }

    console.log('\n🔍 Database test completed!');

  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();
