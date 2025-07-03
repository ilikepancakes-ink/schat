import { NextResponse } from 'next/server';
import { initializeSecurity, testEncryption } from '@/lib/security';
import { createClient } from '@supabase/supabase-js';

/**
 * Health check endpoint for monitoring application status
 */
export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        security: false,
        encryption: false,
        database: false,
        environment: false,
      },
      warnings: [] as string[],
    };

    // Check security configuration
    try {
      const securityResult = initializeSecurity();
      healthCheck.checks.security = securityResult.success;
      if (securityResult.warnings.length > 0) {
        healthCheck.warnings.push(...securityResult.warnings);
      }
    } catch (error) {
      healthCheck.checks.security = false;
      healthCheck.warnings.push(`Security check failed: ${error}`);
    }

    // Check encryption functionality
    try {
      const encryptionResult = testEncryption();
      healthCheck.checks.encryption = encryptionResult.success;
      if (!encryptionResult.success && encryptionResult.error) {
        healthCheck.warnings.push(encryptionResult.error);
      }
    } catch (error) {
      healthCheck.checks.encryption = false;
      healthCheck.warnings.push(`Encryption check failed: ${error}`);
    }

    // Check database connectivity
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      healthCheck.checks.database = !error;
      if (error) {
        healthCheck.warnings.push(`Database check failed: ${error.message}`);
      }
    } catch (error) {
      healthCheck.checks.database = false;
      healthCheck.warnings.push(`Database connectivity failed: ${error}`);
    }

    // Check environment variables
    const requiredEnvVars = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar] || process.env[envVar] === 'your-secret-key'
    );

    healthCheck.checks.environment = missingEnvVars.length === 0;
    if (missingEnvVars.length > 0) {
      healthCheck.warnings.push(
        `Missing or default environment variables: ${missingEnvVars.join(', ')}`
      );
    }

    // Determine overall health status
    const allChecksPass = Object.values(healthCheck.checks).every(Boolean);
    healthCheck.status = allChecksPass ? 'healthy' : 'degraded';

    // Return appropriate HTTP status
    const httpStatus = allChecksPass ? 200 : 503;

    return NextResponse.json(healthCheck, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: `Health check failed: ${error}`,
      },
      { status: 500 }
    );
  }
}
