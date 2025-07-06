import { supabaseAdmin } from './supabase';
import { encryptMessage, decryptMessage } from './encryption';
import { ChatMessage, ChatUser, Message, User, AdminAction } from '@/types/database';

/**
 * Get all users for admin panel
 */
export async function getAllUsers(): Promise<{ success: boolean; users?: ChatUser[]; error?: string }> {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, is_admin, is_site_owner, is_banned, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: 'Failed to fetch users' };
    }

    const chatUsers: ChatUser[] = users.map(user => ({
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      is_site_owner: user.is_site_owner,
      is_banned: user.is_banned,
      is_online: false, // This will be updated by Socket.IO
    }));

    return { success: true, users: chatUsers };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Get all messages with user information
 */
export async function getAllMessages(limit: number = 100): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    // First, let's try a simpler query to debug
    console.log('Fetching messages with limit:', limit);

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, content, created_at, is_deleted, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: `Database error: ${error.message}` };
    }

    console.log('Raw messages from database:', messages?.length || 0);

    if (!messages || messages.length === 0) {
      return { success: true, messages: [] };
    }

    // Get user information separately to avoid join issues
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, is_admin, is_site_owner')
      .in('id', userIds);

    if (userError) {
      console.error('Error fetching users:', userError);
      return { success: false, error: `User fetch error: ${userError.message}` };
    }

    // Create a user lookup map
    const userMap = new Map();
    users?.forEach(user => {
      userMap.set(user.id, user);
    });

    const chatMessages: ChatMessage[] = messages.map(message => {
      const user = userMap.get(message.user_id);
      let decryptedContent = '';

      try {
        if (message.is_deleted) {
          decryptedContent = '[Message deleted]';
        } else {
          decryptedContent = decryptMessage(message.content);
        }
      } catch (error) {
        console.error('Error decrypting message:', error);
        decryptedContent = '[Error decrypting message]';
      }

      return {
        id: message.id,
        user_id: message.user_id,
        username: user?.username || 'Unknown User',
        content: decryptedContent,
        created_at: message.created_at,
        is_admin: user?.is_admin || false,
        is_deleted: message.is_deleted,
      };
    }).reverse(); // Reverse to show oldest first

    console.log('Processed messages:', chatMessages.length);
    return { success: true, messages: chatMessages };
  } catch (error) {
    console.error('Error in getAllMessages:', error);
    return { success: false, error: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Send a new message
 */
export async function sendMessage(userId: string, content: string): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    if (!content.trim()) {
      return { success: false, error: 'Message cannot be empty' };
    }

    // Encrypt the message content
    const encryptedContent = encryptMessage(content.trim());

    // Insert the message
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: userId,
        content: encryptedContent,
      })
      .select('id, content, created_at, is_deleted, user_id')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }

    // Get user information separately to avoid join issues
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('username, is_admin')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user for message:', userError);
      return { success: false, error: 'Failed to fetch user information' };
    }

    const chatMessage: ChatMessage = {
      id: message.id,
      user_id: message.user_id,
      username: user.username,
      content: content.trim(),
      created_at: message.created_at,
      is_admin: user.is_admin,
      is_deleted: false,
    };

    return { success: true, message: chatMessage };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Delete a message (admin only)
 */
export async function deleteMessage(messageId: string, adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Mark message as deleted
    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .update({
        is_deleted: true,
        deleted_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (messageError) {
      console.error('Error deleting message:', messageError);
      return { success: false, error: 'Failed to delete message' };
    }

    // Log admin action
    const { error: actionError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'delete_message',
        target_message_id: messageId,
        reason: reason || 'No reason provided',
      });

    if (actionError) {
      console.error('Error logging admin action:', actionError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}

/**
 * Ban a user (admin only)
 */
export async function banUser(userId: string, adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user ban status
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        is_banned: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error banning user:', userError);
      return { success: false, error: 'Failed to ban user' };
    }

    // Invalidate all user sessions
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionError) {
      console.error('Error invalidating user sessions:', sessionError);
    }

    // Log admin action
    const { error: actionError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'ban_user',
        target_user_id: userId,
        reason: reason || 'No reason provided',
      });

    if (actionError) {
      console.error('Error logging admin action:', actionError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in banUser:', error);
    return { success: false, error: 'Failed to ban user' };
  }
}

/**
 * Unban a user (admin only)
 */
export async function unbanUser(userId: string, adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user ban status
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        is_banned: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error unbanning user:', userError);
      return { success: false, error: 'Failed to unban user' };
    }

    // Log admin action
    const { error: actionError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'unban_user',
        target_user_id: userId,
        reason: reason || 'No reason provided',
      });

    if (actionError) {
      console.error('Error logging admin action:', actionError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in unbanUser:', error);
    return { success: false, error: 'Failed to unban user' };
  }
}

/**
 * Grant admin privileges to a user (admin only)
 */
export async function grantAdminPrivileges(userId: string, adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user admin status
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error granting admin privileges:', userError);
      return { success: false, error: 'Failed to grant admin privileges' };
    }

    // Log admin action
    const { error: actionError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'grant_admin',
        target_user_id: userId,
        reason: reason || 'No reason provided',
      });

    if (actionError) {
      console.error('Error logging admin action:', actionError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in grantAdminPrivileges:', error);
    return { success: false, error: 'Failed to grant admin privileges' };
  }
}

/**
 * Revoke admin privileges from a user (admin only)
 */
export async function revokeAdminPrivileges(userId: string, adminId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Update user admin status
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error revoking admin privileges:', userError);
      return { success: false, error: 'Failed to revoke admin privileges' };
    }

    // Log admin action
    const { error: actionError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'revoke_admin',
        target_user_id: userId,
        reason: reason || 'No reason provided',
      });

    if (actionError) {
      console.error('Error logging admin action:', actionError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in revokeAdminPrivileges:', error);
    return { success: false, error: 'Failed to revoke admin privileges' };
  }
}
