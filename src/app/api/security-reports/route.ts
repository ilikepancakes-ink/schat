import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateSecurityReportData } from '@/lib/validation';
import { sendDiscordWebhook } from '@/lib/discord-webhook';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the security report data
    const validation = validateSecurityReportData(body);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    const reportData = validation.sanitized;

    // Insert the security report into the database
    const { data: report, error: insertError } = await supabaseAdmin
      .from('security_reports')
      .insert({
        reporter_name: reportData.reporterName || 'Anonymous',
        reporter_email: reportData.reporterEmail || null,
        vulnerability_type: reportData.vulnerabilityType,
        severity: reportData.severity,
        description: reportData.description,
        steps_to_reproduce: reportData.stepsToReproduce,
        potential_impact: reportData.potentialImpact || null,
        suggested_fix: reportData.suggestedFix || null,
        status: 'new',
        submitted_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save security report',
      }, { status: 500 });
    }

    // Send Discord webhook notification for high/critical severity reports
    if (reportData.severity === 'critical' || reportData.severity === 'high') {
      try {
        await sendDiscordWebhook({
          title: '🚨 High Priority Security Report',
          description: `**Severity:** ${reportData.severity.toUpperCase()}\n**Type:** ${reportData.vulnerabilityType}\n**Reporter:** ${reportData.reporterName || 'Anonymous'}\n\n**Description:**\n${reportData.description.substring(0, 500)}${reportData.description.length > 500 ? '...' : ''}`,
          color: reportData.severity === 'critical' ? 0xFF0000 : 0xFF8C00,
          fields: [
            {
              name: 'Report ID',
              value: report.id.toString(),
              inline: true
            },
            {
              name: 'Submitted',
              value: new Date().toLocaleString(),
              inline: true
            }
          ]
        });
      } catch (webhookError) {
        console.error('Discord webhook error:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Security report submitted successfully',
      reportId: report.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Security report API error:', error);
    
    // Send error notification to Discord
    try {
      await sendDiscordWebhook({
        title: '❌ Security Report API Error',
        description: `Error processing security report submission`,
        color: 0xFF0000,
        fields: [
          {
            name: 'Error',
            value: error instanceof Error ? error.message : 'Unknown error',
            inline: false
          },
          {
            name: 'Path',
            value: '/api/security-reports',
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
