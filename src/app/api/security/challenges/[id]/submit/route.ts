import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { submitChallengeFlag } from '@/lib/security-challenges';

export const runtime = 'nodejs';

// POST /api/security/challenges/[id]/submit - Submit a flag for a challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const body = await request.json();
    
    if (!body.flag) {
      return NextResponse.json({
        success: false,
        error: 'Flag is required',
      }, { status: 400 });
    }

    const { id: challengeId } = await params;
    const sourceIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await submitChallengeFlag(
      challengeId,
      authResult.user.id,
      body.flag,
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
      correct: result.correct,
      points_awarded: result.points_awarded,
      message: result.message
    });

  } catch (error) {
    console.error('Error submitting challenge flag:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
