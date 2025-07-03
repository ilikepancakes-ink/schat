import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getAllUsers, banUser, unbanUser, grantAdminPrivileges, revokeAdminPrivileges } from '@/lib/database';
import { validateAdminAction } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const sessionResult = await validateSession(token);
    
    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
      }, { status: 401 });
    }

    if (!sessionResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin privileges required',
      }, { status: 403 });
    }

    const result = await getAllUsers();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        users: result.users,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Get users API error:', error);
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

    const sessionResult = await validateSession(token);
    
    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
      }, { status: 401 });
    }

    if (!sessionResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin privileges required',
      }, { status: 403 });
    }

    const body = await request.json();

    // Validate and sanitize admin action
    const validation = validateAdminAction(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const { action, userId, reason } = validation.sanitized!;

    let result;
    
    switch (action) {
      case 'ban':
        result = await banUser(userId, sessionResult.user.id, reason);
        break;
      case 'unban':
        result = await unbanUser(userId, sessionResult.user.id, reason);
        break;
      case 'grant_admin':
        result = await grantAdminPrivileges(userId, sessionResult.user.id, reason);
        break;
      case 'revoke_admin':
        result = await revokeAdminPrivileges(userId, sessionResult.user.id, reason);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `User ${action} successful`,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin user action API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
