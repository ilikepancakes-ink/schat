import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { RegisterCredentials } from '@/types/database';
import { validateRegistrationData } from '@/lib/validation';
import { loginRateLimiter } from '@/lib/security';
import { addUserToDefaultChatrooms } from '@/lib/chatroom-setup';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (same as login to prevent spam registrations)
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    if (!loginRateLimiter.isAllowed(clientIP)) {
      const remainingTime = loginRateLimiter.getRemainingTime(clientIP);
      return NextResponse.json({
        success: false,
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: Math.ceil(remainingTime / 1000)
      }, { status: 429 });
    }

    const body = await request.json();
    console.log('Registration request body:', body);

    // Validate and sanitize input
    const validation = validateRegistrationData(body);
    console.log('Validation result:', validation);
    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const result = await registerUser(validation.sanitized as RegisterCredentials);

    if (result.success && result.user) {
      // Add user to default chatrooms
      try {
        await addUserToDefaultChatrooms(result.user.id);
      } catch (chatroomError) {
        console.error('Failed to add user to default chatrooms:', chatroomError);
        // Don't fail registration if chatroom setup fails
      }

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: result.user,
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
