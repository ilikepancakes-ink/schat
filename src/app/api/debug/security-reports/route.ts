import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    };

    // Test database connection
    let dbConnectionTest = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);
      
      dbConnectionTest = {
        success: !error,
        error: error?.message || null,
        hasData: !!data
      };
    } catch (dbError) {
      dbConnectionTest = {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown DB error',
        hasData: false
      };
    }

    // Test security_reports table
    let tableTest = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('security_reports')
        .select('count')
        .limit(1);
      
      tableTest = {
        success: !error,
        error: error?.message || null,
        tableExists: !error
      };
    } catch (tableError) {
      tableTest = {
        success: false,
        error: tableError instanceof Error ? tableError.message : 'Unknown table error',
        tableExists: false
      };
    }

    // Test insert permissions
    let insertTest = null;
    try {
      // Try to insert a test record (we'll delete it immediately)
      const testData = {
        reporter_name: 'Test Reporter',
        vulnerability_type: 'other',
        severity: 'info',
        description: 'Test description for debugging',
        steps_to_reproduce: 'Test steps for debugging',
        status: 'new'
      };

      const { data, error } = await supabaseAdmin
        .from('security_reports')
        .insert(testData)
        .select()
        .single();

      if (!error && data) {
        // Delete the test record
        await supabaseAdmin
          .from('security_reports')
          .delete()
          .eq('id', data.id);
        
        insertTest = {
          success: true,
          error: null,
          canInsert: true
        };
      } else {
        insertTest = {
          success: false,
          error: error?.message || 'Unknown insert error',
          canInsert: false
        };
      }
    } catch (insertError) {
      insertTest = {
        success: false,
        error: insertError instanceof Error ? insertError.message : 'Unknown insert error',
        canInsert: false
      };
    }

    return NextResponse.json({
      success: true,
      debug: {
        environment: envCheck,
        databaseConnection: dbConnectionTest,
        securityReportsTable: tableTest,
        insertPermissions: insertTest,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }
    }, { status: 500 });
  }
}
