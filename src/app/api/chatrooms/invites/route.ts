import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET /api/chatrooms/invites - Get pending invites for the current user
export async function GET(request: NextRequest) {
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

    const userId = authResult.user.id;

    // Get pending invites for the user
    const { data: invites, error } = await supabaseAdmin
      .from('chatroom_invites')
      .select(`
        id,
        chatroom_id,
        invited_by,
        invited_user,
        status,
        invite_message,
        created_at,
        updated_at,
        chatrooms!inner(name, description),
        users!chatroom_invites_invited_by_fkey(username, display_name)
      `)
      .eq('invited_user', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Invites fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch invites',
      }, { status: 500 });
    }

    const formattedInvites = invites?.map(invite => ({
      id: invite.id,
      chatroom_id: invite.chatroom_id,
      invited_by: invite.invited_by,
      invited_user: invite.invited_user,
      status: invite.status,
      invite_message: invite.invite_message,
      created_at: invite.created_at,
      updated_at: invite.updated_at,
      chatroom_name: (invite.chatrooms as any).name,
      invited_by_username: (invite.users as any).username,
    })) || [];

    return NextResponse.json({
      success: true,
      invites: formattedInvites,
    });

  } catch (error) {
    console.error('Invites API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/chatrooms/invites - Send an invite to a user
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
    const { chatroomId, username, message } = body;

    if (!chatroomId || !username) {
      return NextResponse.json({
        success: false,
        error: 'Chatroom ID and username are required',
      }, { status: 400 });
    }

    const inviterId = authResult.user.id;

    // Check if inviter is a member of the chatroom
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroomId)
      .eq('user_id', inviterId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({
        success: false,
        error: 'You are not a member of this chatroom',
      }, { status: 403 });
    }

    // Find the user to invite
    const { data: invitedUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, is_banned')
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

    // Check if user is already a member
    const { data: existingMember, error: existingMemberError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroomId)
      .eq('user_id', invitedUser.id)
      .single();

    if (existingMember) {
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
        invite_message: message || null,
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
      invite,
    }, { status: 201 });

  } catch (error) {
    console.error('Send invite API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// PATCH /api/chatrooms/invites - Respond to an invite (accept/decline/report)
export async function PATCH(request: NextRequest) {
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
    const { inviteId, action } = body;

    if (!inviteId || !action || !['accept', 'decline', 'report'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invite ID or action',
      }, { status: 400 });
    }

    const userId = authResult.user.id;

    // Get the invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('chatroom_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('invited_user', userId)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({
        success: false,
        error: 'Invite not found',
      }, { status: 404 });
    }

    // Update invite status
    const newStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'reported';
    
    const { error: updateError } = await supabaseAdmin
      .from('chatroom_invites')
      .update({ status: newStatus })
      .eq('id', inviteId);

    if (updateError) {
      console.error('Invite update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update invite',
      }, { status: 500 });
    }

    // If accepted, add user to chatroom
    if (action === 'accept') {
      const { error: memberError } = await supabaseAdmin
        .from('chatroom_members')
        .insert({
          chatroom_id: invite.chatroom_id,
          user_id: userId,
          role: 'member',
        });

      if (memberError) {
        console.error('Member creation error:', memberError);
        // Revert invite status
        await supabaseAdmin
          .from('chatroom_invites')
          .update({ status: 'pending' })
          .eq('id', inviteId);
        
        return NextResponse.json({
          success: false,
          error: 'Failed to join chatroom',
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invite ${action}ed successfully`,
    });

  } catch (error) {
    console.error('Invite response API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
