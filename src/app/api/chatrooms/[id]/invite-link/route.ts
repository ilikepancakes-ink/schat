import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET /api/chatrooms/[id]/invite-link - Get invite link for a chatroom
export async function GET(
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

    const chatroomId = resolvedParams.id;
    const userId = authResult.user.id;

    // Check if user is a member of the chatroom
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('chatroom_members')
      .select('role')
      .eq('chatroom_id', chatroomId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({
        success: false,
        error: 'You are not a member of this chatroom',
      }, { status: 403 });
    }

    // Get chatroom details including invite code
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .select('id, name, invite_code')
      .eq('id', chatroomId)
      .single();

    if (chatroomError || !chatroom) {
      return NextResponse.json({
        success: false,
        error: 'Chatroom not found',
      }, { status: 404 });
    }

    // Generate the invite URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/join/${chatroom.invite_code}`;

    return NextResponse.json({
      success: true,
      inviteLink: inviteUrl,
      chatroomName: chatroom.name,
      inviteCode: chatroom.invite_code,
    });

  } catch (error) {
    console.error('Get invite link API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
