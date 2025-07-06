import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSecurityMetrics } from '@/lib/security-audit';

export const runtime = 'nodejs';

// GET /api/security/metrics - Get security metrics and statistics
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

    // Only admins can view security metrics
    if (!authResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') as '24h' | '7d' | '30d' || '24h';

    const metrics = await getSecurityMetrics(timeframe);

    return NextResponse.json({
      success: true,
      metrics,
      timeframe
    });

  } catch (error) {
    console.error('Error in security metrics API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
