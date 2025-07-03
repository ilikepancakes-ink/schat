import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { deleteMessage } from '@/lib/database';
import { validateMessageDeletion } from '@/lib/validation';

export async function DELETE(request: NextRequest) {
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

    // Validate and sanitize message deletion data
    const validation = validateMessageDeletion(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const { messageId, reason } = validation.sanitized!;
    const result = await deleteMessage(messageId, sessionResult.user.id, reason);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Message deleted successfully',
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Delete message API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
