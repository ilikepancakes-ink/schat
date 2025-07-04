import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Get all chatrooms
    const { data: chatrooms, error: chatroomsError } = await supabaseAdmin
      .from('chatrooms')
      .select('*');

    // Get all chatroom members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('chatroom_members')
      .select('*');

    // Get user's memberships
    const { data: userMemberships, error: userMembershipsError } = await supabaseAdmin
      .from('chatroom_members')
      .select('*')
      .eq('user_id', userId);

    // Get all chatroom messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('chatroom_messages')
      .select('*');

    return NextResponse.json({
      success: true,
      data: {
        currentUserId: userId,
        chatrooms: chatrooms || [],
        allMembers: members || [],
        userMemberships: userMemberships || [],
        messages: messages || [],
        errors: {
          chatroomsError: chatroomsError?.message,
          membersError: membersError?.message,
          userMembershipsError: userMembershipsError?.message,
          messagesError: messagesError?.message
        }
      }
    });

  } catch (error) {
    console.error('Debug chatrooms error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
