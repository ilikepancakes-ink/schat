import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Get all friend relationships for the user
    const { data: friendsData, error } = await supabaseAdmin
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Friends fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch friends',
      }, { status: 500 });
    }

    // Get friend user data separately
    const friends = [];
    if (friendsData) {
      for (const friendship of friendsData) {
        const isUserInitiator = friendship.user_id === userId;
        const friendUserId = isUserInitiator ? friendship.friend_id : friendship.user_id;

        // Get friend user data
        const { data: friendUser } = await supabaseAdmin
          .from('users')
          .select('id, username, display_name, profile_picture_url, is_admin')
          .eq('id', friendUserId)
          .single();

        if (friendUser) {
          friends.push({
            id: friendship.id,
            friend: {
              id: friendUser.id,
              username: friendUser.username,
              display_name: friendUser.display_name,
              profile_picture_url: friendUser.profile_picture_url,
              is_admin: friendUser.is_admin,
            },
            status: friendship.status,
            created_at: friendship.created_at,
            is_initiator: isUserInitiator,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      friends,
    });

  } catch (error) {
    console.error('Friends API error:', error);
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
    const { action, friendId } = body;

    if (!action || !friendId) {
      return NextResponse.json({
        success: false,
        error: 'Action and friendId are required',
      }, { status: 400 });
    }

    const userId = authResult.user.id;

    if (userId === friendId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot add yourself as a friend',
      }, { status: 400 });
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', friendId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    switch (action) {
      case 'send_request':
        // Check if friendship already exists
        const { data: existingFriendship } = await supabaseAdmin
          .from('friends')
          .select('id, status')
          .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
          .single();

        if (existingFriendship) {
          return NextResponse.json({
            success: false,
            error: 'Friend request already exists',
          }, { status: 400 });
        }

        // Create friend request
        const { error: insertError } = await supabaseAdmin
          .from('friends')
          .insert({
            user_id: userId,
            friend_id: friendId,
            status: 'pending',
          });

        if (insertError) {
          console.error('Friend request error:', insertError);
          return NextResponse.json({
            success: false,
            error: 'Failed to send friend request',
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Friend request sent',
        });

      case 'accept_request':
        // Update existing pending request
        const { error: acceptError } = await supabaseAdmin
          .from('friends')
          .update({ 
            status: 'accepted',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', friendId)
          .eq('friend_id', userId)
          .eq('status', 'pending');

        if (acceptError) {
          console.error('Accept request error:', acceptError);
          return NextResponse.json({
            success: false,
            error: 'Failed to accept friend request',
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Friend request accepted',
        });

      case 'remove_friend':
        // Remove friendship
        const { error: removeError } = await supabaseAdmin
          .from('friends')
          .delete()
          .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

        if (removeError) {
          console.error('Remove friend error:', removeError);
          return NextResponse.json({
            success: false,
            error: 'Failed to remove friend',
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Friend removed',
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Friends action error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
