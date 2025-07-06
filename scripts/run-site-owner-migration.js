const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running site owner migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-site-owner-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('✅ Added is_site_owner column to users table');
    console.log('✅ Created message_reports table');
    console.log('✅ Updated RLS policies');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect() {
  try {
    console.log('Running site owner migration (direct SQL)...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-site-owner-column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.from('_').select('*').limit(0); // Test connection
        if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected
          console.error('Database connection failed:', error);
          process.exit(1);
        }
        break;
      }
    }
    
    console.log('✅ Database connection verified');
    console.log('⚠️  Please run the SQL migration manually in your Supabase dashboard:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of scripts/add-site-owner-column.sql');
    console.log('   4. Execute the SQL');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigrationDirect();
