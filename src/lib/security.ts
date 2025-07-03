import { validateEncryptionKey, encryptMessage, decryptMessage } from './encryption';

/**
 * Security configuration and validation utilities
 */

export interface SecurityConfig {
  encryptionEnabled: boolean;
  keyValid: boolean;
  rateLimitEnabled: boolean;
  sessionTimeout: number;
}

/**
 * Get current security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  return {
    encryptionEnabled: true,
    keyValid: validateEncryptionKey(),
    rateLimitEnabled: true,
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
}

/**
 * Test encryption/decryption functionality
 */
export function testEncryption(): { success: boolean; error?: string } {
  try {
    const testMessage = 'Hello, this is a test message for encryption validation!';
    
    // Test encryption
    const encrypted = encryptMessage(testMessage);
    if (!encrypted || encrypted === testMessage) {
      return { success: false, error: 'Encryption failed - message not encrypted' };
    }
    
    // Test decryption
    const decrypted = decryptMessage(encrypted);
    if (decrypted !== testMessage) {
      return { success: false, error: 'Decryption failed - message mismatch' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: `Encryption test failed: ${error}` };
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  // Remove dangerous script tags and attributes
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/javascript:/gi, '');

  // Escape remaining HTML entities for safety
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
    // Note: Forward slashes (/) don't need to be encoded for security

  return sanitized;
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters long' };
  }
  
  // Allow alphanumeric characters, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } {
  if (!password) {
    return { valid: false, error: 'Password is required', strength: 'weak' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);

  if (hasLowercase) score++;
  if (hasUppercase) score++;
  if (hasNumbers) score++;
  if (hasSpecialChars) score++;

  // Require at least uppercase, lowercase, and numbers for a valid password
  if (!hasLowercase || !hasUppercase || !hasNumbers) {
    return { valid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number', strength: 'weak' };
  }

  if (score >= 5) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }

  return { valid: true, strength };
}

/**
 * Rate limiting utility
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (record.count >= this.maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }
}

// Global rate limiter instances
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const messageRateLimiter = new RateLimiter(30, 60 * 1000); // 30 messages per minute

/**
 * Generate a secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Check if a string contains potentially malicious content
 */
export function containsMaliciousContent(content: string): boolean {
  const maliciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /SELECT\s+.*FROM/gi,
    /DROP\s+TABLE/gi,
    /INSERT\s+INTO/gi,
    /DELETE\s+FROM/gi,
    /UPDATE\s+.*SET/gi,
  ];

  return maliciousPatterns.some(pattern => pattern.test(content));
}

/**
 * Initialize security checks on application start
 */
export function initializeSecurity(): { success: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check encryption
  const encryptionTest = testEncryption();
  if (!encryptionTest.success) {
    warnings.push(`Encryption test failed: ${encryptionTest.error}`);
  }
  
  // Check environment variables
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
    warnings.push('JWT_SECRET is not properly configured');
  }
  
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === 'your_32_character_encryption_key_here') {
    warnings.push('ENCRYPTION_KEY is not properly configured');
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('Security warnings:', warnings);
  }
  
  return {
    success: warnings.length === 0,
    warnings,
  };
}
