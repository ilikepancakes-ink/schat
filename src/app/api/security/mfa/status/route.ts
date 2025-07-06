import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getMFAStatus, disableMFA, generateNewBackupCodes } from '@/lib/mfa-manager';

export const runtime = 'nodejs';

// GET /api/security/mfa/status - Get user's MFA status
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

    const status = await getMFAStatus(authResult.user.id);

    return NextResponse.json({
      success: true,
      mfa_status: status
    });

  } catch (error) {
    console.error('Error in MFA status API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST /api/security/mfa/status - Disable MFA or generate new backup codes
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

    if (!body.action || !body.verification_token) {
      return NextResponse.json({
        success: false,
        error: 'Action and verification token are required',
      }, { status: 400 });
    }

    const sourceIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    if (body.action === 'disable') {
      const result = await disableMFA(
        authResult.user.id,
        body.verification_token,
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
        message: 'MFA disabled successfully'
      });

    } else if (body.action === 'regenerate_backup_codes') {
      const result = await generateNewBackupCodes(
        authResult.user.id,
        body.verification_token
      );

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        backup_codes: result.backup_codes,
        message: 'New backup codes generated successfully'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "disable" or "regenerate_backup_codes"',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in MFA status API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
