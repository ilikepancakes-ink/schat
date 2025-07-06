import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('Test security report API called');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Simple validation
    if (!body.vulnerabilityType || !body.severity || !body.description || !body.stepsToReproduce) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 });
    }

    // Prepare data for insertion
    const reportData = {
      reporter_name: body.reporterName || 'Anonymous',
      reporter_email: body.reporterEmail || null,
      vulnerability_type: body.vulnerabilityType,
      severity: body.severity,
      description: body.description,
      steps_to_reproduce: body.stepsToReproduce,
      potential_impact: body.potentialImpact || null,
      suggested_fix: body.suggestedFix || null,
      status: 'new',
      submitted_at: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    };

    console.log('Prepared data:', JSON.stringify(reportData, null, 2));

    // Try to insert into database
    const { data: report, error: insertError } = await supabaseAdmin
      .from('security_reports')
      .insert(reportData)
      .select()
      .single();

    console.log('Insert result:', { report, insertError });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: `Database error: ${insertError.message}`,
        details: insertError
      }, { status: 500 });
    }

    if (!report) {
      console.error('No report returned from insert');
      return NextResponse.json({
        success: false,
        error: 'No data returned from database',
      }, { status: 500 });
    }

    console.log('Security report created successfully:', report.id);

    return NextResponse.json({
      success: true,
      message: 'Security report submitted successfully',
      reportId: report.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Test security report API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
