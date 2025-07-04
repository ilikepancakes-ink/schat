import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// POST /api/chatrooms/dm - Create a DM chatroom between two users
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const authResult = await validateSession(token);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
      }, { status: 401 });
    }

    const body = await request.json();
    const { otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json({
        success: false,
        error: 'Other user ID is required',
      }, { status: 400 });
    }

    const currentUserId = authResult.user.id;

    if (currentUserId === otherUserId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot create DM with yourself',
      }, { status: 400 });
    }

    // Check if the other user exists and is not banned
    const { data: otherUser, error: otherUserError } = await supabaseAdmin
      .from('users')
      .select('id, username, is_banned')
      .eq('id', otherUserId)
      .single();

    if (otherUserError || !otherUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    if (otherUser.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'Cannot create DM with banned user',
      }, { status: 400 });
    }

    // Check if current user is banned
    if (authResult.user.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'You are banned from creating DMs',
      }, { status: 403 });
    }

    // Check if a DM chatroom already exists between these users
    // We need to check for chatrooms that have exactly these two users as members
    const { data: existingDMs, error: existingDMError } = await supabaseAdmin
      .from('chatrooms')
      .select(`
        id,
        name,
        description,
        chatroom_members!inner(user_id)
      `)
      .like('name', 'DM:%')
      .like('description', `%${authResult.user.username}%`)
      .like('description', `%${otherUser.username}%`);

    if (existingDMs && existingDMs.length > 0) {
      // Check if any of these chatrooms has exactly the two users we want
      for (const dm of existingDMs) {
        const { data: members, error: membersError } = await supabaseAdmin
          .from('chatroom_members')
          .select('user_id')
          .eq('chatroom_id', dm.id);

        if (members && members.length === 2) {
          const memberIds = members.map(m => m.user_id);
          if (memberIds.includes(currentUserId) && memberIds.includes(otherUserId)) {
            return NextResponse.json({
              success: true,
              chatroom: dm,
              message: 'DM chatroom already exists',
            });
          }
        }
      }
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create the DM chatroom
    const chatroomName = `DM: ${authResult.user.username} & ${otherUser.username}`;
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .insert({
        name: chatroomName,
        description: `Private conversation between ${authResult.user.username} and ${otherUser.username}`,
        created_by: currentUserId,
        invite_code: inviteCode,
        is_staff_only: false,
      })
      .select()
      .single();

    if (chatroomError) {
      console.error('DM chatroom creation error:', chatroomError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create DM chatroom',
      }, { status: 500 });
    }

    // Add both users as members
    const members = [
      {
        chatroom_id: chatroom.id,
        user_id: currentUserId,
        role: 'owner',
      },
      {
        chatroom_id: chatroom.id,
        user_id: otherUserId,
        role: 'member',
      },
    ];

    const { error: memberError } = await supabaseAdmin
      .from('chatroom_members')
      .insert(members);

    if (memberError) {
      console.error('DM chatroom member creation error:', memberError);
      // Clean up the chatroom if member creation failed
      await supabaseAdmin
        .from('chatrooms')
        .delete()
        .eq('id', chatroom.id);

      return NextResponse.json({
        success: false,
        error: 'Failed to add members to DM chatroom',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chatroom: {
        ...chatroom,
        member_count: 2,
      },
      message: 'DM chatroom created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create DM chatroom API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
