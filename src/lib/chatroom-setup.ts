import { supabaseAdmin } from './supabase';

/**
 * Initialize default chatrooms
 * This should be called once during application setup
 */
export async function initializeDefaultChatrooms() {
  try {
    // Check if default chatrooms already exist
    const { data: existingRooms, error: checkError } = await supabaseAdmin
      .from('chatrooms')
      .select('id, name')
      .eq('is_default', true);

    if (checkError) {
      console.error('Error checking existing default chatrooms:', checkError);
      return { success: false, error: 'Failed to check existing chatrooms' };
    }

    const existingRoomNames = existingRooms?.map(room => room.name) || [];

    // Create staff announcements room if it doesn't exist
    if (!existingRoomNames.includes('Staff Announcements')) {
      const { data: staffRoom, error: staffRoomError } = await supabaseAdmin
        .from('chatrooms')
        .insert({
          name: 'Staff Announcements',
          description: 'Official announcements from staff members',
          is_default: true,
          is_staff_only: true,
          invite_code: 'staff-announcements-' + Math.random().toString(36).substring(2, 15),
        })
        .select()
        .single();

      if (staffRoomError) {
        console.error('Error creating staff announcements room:', staffRoomError);
        return { success: false, error: 'Failed to create staff announcements room' };
      }

      console.log('Created staff announcements room:', staffRoom.id);
    }

    // Create community chatroom if it doesn't exist
    if (!existingRoomNames.includes('Community Chatroom')) {
      const { data: communityRoom, error: communityRoomError } = await supabaseAdmin
        .from('chatrooms')
        .insert({
          name: 'Community Chatroom',
          description: 'Main chat room for everyone',
          is_default: true,
          is_staff_only: false,
          invite_code: 'community-chatroom-' + Math.random().toString(36).substring(2, 15),
        })
        .select()
        .single();

      if (communityRoomError) {
        console.error('Error creating community chatroom:', communityRoomError);
        return { success: false, error: 'Failed to create community chatroom' };
      }

      console.log('Created community chatroom:', communityRoom.id);

      // Add all existing users to the community chatroom
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('is_banned', false);

      if (usersError) {
        console.error('Error fetching users for community chatroom:', usersError);
      } else if (users && users.length > 0) {
        const memberInserts = users.map(user => ({
          chatroom_id: communityRoom.id,
          user_id: user.id,
          role: 'member' as const,
        }));

        const { error: membersError } = await supabaseAdmin
          .from('chatroom_members')
          .insert(memberInserts);

        if (membersError) {
          console.error('Error adding users to community chatroom:', membersError);
        } else {
          console.log(`Added ${users.length} users to community chatroom`);
        }
      }
    }

    return { success: true, message: 'Default chatrooms initialized successfully' };

  } catch (error) {
    console.error('Error initializing default chatrooms:', error);
    return { success: false, error: 'Internal error during chatroom initialization' };
  }
}

/**
 * Add a new user to default chatrooms
 * This should be called when a new user registers
 */
export async function addUserToDefaultChatrooms(userId: string) {
  try {
    // Get all default chatrooms that are not staff-only
    const { data: defaultRooms, error: roomsError } = await supabaseAdmin
      .from('chatrooms')
      .select('id')
      .eq('is_default', true)
      .eq('is_staff_only', false);

    if (roomsError) {
      console.error('Error fetching default chatrooms:', roomsError);
      return { success: false, error: 'Failed to fetch default chatrooms' };
    }

    if (!defaultRooms || defaultRooms.length === 0) {
      return { success: true, message: 'No default chatrooms to join' };
    }

    // Add user to each default chatroom
    const memberInserts = defaultRooms.map(room => ({
      chatroom_id: room.id,
      user_id: userId,
      role: 'member' as const,
    }));

    const { error: membersError } = await supabaseAdmin
      .from('chatroom_members')
      .insert(memberInserts);

    if (membersError) {
      console.error('Error adding user to default chatrooms:', membersError);
      return { success: false, error: 'Failed to add user to default chatrooms' };
    }

    console.log(`Added user ${userId} to ${defaultRooms.length} default chatrooms`);
    return { success: true, message: 'User added to default chatrooms successfully' };

  } catch (error) {
    console.error('Error adding user to default chatrooms:', error);
    return { success: false, error: 'Internal error during user chatroom setup' };
  }
}

/**
 * Add a user to staff-only chatrooms when they become admin
 */
export async function addUserToStaffChatrooms(userId: string) {
  try {
    // Get all staff-only default chatrooms
    const { data: staffRooms, error: roomsError } = await supabaseAdmin
      .from('chatrooms')
      .select('id')
      .eq('is_default', true)
      .eq('is_staff_only', true);

    if (roomsError) {
      console.error('Error fetching staff chatrooms:', roomsError);
      return { success: false, error: 'Failed to fetch staff chatrooms' };
    }

    if (!staffRooms || staffRooms.length === 0) {
      return { success: true, message: 'No staff chatrooms to join' };
    }

    // Check which staff rooms the user is not already in
    const { data: existingMemberships, error: membershipError } = await supabaseAdmin
      .from('chatroom_members')
      .select('chatroom_id')
      .eq('user_id', userId)
      .in('chatroom_id', staffRooms.map(room => room.id));

    if (membershipError) {
      console.error('Error checking existing memberships:', membershipError);
      return { success: false, error: 'Failed to check existing memberships' };
    }

    const existingRoomIds = existingMemberships?.map(m => m.chatroom_id) || [];
    const roomsToJoin = staffRooms.filter(room => !existingRoomIds.includes(room.id));

    if (roomsToJoin.length === 0) {
      return { success: true, message: 'User already in all staff chatrooms' };
    }

    // Add user to staff chatrooms they're not already in
    const memberInserts = roomsToJoin.map(room => ({
      chatroom_id: room.id,
      user_id: userId,
      role: 'member' as const,
    }));

    const { error: membersError } = await supabaseAdmin
      .from('chatroom_members')
      .insert(memberInserts);

    if (membersError) {
      console.error('Error adding user to staff chatrooms:', membersError);
      return { success: false, error: 'Failed to add user to staff chatrooms' };
    }

    console.log(`Added user ${userId} to ${roomsToJoin.length} staff chatrooms`);
    return { success: true, message: 'User added to staff chatrooms successfully' };

  } catch (error) {
    console.error('Error adding user to staff chatrooms:', error);
    return { success: false, error: 'Internal error during staff chatroom setup' };
  }
}
