import { supabaseAdmin } from './supabase';

/**
 * Privacy utilities for data minimization and anonymization
 */

export interface PrivacyConfig {
  profileVisibility: 'public' | 'friends' | 'private';
  messageRetention: number;
  allowDirectMessages: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  dataMinimization: boolean;
  anonymousMode: boolean;
  autoDeleteMessages: boolean;
  blockAnalytics: boolean;
}

/**
 * Get user's privacy settings
 */
export async function getUserPrivacySettings(userId: string): Promise<PrivacyConfig | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching privacy settings:', error);
      return null;
    }

    if (!data) {
      // Return default settings
      return {
        profileVisibility: 'public',
        messageRetention: 0,
        allowDirectMessages: true,
        allowFriendRequests: true,
        showOnlineStatus: true,
        dataMinimization: false,
        anonymousMode: false,
        autoDeleteMessages: false,
        blockAnalytics: true,
      };
    }

    return {
      profileVisibility: data.profile_visibility,
      messageRetention: data.message_retention,
      allowDirectMessages: data.allow_direct_messages,
      allowFriendRequests: data.allow_friend_requests,
      showOnlineStatus: data.show_online_status,
      dataMinimization: data.data_minimization,
      anonymousMode: data.anonymous_mode,
      autoDeleteMessages: data.auto_delete_messages,
      blockAnalytics: data.block_analytics,
    };
  } catch (error) {
    console.error('Error in getUserPrivacySettings:', error);
    return null;
  }
}

/**
 * Anonymize user data for display
 */
export function anonymizeUserData(userData: any, viewerPrivacySettings?: PrivacyConfig): any {
  if (!viewerPrivacySettings?.anonymousMode) {
    return userData;
  }

  return {
    ...userData,
    username: 'Anonymous',
    display_name: 'Anonymous User',
    profile_picture_url: null,
    bio: null,
  };
}

/**
 * Filter user profile based on privacy settings
 */
export function filterUserProfile(
  profile: any, 
  viewerId: string, 
  profilePrivacySettings: PrivacyConfig,
  isFriend: boolean = false
): any {
  const { profileVisibility } = profilePrivacySettings;

  // If profile is private and viewer is not the owner
  if (profileVisibility === 'private' && profile.id !== viewerId) {
    return {
      id: profile.id,
      username: profile.username,
      display_name: 'Private User',
      bio: null,
      profile_picture_url: null,
      is_admin: profile.is_admin,
      is_site_owner: profile.is_site_owner,
      created_at: profile.created_at,
      isPrivate: true,
    };
  }

  // If profile is friends-only and viewer is not a friend
  if (profileVisibility === 'friends' && profile.id !== viewerId && !isFriend) {
    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      bio: null,
      profile_picture_url: null,
      is_admin: profile.is_admin,
      created_at: profile.created_at,
      isFriendsOnly: true,
    };
  }

  // Return full profile for public visibility or authorized viewers
  return profile;
}

/**
 * Check if user allows direct messages
 */
export async function canSendDirectMessage(senderId: string, recipientId: string): Promise<boolean> {
  try {
    const recipientSettings = await getUserPrivacySettings(recipientId);
    return recipientSettings?.allowDirectMessages ?? true;
  } catch (error) {
    console.error('Error checking DM permissions:', error);
    return true; // Default to allowing DMs if we can't check
  }
}

/**
 * Check if user allows friend requests
 */
export async function canSendFriendRequest(senderId: string, recipientId: string): Promise<boolean> {
  try {
    const recipientSettings = await getUserPrivacySettings(recipientId);
    return recipientSettings?.allowFriendRequests ?? true;
  } catch (error) {
    console.error('Error checking friend request permissions:', error);
    return true; // Default to allowing friend requests if we can't check
  }
}

/**
 * Clean up old messages based on retention settings
 */
export async function cleanupOldMessages(userId: string): Promise<void> {
  try {
    const privacySettings = await getUserPrivacySettings(userId);
    
    if (!privacySettings?.autoDeleteMessages || privacySettings.messageRetention === 0) {
      return; // No cleanup needed
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - privacySettings.messageRetention);

    console.log(`Cleaning up messages older than ${cutoffDate.toISOString()} for user ${userId}`);

    // Delete old messages from main messages table
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (messagesError) {
      console.error('Error deleting old messages:', messagesError);
    }

    // Delete old private messages (sent)
    const { error: privateMessagesError } = await supabaseAdmin
      .from('private_messages')
      .delete()
      .eq('sender_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (privateMessagesError) {
      console.error('Error deleting old private messages:', privateMessagesError);
    }

    // Delete old chatroom messages
    const { error: chatroomMessagesError } = await supabaseAdmin
      .from('chatroom_messages')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (chatroomMessagesError) {
      console.error('Error deleting old chatroom messages:', chatroomMessagesError);
    }

    console.log(`Message cleanup completed for user ${userId}`);
  } catch (error) {
    console.error('Error in cleanupOldMessages:', error);
  }
}

/**
 * Minimize data collection by removing unnecessary fields
 */
export function minimizeUserData(userData: any, dataMinimization: boolean = false): any {
  if (!dataMinimization) {
    return userData;
  }

  // Remove non-essential fields when data minimization is enabled
  const {
    id,
    username,
    display_name,
    is_admin,
    is_banned,
    created_at,
    // Remove these fields for data minimization
    bio: _bio,
    profile_picture_url: _profile_picture_url,
    updated_at: _updated_at,
    ...minimizedData
  } = userData;

  return {
    id,
    username,
    display_name: display_name || username,
    is_admin,
    is_banned,
    created_at,
  };
}

/**
 * Check if analytics should be blocked for user
 */
export async function shouldBlockAnalytics(userId: string): Promise<boolean> {
  try {
    const privacySettings = await getUserPrivacySettings(userId);
    return privacySettings?.blockAnalytics ?? true;
  } catch (error) {
    console.error('Error checking analytics settings:', error);
    return true; // Default to blocking analytics
  }
}

/**
 * Get anonymized display name for user
 */
export function getAnonymizedDisplayName(userData: any, anonymousMode: boolean = false): string {
  if (anonymousMode) {
    return 'Anonymous';
  }
  return userData.display_name || userData.username || 'User';
}

/**
 * Schedule automatic message cleanup for all users with auto-delete enabled
 */
export async function scheduleMessageCleanup(): Promise<void> {
  try {
    console.log('Starting scheduled message cleanup...');

    // Get all users with auto-delete enabled
    const { data: usersWithAutoDelete, error } = await supabaseAdmin
      .from('user_privacy_settings')
      .select('user_id, message_retention')
      .eq('auto_delete_messages', true)
      .gt('message_retention', 0);

    if (error) {
      console.error('Error fetching users for cleanup:', error);
      return;
    }

    if (!usersWithAutoDelete || usersWithAutoDelete.length === 0) {
      console.log('No users with auto-delete enabled');
      return;
    }

    console.log(`Found ${usersWithAutoDelete.length} users with auto-delete enabled`);

    // Clean up messages for each user
    for (const user of usersWithAutoDelete) {
      await cleanupOldMessages(user.user_id);
    }

    console.log('Scheduled message cleanup completed');
  } catch (error) {
    console.error('Error in scheduleMessageCleanup:', error);
  }
}
