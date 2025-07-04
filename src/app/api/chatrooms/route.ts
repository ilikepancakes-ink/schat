import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
import { Chatroom } from '@/types/database';

// GET /api/chatrooms - Get all chatrooms the user is a member of
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

    // Get all chatrooms the user is a member of, including default rooms
    const { data: chatrooms, error } = await supabaseAdmin
      .from('chatrooms')
      .select(`
        id,
        name,
        description,
        created_by,
        is_default,
        is_staff_only,
        invite_code,
        created_at,
        updated_at,
        chatroom_members!inner(user_id)
      `)
      .or(`chatroom_members.user_id.eq.${userId},is_default.eq.true`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Chatrooms fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch chatrooms',
      }, { status: 500 });
    }

    // Get member counts for each chatroom
    const chatroomIds = chatrooms?.map(room => room.id) || [];
    const { data: memberCounts, error: memberCountError } = await supabaseAdmin
      .from('chatroom_members')
      .select('chatroom_id')
      .in('chatroom_id', chatroomIds);

    if (memberCountError) {
      console.error('Member count fetch error:', memberCountError);
    }

    // Add member counts to chatrooms
    const chatroomsWithCounts = chatrooms?.map(room => ({
      ...room,
      member_count: memberCounts?.filter(m => m.chatroom_id === room.id).length || 0,
    })) || [];

    return NextResponse.json({
      success: true,
      chatrooms: chatroomsWithCounts,
    });

  } catch (error) {
    console.error('Chatrooms API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/chatrooms - Create a new chatroom
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
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Chatroom name is required',
      }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Chatroom name must be 100 characters or less',
      }, { status: 400 });
    }

    const userId = authResult.user.id;

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Create the chatroom
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        created_by: userId,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (chatroomError) {
      console.error('Chatroom creation error:', chatroomError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create chatroom',
      }, { status: 500 });
    }

    // Add the creator as the owner of the chatroom
    const { error: memberError } = await supabaseAdmin
      .from('chatroom_members')
      .insert({
        chatroom_id: chatroom.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      console.error('Chatroom member creation error:', memberError);
      // Try to clean up the chatroom if member creation failed
      await supabaseAdmin
        .from('chatrooms')
        .delete()
        .eq('id', chatroom.id);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create chatroom',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chatroom: {
        ...chatroom,
        member_count: 1,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create chatroom API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
