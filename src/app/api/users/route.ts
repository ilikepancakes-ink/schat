import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// GET /api/users - Get all users (for user list in chat)
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

    console.log('🔍 Loading users for user list');

    // Get all users with basic info (not admin-only)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, is_admin, is_site_owner, is_banned, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users',
      }, { status: 500 });
    }

    console.log('🔍 Found users:', users?.length || 0);
    console.log('🔍 Sample user IDs from database:', users?.slice(0, 3).map(u => ({ id: u.id, username: u.username, idType: typeof u.id })));

    // Validate that all users have proper UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validUsers = users.filter(user => {
      const isValid = user.id && uuidRegex.test(user.id) && user.username;
      if (!isValid) {
        console.log('⚠️ Filtering out invalid user:', { id: user.id, username: user.username });
      }
      return isValid;
    });

    console.log('🔍 Valid users after filtering:', validUsers?.length || 0);

    const chatUsers = validUsers.map(user => ({
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      is_banned: user.is_banned,
      is_online: false, // This will be updated by real-time features later
    }));

    console.log('🔍 Sample chat user IDs being returned:', chatUsers?.slice(0, 3).map(u => ({ id: u.id, username: u.username, idType: typeof u.id })));

    return NextResponse.json({
      success: true,
      users: chatUsers,
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
