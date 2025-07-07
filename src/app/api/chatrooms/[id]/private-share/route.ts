import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// POST /api/chatrooms/[id]/private-share - Send private invite to a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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
    const { username } = body;

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username is required',
      }, { status: 400 });
    }

    const chatroomId = resolvedParams.id;
    const inviterId = authResult.user.id;

    // Check if user is a member of the chatroom
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('chatroom_members')
      .select('role')
      .eq('chatroom_id', chatroomId)
      .eq('user_id', inviterId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({
        success: false,
        error: 'You are not a member of this chatroom',
      }, { status: 403 });
    }

    // Get chatroom details
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .select('id, name, is_staff_only')
      .eq('id', chatroomId)
      .single();

    if (chatroomError || !chatroom) {
      return NextResponse.json({
        success: false,
        error: 'Chatroom not found',
      }, { status: 404 });
    }

    // Find the user to invite
    const { data: invitedUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, is_admin, is_banned')
      .eq('username', username)
      .single();

    if (userError || !invitedUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    if (invitedUser.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'Cannot invite banned users',
      }, { status: 400 });
    }

    // Check if it's a staff-only chatroom and the invited user is not admin
    if (chatroom.is_staff_only && !invitedUser.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'This is a staff-only chatroom',
      }, { status: 403 });
    }

    // Check if user is already a member
    const { data: existingMembers, error: existingMemberError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroomId)
      .eq('user_id', invitedUser.id);

    if (existingMemberError) {
      console.error('Error checking existing membership:', existingMemberError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check membership status',
      }, { status: 500 });
    }

    if (existingMembers && existingMembers.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'User is already a member of this chatroom',
      }, { status: 400 });
    }

    // Check if there's already a pending invite
    const { data: existingInvite, error: existingInviteError } = await supabaseAdmin
      .from('chatroom_invites')
      .select('id')
      .eq('chatroom_id', chatroomId)
      .eq('invited_user', invitedUser.id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json({
        success: false,
        error: 'User already has a pending invite to this chatroom',
      }, { status: 400 });
    }

    // Create the invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('chatroom_invites')
      .insert({
        chatroom_id: chatroomId,
        invited_by: inviterId,
        invited_user: invitedUser.id,
        invite_message: `You've been privately invited to join "${chatroom.name}" by ${authResult.user.username}`,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Invite creation error:', inviteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to send invite',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Private invite sent to ${username}`,
      invite: {
        id: invite.id,
        chatroomName: chatroom.name,
        invitedUser: username,
      },
    });

  } catch (error) {
    console.error('Private share API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
