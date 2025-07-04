import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getAllMessages, sendMessage } from '@/lib/database';
import { validateMessageContent, validatePagination } from '@/lib/validation';
import { messageRateLimiter } from '@/lib/security';

export const runtime = 'nodejs';

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

    if (sessionResult.user.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'User is banned',
      }, { status: 403 });
    }

    // Validate pagination parameters
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '50';

    const paginationValidation = validatePagination({ page, limit });
    if (!paginationValidation.valid) {
      return NextResponse.json({
        success: false,
        error: paginationValidation.error,
      }, { status: 400 });
    }

    const result = await getAllMessages(paginationValidation.sanitized.limit);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messages: result.messages,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Get messages API error:', error);
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

    if (sessionResult.user.is_banned) {
      return NextResponse.json({
        success: false,
        error: 'User is banned',
      }, { status: 403 });
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${sessionResult.user.id}-${clientIP}`;

    if (!messageRateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime = messageRateLimiter.getRemainingTime(rateLimitKey);
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please wait before sending another message.',
        retryAfter: Math.ceil(remainingTime / 1000)
      }, { status: 429 });
    }

    const body = await request.json();

    // Validate and sanitize message content
    const validation = validateMessageContent(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const result = await sendMessage(sessionResult.user.id, validation.sanitized!.content);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
