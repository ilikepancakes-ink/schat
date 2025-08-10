import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co ws: wss:; frame-ancestors 'none';"
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Rate limiting headers
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');

  // Note: Authentication checks in middleware are disabled to avoid Edge runtime Node.js API usage.
  // All authentication is enforced inside Node.js API routes (export const runtime = 'nodejs').

  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Allow same-origin requests
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json(
        { success: false, error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Temporarily disable middleware to avoid Edge Runtime issues
    // '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
