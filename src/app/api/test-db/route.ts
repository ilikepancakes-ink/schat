import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          url: !!supabaseUrl,
          serviceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }
    
    // Test database connection
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .limit(1);
      
    if (usersError) {
      console.error('Users table error:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: usersError.message
      }, { status: 500 });
    }
    
    // Test chatrooms table
    const { data: chatrooms, error: chatroomsError } = await supabase
      .from('chatrooms')
      .select('id, name')
      .limit(1);
      
    if (chatroomsError) {
      console.error('Chatrooms table error:', chatroomsError);
      return NextResponse.json({
        success: false,
        error: 'Chatrooms table not found',
        details: chatroomsError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        usersCount: users?.length || 0,
        chatroomsCount: chatrooms?.length || 0,
        environment: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
