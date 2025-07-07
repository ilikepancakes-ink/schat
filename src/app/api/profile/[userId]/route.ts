import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserProfile } from '@/types/database';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('🔍 Profile API called');
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      console.log('❌ No auth token found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const authResult = await validateSession(token);
    if (!authResult.valid || !authResult.user) {
      console.log('❌ Invalid session');
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
      }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = authResult.user.id;
    console.log('🔍 Looking up profile for userId:', userId);
    console.log('🔍 UserId type:', typeof userId);
    console.log('🔍 UserId length:', userId?.length);
    console.log('🔍 Current user ID:', currentUserId);
    console.log('🔍 Current user ID type:', typeof currentUserId);

    // Validate userId format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.log('❌ Invalid UUID format for userId:', userId);
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID format',
      }, { status: 400 });
    }

    // Get user profile
    console.log('📡 Querying database for user profile...');
    console.log('📡 Query: SELECT * FROM users WHERE id =', userId);

    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, display_name, bio, profile_picture_url, is_admin, is_site_owner, created_at')
      .eq('id', userId)
      .single();

    console.log('📡 Database query result:');
    console.log('  - userProfile:', userProfile);
    console.log('  - userError:', userError);
    console.log('  - userError details:', userError?.message, userError?.code, userError?.details);

    if (userError || !userProfile) {
      console.log('❌ User not found in database');
      console.log('❌ Specific error details:', {
        error: userError,
        code: userError?.code,
        message: userError?.message,
        details: userError?.details,
        hint: userError?.hint
      });

      // Let's also try to see what users exist in the database
      const { data: allUsers, error: allUsersError } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .limit(10);

      console.log('📡 Sample users in database:', allUsers?.map(u => ({ id: u.id, username: u.username })));
      console.log('📡 Sample users error:', allUsersError);

      // Check if any user ID starts with the same prefix
      const userIdPrefix = userId.substring(0, 8);
      const { data: similarUsers } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .ilike('id', `${userIdPrefix}%`)
        .limit(5);

      console.log('📡 Users with similar ID prefix:', similarUsers?.map(u => ({ id: u.id, username: u.username })));

      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Check friend status if not own profile
    let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked' = 'none';
    
    if (currentUserId !== userId) {
      const { data: friendData } = await supabaseAdmin
        .from('friends')
        .select('status, user_id, friend_id')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
        .single();

      if (friendData) {
        if (friendData.status === 'accepted') {
          friendStatus = 'accepted';
        } else if (friendData.status === 'blocked') {
          friendStatus = 'blocked';
        } else if (friendData.status === 'pending') {
          // Check who sent the request
          if (friendData.user_id === currentUserId) {
            friendStatus = 'pending_sent';
          } else {
            friendStatus = 'pending_received';
          }
        }
      }
    }

    const profile: UserProfile = {
      id: userProfile.id,
      username: userProfile.username,
      display_name: userProfile.display_name,
      bio: userProfile.bio,
      profile_picture_url: userProfile.profile_picture_url,
      is_admin: userProfile.is_admin,
      is_site_owner: userProfile.is_site_owner,
      is_online: false, // This would be updated by real-time presence
      created_at: userProfile.created_at,
      friend_status: friendStatus,
    };

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;
    const currentUserId = authResult.user.id;

    // Users can only update their own profile
    if (currentUserId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 403 });
    }

    const body = await request.json();
    const { display_name, bio, profile_picture_url } = body;

    // Validate input
    if (display_name && display_name.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Display name too long (max 100 characters)',
      }, { status: 400 });
    }

    if (bio && bio.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Bio too long (max 500 characters)',
      }, { status: 400 });
    }

    // Update profile
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updateData.display_name = display_name;
    if (bio !== undefined) updateData.bio = bio;
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url;

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
