import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// DELETE /api/privacy/data - Delete user data based on type
export async function DELETE(request: NextRequest) {
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
    const body = await request.json();
    const { type } = body;

    if (!['messages', 'profile', 'all'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid deletion type. Must be: messages, profile, or all',
      }, { status: 400 });
    }

    console.log(`🗑️ User ${userId} requested deletion of: ${type}`);

    try {
      if (type === 'messages' || type === 'all') {
        // Delete user's messages from all tables
        console.log('Deleting messages...');
        
        // Delete from main messages table
        const { error: messagesError } = await supabaseAdmin
          .from('messages')
          .delete()
          .eq('user_id', userId);

        if (messagesError) {
          console.error('Error deleting messages:', messagesError);
        }

        // Delete from private messages (both sent and received)
        const { error: privateMessagesError1 } = await supabaseAdmin
          .from('private_messages')
          .delete()
          .eq('sender_id', userId);

        const { error: privateMessagesError2 } = await supabaseAdmin
          .from('private_messages')
          .delete()
          .eq('recipient_id', userId);

        if (privateMessagesError1 || privateMessagesError2) {
          console.error('Error deleting private messages:', privateMessagesError1, privateMessagesError2);
        }

        // Delete from chatroom messages
        const { error: chatroomMessagesError } = await supabaseAdmin
          .from('chatroom_messages')
          .delete()
          .eq('user_id', userId);

        if (chatroomMessagesError) {
          console.error('Error deleting chatroom messages:', chatroomMessagesError);
        }

        console.log('✅ Messages deleted successfully');
      }

      if (type === 'profile' || type === 'all') {
        console.log('Deleting profile and related data...');

        // Delete user sessions
        const { error: sessionsError } = await supabaseAdmin
          .from('user_sessions')
          .delete()
          .eq('user_id', userId);

        if (sessionsError) {
          console.error('Error deleting sessions:', sessionsError);
        }

        // Delete friend relationships
        const { error: friendsError1 } = await supabaseAdmin
          .from('friends')
          .delete()
          .eq('user_id', userId);

        const { error: friendsError2 } = await supabaseAdmin
          .from('friends')
          .delete()
          .eq('friend_id', userId);

        if (friendsError1 || friendsError2) {
          console.error('Error deleting friend relationships:', friendsError1, friendsError2);
        }

        // Delete chatroom memberships
        const { error: membershipsError } = await supabaseAdmin
          .from('chatroom_members')
          .delete()
          .eq('user_id', userId);

        if (membershipsError) {
          console.error('Error deleting chatroom memberships:', membershipsError);
        }

        // Delete chatroom invites (sent and received)
        const { error: invitesError1 } = await supabaseAdmin
          .from('chatroom_invites')
          .delete()
          .eq('inviter_id', userId);

        const { error: invitesError2 } = await supabaseAdmin
          .from('chatroom_invites')
          .delete()
          .eq('invitee_id', userId);

        if (invitesError1 || invitesError2) {
          console.error('Error deleting chatroom invites:', invitesError1, invitesError2);
        }

        // Delete privacy settings
        const { error: privacyError } = await supabaseAdmin
          .from('user_privacy_settings')
          .delete()
          .eq('user_id', userId);

        if (privacyError) {
          console.error('Error deleting privacy settings:', privacyError);
        }

        // Delete admin actions related to this user
        const { error: adminActionsError } = await supabaseAdmin
          .from('admin_actions')
          .delete()
          .eq('target_user_id', userId);

        if (adminActionsError) {
          console.error('Error deleting admin actions:', adminActionsError);
        }

        // Finally, delete the user profile
        const { error: userError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', userId);

        if (userError) {
          console.error('Error deleting user profile:', userError);
          return NextResponse.json({
            success: false,
            error: 'Failed to delete user profile',
          }, { status: 500 });
        }

        console.log('✅ Profile and related data deleted successfully');
      }

      // Log the deletion for audit purposes
      const auditLog = {
        action: `data_deletion_${type}`,
        user_id: userId,
        details: `User requested deletion of ${type}`,
        timestamp: new Date().toISOString(),
      };

      // Only log if user still exists (for partial deletions)
      if (type === 'messages') {
        await supabaseAdmin
          .from('admin_actions')
          .insert({
            admin_id: userId, // Self-initiated
            action: auditLog.action,
            target_user_id: userId,
            reason: auditLog.details,
          });
      }

      return NextResponse.json({
        success: true,
        message: `${type === 'all' ? 'All data' : type} deleted successfully`,
        deletedType: type,
      });

    } catch (deletionError) {
      console.error('Data deletion error:', deletionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete data',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Privacy data deletion error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
