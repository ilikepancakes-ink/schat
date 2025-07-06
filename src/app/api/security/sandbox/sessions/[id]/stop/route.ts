import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { stopSandboxSession } from '@/lib/sandbox-manager';

export const runtime = 'nodejs';

// POST /api/security/sandbox/sessions/[id]/stop - Stop a sandbox session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sessionId = params.id;
    const sourceIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    const result = await stopSandboxSession(
      sessionId,
      authResult.user.id,
      sourceIp
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sandbox session stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping sandbox session:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
