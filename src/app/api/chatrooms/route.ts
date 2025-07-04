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

    console.log('Fetching chatrooms for user:', userId);

    // First, get the user's memberships
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('chatroom_members')
      .select('chatroom_id')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('Membership fetch error:', membershipError);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch memberships: ${membershipError.message}`,
      }, { status: 500 });
    }

    const memberChatroomIds = memberships?.map(m => m.chatroom_id) || [];
    console.log('User is member of chatrooms:', memberChatroomIds);

    // Get all chatrooms the user has access to (member of OR default)
    let query = supabaseAdmin
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
        updated_at
      `);

    // If user has memberships, include those chatrooms OR default chatrooms
    if (memberChatroomIds.length > 0) {
      query = query.or(`id.in.(${memberChatroomIds.join(',')}),is_default.eq.true`);
    } else {
      // If no memberships, just get default chatrooms
      query = query.eq('is_default', true);
    }

    const { data: chatrooms, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Chatrooms fetch error:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch chatrooms: ${error.message}`,
      }, { status: 500 });
    }

    console.log('Found chatrooms:', chatrooms?.length || 0);



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
    const { name, description, is_staff_only } = body;

    const userId = authResult.user.id;

    console.log('Creating chatroom with data:', { name, description, is_staff_only, userId });

    // Test database connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (testError) {
      console.error('Database connection test failed:', testError);
      return NextResponse.json({
        success: false,
        error: `Database connection failed: ${testError.message}`,
      }, { status: 500 });
    }

    console.log('Database connection test passed:', testData);

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

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const chatroomData = {
      name: name.trim(),
      description: description?.trim() || null,
      created_by: userId,
      invite_code: inviteCode,
      is_staff_only: is_staff_only || false,
    };

    console.log('Inserting chatroom with data:', chatroomData);

    // Create the chatroom
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .insert(chatroomData)
      .select()
      .single();

    if (chatroomError) {
      console.error('Chatroom creation error:', chatroomError);
      return NextResponse.json({
        success: false,
        error: `Failed to create chatroom: ${chatroomError.message}`,
      }, { status: 500 });
    }

    console.log('Created chatroom successfully:', chatroom);

    // Add the creator as the owner of the chatroom
    const memberData = {
      chatroom_id: chatroom.id,
      user_id: userId,
      role: 'owner',
    };

    console.log('Adding member with data:', memberData);

    const { error: memberError } = await supabaseAdmin
      .from('chatroom_members')
      .insert(memberData);

    if (memberError) {
      console.error('Chatroom member creation error:', memberError);
      // Try to clean up the chatroom if member creation failed
      await supabaseAdmin
        .from('chatrooms')
        .delete()
        .eq('id', chatroom.id);

      return NextResponse.json({
        success: false,
        error: `Failed to add member to chatroom: ${memberError.message}`,
      }, { status: 500 });
    }

    console.log('Successfully created chatroom and added member');

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
