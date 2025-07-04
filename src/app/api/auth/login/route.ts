import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { LoginCredentials } from '@/types/database';
import { validateLoginData } from '@/lib/validation';
import { loginRateLimiter } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    if (!loginRateLimiter.isAllowed(clientIP)) {
      const remainingTime = loginRateLimiter.getRemainingTime(clientIP);
      return NextResponse.json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil(remainingTime / 1000)
      }, { status: 429 });
    }

    const body = await request.json();

    // Validate and sanitize input
    const validation = validateLoginData(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const result = await loginUser(validation.sanitized as LoginCredentials);
    
    if (result.success && result.user && result.token) {
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: result.user,
      }, { status: 200 });

      // Set HTTP-only cookie for the token
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
