import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const sessionResult = await validateSession(token);
    
    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
      }, { status: 401 });
    }

    // Check if user is admin
    if (!sessionResult.user.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    // Get security reports
    const { data: reports, error } = await supabaseAdmin
      .from('security_reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch security reports',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
    }, { status: 200 });

  } catch (error) {
    console.error('Security reports API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
