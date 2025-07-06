import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { setupTOTP, verifyAndEnableTOTP } from '@/lib/mfa-manager';

export const runtime = 'nodejs';

// POST /api/security/mfa/setup - Setup TOTP for user
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

    if (body.action === 'generate') {
      // Generate TOTP secret and QR code
      const result = await setupTOTP(authResult.user.id, authResult.user.username);

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        secret: result.secret,
        qr_code: result.qr_code,
        backup_codes: result.backup_codes
      });

    } else if (body.action === 'verify') {
      // Verify TOTP token and enable MFA
      if (!body.token) {
        return NextResponse.json({
          success: false,
          error: 'Verification token is required',
        }, { status: 400 });
      }

      const sourceIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

      const result = await verifyAndEnableTOTP(
        authResult.user.id,
        body.token,
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
        message: 'MFA enabled successfully'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "generate" or "verify"',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in MFA setup API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
