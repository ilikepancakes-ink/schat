import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptMessage, decryptMessage } from '@/lib/encryption';
import { validateMessageContent } from '@/lib/validation';

export const runtime = 'nodejs';

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

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    if (!otherUserId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required',
      }, { status: 400 });
    }

    const currentUserId = authResult.user.id;

    // Get private messages between the two users
    const { data: messages, error } = await supabaseAdmin
      .from('private_messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        content,
        created_at,
        is_read,
        is_deleted
      `)
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Private messages fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch messages',
      }, { status: 500 });
    }

    // Get sender data and decrypt messages
    const decryptedMessages = [];
    if (messages) {
      for (const message of messages) {
        // Get sender user data
        const { data: senderUser } = await supabaseAdmin
          .from('users')
          .select('username, display_name, profile_picture_url')
          .eq('id', message.sender_id)
          .single();

        if (senderUser) {
          decryptedMessages.push({
            id: message.id,
            sender_id: message.sender_id,
            recipient_id: message.recipient_id,
            content: decryptMessage(message.content),
            created_at: message.created_at,
            is_read: message.is_read,
            sender_username: senderUser.username,
            sender_display_name: senderUser.display_name,
            sender_profile_picture: senderUser.profile_picture_url,
          });
        }
      }
    }

    // Mark messages as read if current user is the recipient
    if (decryptedMessages.length > 0) {
      const unreadMessageIds = decryptedMessages
        .filter(msg => msg.recipient_id === currentUserId && !msg.is_read)
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await supabaseAdmin
          .from('private_messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds);
      }
    }

    return NextResponse.json({
      success: true,
      messages: decryptedMessages.reverse(), // Return in chronological order
    });

  } catch (error) {
    console.error('Private messages API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

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
    
    // Validate message content
    const validation = validateMessageContent(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const { content, recipientId } = body;
    const senderId = authResult.user.id;

    if (!recipientId) {
      return NextResponse.json({
        success: false,
        error: 'Recipient ID is required',
      }, { status: 400 });
    }

    if (senderId === recipientId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send message to yourself',
      }, { status: 400 });
    }

    // Check if recipient exists and is not banned
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('users')
      .select('id, is_banned')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json({
        success: false,
        error: 'Recipient not found',
      }, { status: 404 });
    }

    if (recipient.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send message to banned user',
      }, { status: 400 });
    }

    // Check if sender is banned
    if (authResult.user.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'You are banned from sending messages',
      }, { status: 403 });
    }

    // Encrypt message content
    const encryptedContent = encryptMessage(validation.sanitized!.content);

    // Insert private message
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('private_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: encryptedContent,
      })
      .select(`
        id,
        sender_id,
        recipient_id,
        content,
        created_at,
        is_read
      `)
      .single();

    if (insertError) {
      console.error('Private message insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to send message',
      }, { status: 500 });
    }

    // Get sender user data
    const { data: senderUser } = await supabaseAdmin
      .from('users')
      .select('username, display_name, profile_picture_url')
      .eq('id', senderId)
      .single();

    // Return decrypted message
    const responseMessage = {
      id: newMessage.id,
      sender_id: newMessage.sender_id,
      recipient_id: newMessage.recipient_id,
      content: decryptMessage(newMessage.content),
      created_at: newMessage.created_at,
      is_read: newMessage.is_read,
      sender_username: senderUser?.username || '',
      sender_display_name: senderUser?.display_name || '',
      sender_profile_picture: senderUser?.profile_picture_url || '',
    };

    return NextResponse.json({
      success: true,
      message: responseMessage,
    });

  } catch (error) {
    console.error('Send private message error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
