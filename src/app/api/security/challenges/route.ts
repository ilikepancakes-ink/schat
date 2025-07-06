import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { 
  getSecurityChallenges, 
  createSecurityChallenge,
  getUserChallengeStats,
  getChallengeLeaderboard
} from '@/lib/security-challenges';

export const runtime = 'nodejs';

// GET /api/security/challenges - Get security challenges
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
    const searchParams = url.searchParams;

    const options = {
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      is_active: searchParams.get('is_active') === 'true',
      user_id: authResult.user.id
    };

    const challenges = await getSecurityChallenges(options);

    return NextResponse.json({
      success: true,
      challenges
    });

  } catch (error) {
    console.error('Error in challenges API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/security/challenges - Create a new security challenge (admin only)
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

    // Only admins can create challenges
    if (!authResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'difficulty', 'points', 'flag'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`,
        }, { status: 400 });
      }
    }

    const challengeData = {
      title: body.title,
      description: body.description,
      category: body.category,
      difficulty: body.difficulty,
      points: parseInt(body.points),
      flag_format: body.flag_format,
      hints: body.hints || [],
      files: body.files || [],
      docker_image: body.docker_image,
      is_active: body.is_active !== false,
      max_attempts: parseInt(body.max_attempts) || 0,
      time_limit: parseInt(body.time_limit) || 0,
      flag: body.flag
    };

    const result = await createSecurityChallenge(challengeData, authResult.user.id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      challenge: result.challenge
    });

  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
