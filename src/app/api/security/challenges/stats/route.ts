import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getUserChallengeStats, getChallengeLeaderboard } from '@/lib/security-challenges';

export const runtime = 'nodejs';

// GET /api/security/challenges/stats - Get user's challenge statistics
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
    const type = url.searchParams.get('type');

    if (type === 'leaderboard') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const leaderboard = await getChallengeLeaderboard(limit);
      
      return NextResponse.json({
        success: true,
        leaderboard
      });
    } else {
      const stats = await getUserChallengeStats(authResult.user.id);
      
      return NextResponse.json({
        success: true,
        stats
      });
    }

  } catch (error) {
    console.error('Error in challenge stats API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
