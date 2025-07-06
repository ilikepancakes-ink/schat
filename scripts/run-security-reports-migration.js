const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    return envVars;
  } catch (error) {
    console.error('Could not load .env.local file:', error.message);
    return {};
  }
}

const envVars = loadEnvFile();
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.log('');
  console.log('Please ensure your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// For this script, we'll just show the SQL instead of trying to connect
console.log('Security Reports Migration Script');
console.log('='.repeat(50));

function runMigration() {
  try {
    console.log('');
    console.log('📋 To enable security reports functionality, you need to create the database table.');
    console.log('');
    console.log('⚠️  Please run the SQL migration manually in your Supabase dashboard:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the SQL content below');
    console.log('   4. Execute the SQL');
    console.log('');
    console.log('The SQL migration will create:');
    console.log('✅ security_reports table with proper structure');
    console.log('✅ Database indexes for performance');
    console.log('✅ Row Level Security (RLS) policies');
    console.log('✅ Proper permissions for admins and anonymous users');
    console.log('');

    // Read and display the SQL file content
    const sqlPath = path.join(__dirname, 'add-security-reports-table.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log('SQL Migration Content:');
      console.log('='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80));
      console.log('');
      console.log('✅ After running this SQL, the security reports feature will be fully functional!');
    } else {
      console.error('❌ SQL file not found at:', sqlPath);
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
