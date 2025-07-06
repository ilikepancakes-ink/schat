import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSecurityAuditLogs, getSecurityMetrics } from '@/lib/security-audit';

export const runtime = 'nodejs';

// GET /api/security/audit-logs - Get security audit logs
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

    // Only admins can view audit logs
    if (!authResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const options = {
      user_id: searchParams.get('user_id') || undefined,
      event_type: searchParams.get('event_type') || undefined,
      event_category: searchParams.get('event_category') || undefined,
      severity: searchParams.get('severity') || undefined,
      min_risk_score: searchParams.get('min_risk_score') ? 
        parseInt(searchParams.get('min_risk_score')!) : undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') ? 
        parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? 
        parseInt(searchParams.get('offset')!) : 0
    };

    const result = await getSecurityAuditLogs(options);

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        has_more: result.total > (options.offset + options.limit)
      }
    });

  } catch (error) {
    console.error('Error in audit logs API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
