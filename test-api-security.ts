// Test API security integration
import { NextRequest } from 'next/server';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

import {
  validateRegistrationData,
  validateLoginData,
  validateMessageContent,
  validateAdminAction,
  validateMessageDeletion,
  validatePagination,
} from './src/lib/validation';

function runAPISecurityTests() {
  console.log('Running API Security Integration Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name: string, testFn: () => void) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${(error as Error).message}`);
      failed++;
    }
  }
  
  function expect(actual: any) {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toContain: (expected: string) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to contain "${expected}"`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error('Expected value to be defined');
        }
      }
    };
  }
  
  // Test validateRegistrationData
  test('validateRegistrationData should accept valid registration data', () => {
    const data = {
      username: 'testuser',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    };
    const result = validateRegistrationData(data);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBeDefined();
  });
  
  test('validateRegistrationData should reject mismatched passwords', () => {
    const data = {
      username: 'testuser',
      password: 'StrongPass123!',
      confirmPassword: 'DifferentPass123!'
    };
    const result = validateRegistrationData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('do not match');
  });
  
  test('validateRegistrationData should reject malicious usernames', () => {
    const data = {
      username: '<script>alert("xss")</script>',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    };
    const result = validateRegistrationData(data);
    expect(result.valid).toBe(false);
  });
  
  // Test validateLoginData
  test('validateLoginData should accept valid login data', () => {
    const data = { username: 'testuser', password: 'password123' };
    const result = validateLoginData(data);
    expect(result.valid).toBe(true);
  });
  
  test('validateLoginData should reject missing credentials', () => {
    const data = { username: 'testuser' };
    const result = validateLoginData(data);
    expect(result.valid).toBe(false);
  });
  
  // Test validateMessageContent
  test('validateMessageContent should accept valid messages', () => {
    const data = { content: 'Hello, this is a normal message!' };
    const result = validateMessageContent(data);
    expect(result.valid).toBe(true);
  });
  
  test('validateMessageContent should reject empty messages', () => {
    const data = { content: '   ' };
    const result = validateMessageContent(data);
    expect(result.valid).toBe(false);
  });
  
  test('validateMessageContent should reject overly long messages', () => {
    const data = { content: 'a'.repeat(2001) };
    const result = validateMessageContent(data);
    expect(result.valid).toBe(false);
  });
  
  test('validateMessageContent should reject malicious content', () => {
    const data = { content: '<script>alert("xss")</script>' };
    const result = validateMessageContent(data);
    expect(result.valid).toBe(false);
  });
  
  // Test validateAdminAction
  test('validateAdminAction should accept valid admin actions', () => {
    const data = {
      action: 'ban',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Violation of terms'
    };
    const result = validateAdminAction(data);
    expect(result.valid).toBe(true);
  });
  
  test('validateAdminAction should reject invalid actions', () => {
    const data = {
      action: 'invalid_action',
      userId: '123e4567-e89b-12d3-a456-426614174000'
    };
    const result = validateAdminAction(data);
    expect(result.valid).toBe(false);
  });
  
  test('validateAdminAction should reject invalid UUID format', () => {
    const data = {
      action: 'ban',
      userId: 'invalid-uuid'
    };
    const result = validateAdminAction(data);
    expect(result.valid).toBe(false);
  });
  
  // Test validatePagination
  test('validatePagination should accept valid pagination', () => {
    const data = { page: 1, limit: 50 };
    const result = validatePagination(data);
    expect(result.valid).toBe(true);
    expect(result.sanitized?.offset).toBe(0);
  });
  
  test('validatePagination should reject invalid page numbers', () => {
    const data = { page: 0, limit: 50 };
    const result = validatePagination(data);
    expect(result.valid).toBe(false);
  });
  
  test('validatePagination should reject excessive limits', () => {
    const data = { page: 1, limit: 200 };
    const result = validatePagination(data);
    expect(result.valid).toBe(false);
  });
  
  console.log(`\nAPI Security Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All API security tests passed!');
  } else {
    console.log('⚠️  Some API security tests failed. Please review the validation functions.');
  }
}

// Run the tests
runAPISecurityTests();
