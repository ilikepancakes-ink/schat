import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendDiscordWebhook } from '@/lib/discord-webhook';

export const runtime = 'nodejs';

export async function PATCH(
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

    const { status, adminNotes } = await request.json();
    const reportId = params.id;

    // Validate status
    const validStatuses = ['new', 'reviewing', 'confirmed', 'fixed', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status',
      }, { status: 400 });
    }

    // Get the current report for Discord notification
    const { data: currentReport, error: fetchError } = await supabaseAdmin
      .from('security_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !currentReport) {
      return NextResponse.json({
        success: false,
        error: 'Security report not found',
      }, { status: 404 });
    }

    // Update the security report
    const updateData: any = {
      status,
      reviewed_by: sessionResult.user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    if (status === 'fixed' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from('security_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update security report',
      }, { status: 500 });
    }

    // Send Discord notification for status changes
    try {
      const statusEmojis: { [key: string]: string } = {
        reviewing: '👀',
        confirmed: '✅',
        fixed: '🔧',
        dismissed: '❌'
      };

      const statusColors: { [key: string]: number } = {
        reviewing: 0xFFFF00,
        confirmed: 0xFF8C00,
        fixed: 0x00FF00,
        dismissed: 0x808080
      };

      await sendDiscordWebhook({
        title: `${statusEmojis[status]} Security Report Status Updated`,
        description: `**Report ID:** ${reportId}\n**New Status:** ${status.toUpperCase()}\n**Vulnerability:** ${currentReport.vulnerability_type}\n**Severity:** ${currentReport.severity.toUpperCase()}\n**Updated by:** ${sessionResult.user.username}`,
        color: statusColors[status] || 0x0099FF,
        fields: [
          {
            name: 'Reporter',
            value: currentReport.reporter_name || 'Anonymous',
            inline: true
          },
          {
            name: 'Submitted',
            value: new Date(currentReport.submitted_at).toLocaleDateString(),
            inline: true
          }
        ]
      });
    } catch (webhookError) {
      console.error('Discord webhook error:', webhookError);
      // Don't fail the request if webhook fails
    }

    return NextResponse.json({
      success: true,
      message: 'Security report updated successfully',
      report: updatedReport,
    }, { status: 200 });

  } catch (error) {
    console.error('Security report update API error:', error);
    
    // Send error notification to Discord
    try {
      await sendDiscordWebhook({
        title: '❌ Security Report Update Error',
        description: `Error updating security report ${params.id}`,
        color: 0xFF0000,
        fields: [
          {
            name: 'Error',
            value: error instanceof Error ? error.message : 'Unknown error',
            inline: false
          },
          {
            name: 'Path',
            value: `/api/admin/security-reports/${params.id}`,
            inline: true
          },
          {
            name: 'Time',
            value: new Date().toLocaleString(),
            inline: true
          }
        ]
      });
    } catch (webhookError) {
      console.error('Discord webhook error:', webhookError);
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
