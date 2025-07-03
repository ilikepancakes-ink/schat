#!/usr/bin/env node

/**
 * Generate secure keys for SchoolChat deployment
 * Run with: node scripts/generate-keys.js
 */

const crypto = require('crypto');

function generateSecureKey(length) {
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64Key(length) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function generateAlphanumericKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

console.log('🔐 SchoolChat Security Key Generator');
console.log('=====================================\n');

console.log('Generated secure keys for your deployment:\n');

// Generate JWT Secret (64 characters)
const jwtSecret = generateAlphanumericKey(64);
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

// Generate Encryption Key (exactly 32 characters for AES-256)
const encryptionKey = generateAlphanumericKey(32);
console.log('ENCRYPTION_KEY:');
console.log(encryptionKey);
console.log('');

console.log('📋 Copy these values to your Render environment variables:');
console.log('');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('');

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('- Keep these keys secret and secure');
console.log('- Never commit these keys to your repository');
console.log('- Use different keys for development and production');
console.log('- Store them securely in your deployment platform');
console.log('- Rotate keys regularly for maximum security');
console.log('');

console.log('🚀 Next steps for Render deployment:');
console.log('1. Add these keys to your Render service environment variables');
console.log('2. Set up your Supabase project and get the database keys');
console.log('3. Deploy your application');
console.log('4. Test the /api/health endpoint');
console.log('');

console.log('📖 For complete deployment instructions, see RENDER_DEPLOYMENT.md');
