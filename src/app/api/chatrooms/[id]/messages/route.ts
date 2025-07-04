import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptMessage, decryptMessage } from '@/lib/encryption';
import { validateMessageContent } from '@/lib/validation';

export const runtime = 'nodejs';

// GET /api/chatrooms/[id]/messages - Get messages for a specific chatroom
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

    console.log('Fetching messages for chatroom:', chatroomId, 'user:', userId);

    // Check if user is a member of this chatroom
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroomId)
      .eq('user_id', userId)
      .single();

    console.log('Membership check result:', { membership, membershipError });

    if (membershipError || !membership) {
      console.error('User not a member:', { chatroomId, userId, membershipError });
      return NextResponse.json({
        success: false,
        error: 'You are not a member of this chatroom',
        debug: { chatroomId, userId, membershipError: membershipError?.message }
      }, { status: 403 });
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch messages with user information
    console.log('Fetching messages for chatroom:', chatroomId, 'with limit:', limit, 'offset:', offset);

    const { data: messages, error } = await supabaseAdmin
      .from('chatroom_messages')
      .select(`
        id,
        chatroom_id,
        user_id,
        content,
        created_at,
        updated_at,
        is_deleted,
        deleted_by,
        users!chatroom_messages_user_id_fkey(username, profile_picture_url, is_admin)
      `)
      .eq('chatroom_id', chatroomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Messages fetch result:', { messagesCount: messages?.length || 0, error });

    if (error) {
      console.error('Chatroom messages fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch messages',
        debug: { chatroomId, error: error.message }
      }, { status: 500 });
    }

    // Decrypt messages and format response
    const decryptedMessages = messages?.map(message => {
      try {
        const decryptedContent = decryptMessage(message.content);
        return {
          id: message.id,
          chatroom_id: message.chatroom_id,
          user_id: message.user_id,
          content: decryptedContent,
          created_at: message.created_at,
          updated_at: message.updated_at,
          is_deleted: message.is_deleted,
          deleted_by: message.deleted_by,
          username: (message.users as any).username,
          display_name: (message.users as any).username, // Use username as fallback for display_name
          profile_picture_url: (message.users as any).profile_picture_url,
          is_admin: (message.users as any).is_admin,
        };
      } catch (decryptError) {
        console.error('Message decryption error:', decryptError);
        return {
          id: message.id,
          chatroom_id: message.chatroom_id,
          user_id: message.user_id,
          content: '[Message could not be decrypted]',
          created_at: message.created_at,
          updated_at: message.updated_at,
          is_deleted: message.is_deleted,
          deleted_by: message.deleted_by,
          username: (message.users as any).username,
          display_name: (message.users as any).username, // Use username as fallback for display_name
          profile_picture_url: (message.users as any).profile_picture_url,
          is_admin: (message.users as any).is_admin,
        };
      }
    }) || [];

    // Reverse to show oldest first
    decryptedMessages.reverse();

    return NextResponse.json({
      success: true,
      messages: decryptedMessages,
    });

  } catch (error) {
    console.error('Chatroom messages API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/chatrooms/[id]/messages - Send a message to a chatroom
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

    if (authResult.user.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'You are banned from sending messages',
      }, { status: 403 });
    }

    const chatroomId = resolvedParams.id;
    const userId = authResult.user.id;
    const body = await request.json();

    // Validate message content
    const validation = validateMessageContent(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    // Check if user is a member of this chatroom
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('chatroom_members')
      .select('id')
      .eq('chatroom_id', chatroomId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({
        success: false,
        error: 'You are not a member of this chatroom',
      }, { status: 403 });
    }

    // Check if this is a staff-only chatroom and user is not admin
    const { data: chatroom, error: chatroomError } = await supabaseAdmin
      .from('chatrooms')
      .select('is_staff_only')
      .eq('id', chatroomId)
      .single();

    if (chatroomError) {
      return NextResponse.json({
        success: false,
        error: 'Chatroom not found',
      }, { status: 404 });
    }

    if (chatroom.is_staff_only && !authResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Only staff can send messages in this chatroom',
      }, { status: 403 });
    }

    // Encrypt the message content
    const encryptedContent = encryptMessage(validation.sanitized!.content);

    // Insert the message
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('chatroom_messages')
      .insert({
        chatroom_id: chatroomId,
        user_id: userId,
        content: encryptedContent,
      })
      .select(`
        id,
        chatroom_id,
        user_id,
        content,
        created_at,
        updated_at,
        is_deleted,
        deleted_by
      `)
      .single();

    if (insertError) {
      console.error('Message insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to send message',
      }, { status: 500 });
    }

    // Return the message with user info
    const messageWithUser = {
      ...newMessage,
      content: validation.sanitized!.content, // Return decrypted content
      username: authResult.user.username,
      display_name: authResult.user.display_name,
      profile_picture_url: authResult.user.profile_picture_url,
      is_admin: authResult.user.is_admin,
    };

    return NextResponse.json({
      success: true,
      message: messageWithUser,
    }, { status: 201 });

  } catch (error) {
    console.error('Send chatroom message API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
