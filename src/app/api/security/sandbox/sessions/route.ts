import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  startSandboxSession, 
  stopSandboxSession,
  getUserSandboxHistory 
} from '@/lib/sandbox-manager';

export const runtime = 'nodejs';

// GET /api/security/sandbox/sessions - Get user's sandbox session history
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

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const sessions = await getUserSandboxHistory(authResult.user.id, limit);

    return NextResponse.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Error in sandbox sessions API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/security/sandbox/sessions - Start a new sandbox session
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    if (!body.environment_id) {
      return NextResponse.json({
        success: false,
        error: 'Environment ID is required',
      }, { status: 400 });
    }

    const sourceIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await startSandboxSession(
      body.environment_id,
      authResult.user.id,
      sourceIp,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      session: result.session,
      connection_info: result.connection_info
    });

  } catch (error) {
    console.error('Error starting sandbox session:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
