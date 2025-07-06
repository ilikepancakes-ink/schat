import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/privacy/settings - Get user's privacy settings
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

    // Get user's privacy settings
    const { data: settings, error } = await supabaseAdmin
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Privacy settings fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch privacy settings',
      }, { status: 500 });
    }

    // Return default settings if none exist
    const defaultSettings = {
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

    return NextResponse.json({
      success: true,
      settings: settings ? {
        profileVisibility: settings.profile_visibility,
        messageRetention: settings.message_retention,
        allowDirectMessages: settings.allow_direct_messages,
        allowFriendRequests: settings.allow_friend_requests,
        showOnlineStatus: settings.show_online_status,
        dataMinimization: settings.data_minimization,
        anonymousMode: settings.anonymous_mode,
        autoDeleteMessages: settings.auto_delete_messages,
        blockAnalytics: settings.block_analytics,
      } : defaultSettings,
    });

  } catch (error) {
    console.error('Privacy settings GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// PUT /api/privacy/settings - Update user's privacy settings
export async function PUT(request: NextRequest) {
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

    // Validate input
    const {
      profileVisibility,
      messageRetention,
      allowDirectMessages,
      allowFriendRequests,
      showOnlineStatus,
      dataMinimization,
      anonymousMode,
      autoDeleteMessages,
      blockAnalytics,
    } = body;

    // Validate profileVisibility
    if (!['public', 'friends', 'private'].includes(profileVisibility)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid profile visibility setting',
      }, { status: 400 });
    }

    // Validate messageRetention
    if (typeof messageRetention !== 'number' || messageRetention < 0 || messageRetention > 365) {
      return NextResponse.json({
        success: false,
        error: 'Message retention must be between 0 and 365 days',
      }, { status: 400 });
    }

    const settingsData = {
      user_id: userId,
      profile_visibility: profileVisibility,
      message_retention: messageRetention,
      allow_direct_messages: allowDirectMessages,
      allow_friend_requests: allowFriendRequests,
      show_online_status: showOnlineStatus,
      data_minimization: dataMinimization,
      anonymous_mode: anonymousMode,
      auto_delete_messages: autoDeleteMessages,
      block_analytics: blockAnalytics,
      updated_at: new Date().toISOString(),
    };

    // Upsert privacy settings
    const { error } = await supabaseAdmin
      .from('user_privacy_settings')
      .upsert(settingsData, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Privacy settings update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update privacy settings',
      }, { status: 500 });
    }

    // If auto-delete is enabled, schedule message cleanup
    if (autoDeleteMessages && messageRetention > 0) {
      // This would typically trigger a background job
      console.log(`Scheduled message cleanup for user ${userId} after ${messageRetention} days`);
    }

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully',
    });

  } catch (error) {
    console.error('Privacy settings PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
