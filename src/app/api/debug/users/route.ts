import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET /api/debug/users - Debug endpoint to check user data
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

    // Only allow admins to use this debug endpoint
    if (!authResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    console.log('🔧 DEBUG: Checking user data...');

    // Get all users
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('id, username, is_admin, is_banned, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('🔧 DEBUG: All users query result:', { allUsers, allUsersError });

    // Get users that would be returned by the /api/users endpoint
    const { data: chatUsers, error: chatUsersError } = await supabaseAdmin
      .from('users')
      .select('id, username, is_admin, is_site_owner, is_banned, created_at')
      .order('created_at', { ascending: false });

    console.log('🔧 DEBUG: Chat users query result:', { chatUsers: chatUsers?.length, chatUsersError });

    // Test profile lookup for first user
    let profileTestResult = null;
    if (chatUsers && chatUsers.length > 0) {
      const testUserId = chatUsers[0].id;
      console.log('🔧 DEBUG: Testing profile lookup for user:', testUserId);
      
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, username, display_name, bio, profile_picture_url, is_admin, is_site_owner, created_at')
        .eq('id', testUserId)
        .single();

      profileTestResult = {
        testUserId,
        profileData,
        profileError,
        profileErrorDetails: profileError ? {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details
        } : null
      };

      console.log('🔧 DEBUG: Profile test result:', profileTestResult);
    }

    return NextResponse.json({
      success: true,
      debug: {
        currentUser: {
          id: authResult.user.id,
          username: authResult.user.username,
          is_admin: authResult.user.is_admin
        },
        allUsers: allUsers?.map(u => ({
          id: u.id,
          username: u.username,
          is_admin: u.is_admin,
          is_banned: u.is_banned,
          idType: typeof u.id,
          idLength: u.id?.length
        })),
        allUsersError,
        chatUsersCount: chatUsers?.length || 0,
        chatUsersError,
        profileTest: profileTestResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🔧 DEBUG: Error in debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
