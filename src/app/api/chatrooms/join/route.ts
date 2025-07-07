import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// POST /api/chatrooms/join - Join a chatroom via invite code
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

    if (authResult.user.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'Banned users cannot join chatrooms',
      }, { status: 403 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({
        success: false,
        error: 'Invite code is required',
      }, { status: 400 });
    }

    const userId = authResult.user.id;

    // Find the chatroom by invite code
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .select('id, name, description, is_staff_only')
      .eq('invite_code', inviteCode)
      .single();

    if (chatroomError || !chatroom) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invite code',
      }, { status: 404 });
    }

    // Check if user is already a member
    const { data: existingMembers, error: existingMemberError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroom.id)
      .eq('user_id', userId);

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
        error: 'You are already a member of this chatroom',
      }, { status: 400 });
    }

    // Check if it's a staff-only chatroom and user is not admin
    if (chatroom.is_staff_only && !authResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'This chatroom is restricted to staff members only',
      }, { status: 403 });
    }

    // Add user to the chatroom
    const { error: memberError } = await supabaseAdmin
      .from('chatroom_members')
      .insert({
        chatroom_id: chatroom.id,
        user_id: userId,
        role: 'member',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      return NextResponse.json({
        success: false,
        error: 'Failed to join chatroom',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${chatroom.name}`,
      chatroom: {
        id: chatroom.id,
        name: chatroom.name,
        description: chatroom.description,
      },
    });

  } catch (error) {
    console.error('Join chatroom API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// GET /api/chatrooms/join?code=... - Get chatroom info by invite code (for preview)
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

    const url = new URL(request.url);
    const inviteCode = url.searchParams.get('code');

    if (!inviteCode) {
      return NextResponse.json({
        success: false,
        error: 'Invite code is required',
      }, { status: 400 });
    }

    const userId = authResult.user.id;

    // Find the chatroom by invite code
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .select(`
        id,
        name,
        description,
        is_staff_only,
        created_at,
        users!chatrooms_created_by_fkey(username, display_name)
      `)
      .eq('invite_code', inviteCode)
      .single();

    if (chatroomError || !chatroom) {
      return NextResponse.json({
        success: false,
        error: 'Invalid invite code',
      }, { status: 404 });
    }

    // Check if user is already a member
    const { data: existingMembers, error: existingMemberError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroom.id)
      .eq('user_id', userId);

    if (existingMemberError) {
      console.error('Error checking existing membership:', existingMemberError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check membership status',
      }, { status: 500 });
    }

    const isAlreadyMember = existingMembers && existingMembers.length > 0;

    // Get member count
    const { data: memberCount, error: memberCountError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroom.id);

    const totalMembers = memberCount?.length || 0;

    return NextResponse.json({
      success: true,
      chatroom: {
        id: chatroom.id,
        name: chatroom.name,
        description: chatroom.description,
        is_staff_only: chatroom.is_staff_only,
        created_at: chatroom.created_at,
        users: chatroom.users || null,
        member_count: totalMembers,
        is_already_member: isAlreadyMember,
        can_join: !isAlreadyMember && (!chatroom.is_staff_only || authResult.user.is_admin),
      },
    });

  } catch (error) {
    console.error('Get chatroom info API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
