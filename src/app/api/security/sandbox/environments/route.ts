import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getSandboxEnvironments, createSandboxEnvironment } from '@/lib/sandbox-manager';

export const runtime = 'nodejs';

// GET /api/security/sandbox/environments - Get available sandbox environments
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
    const environmentType = url.searchParams.get('type') || undefined;

    const environments = await getSandboxEnvironments(environmentType);

    return NextResponse.json({
      success: true,
      environments
    });

  } catch (error) {
    console.error('Error in sandbox environments API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/security/sandbox/environments - Create a new sandbox environment (admin only)
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

    // Only admins can create sandbox environments
    if (!authResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'environment_type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`,
        }, { status: 400 });
      }
    }

    const environmentData = {
      name: body.name,
      description: body.description,
      environment_type: body.environment_type,
      docker_compose: body.docker_compose,
      target_services: body.target_services || [],
      allowed_tools: body.allowed_tools || [],
      restrictions: body.restrictions || {},
      max_duration: parseInt(body.max_duration) || 3600,
      is_active: body.is_active !== false
    };

    const result = await createSandboxEnvironment(environmentData, authResult.user.id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      environment: result.environment
    });

  } catch (error) {
    console.error('Error creating sandbox environment:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
