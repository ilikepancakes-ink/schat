import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No token provided',
      }, { status: 401 });
    }

    const result = await validateSession(token);
    
    if (result.valid && result.user) {
      return NextResponse.json({
        success: true,
        user: result.user,
      }, { status: 200 });
    } else {
      const response = NextResponse.json({
        success: false,
        error: result.error || 'Invalid session',
      }, { status: 401 });

      // Clear invalid token
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });

      return response;
    }
  } catch (error) {
    console.error('Session validation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
