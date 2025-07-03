// Simple test runner for security functions
const { 
  sanitizeInput, 
  validateUsername, 
  validatePassword, 
  containsMaliciousContent,
  loginRateLimiter,
  messageRateLimiter 
} = require('./src/lib/security.ts');

function runTests() {
  console.log('Running Security Function Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }
  
  function expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toContain: (expected) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to contain "${expected}"`);
        }
      },
      not: {
        toContain: (expected) => {
          if (actual.includes(expected)) {
            throw new Error(`Expected "${actual}" not to contain "${expected}"`);
          }
        }
      }
    };
  }
  
  // Test sanitizeInput
  test('sanitizeInput should remove script tags', () => {
    const malicious = '<script>alert("xss")</script>Hello';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello');
  });
  
  test('sanitizeInput should remove dangerous HTML attributes', () => {
    const malicious = '<div onclick="alert(1)">Content</div>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('onclick');
  });
  
  test('sanitizeInput should escape HTML content', () => {
    const safe = 'Hello <b>world</b>!';
    const sanitized = sanitizeInput(safe);
    expect(sanitized).toBe('Hello &lt;b&gt;world&lt;&#x2F;b&gt;!');
  });
  
  // Test validateUsername
  test('validateUsername should accept valid usernames', () => {
    expect(validateUsername('user123').valid).toBe(true);
    expect(validateUsername('test_user').valid).toBe(true);
    expect(validateUsername('User-Name').valid).toBe(true);
  });
  
  test('validateUsername should reject invalid usernames', () => {
    expect(validateUsername('').valid).toBe(false);
    expect(validateUsername('ab').valid).toBe(false); // too short
    expect(validateUsername('a'.repeat(51)).valid).toBe(false); // too long
    expect(validateUsername('user@name').valid).toBe(false); // invalid chars
  });
  
  // Test validatePassword
  test('validatePassword should accept strong passwords', () => {
    expect(validatePassword('StrongPass123!').valid).toBe(true);
    expect(validatePassword('MySecure@Pass1').valid).toBe(true);
  });
  
  test('validatePassword should reject weak passwords', () => {
    expect(validatePassword('weak').valid).toBe(false); // too short
    expect(validatePassword('password').valid).toBe(false); // no uppercase/numbers
    expect(validatePassword('PASSWORD').valid).toBe(false); // no lowercase/numbers
    expect(validatePassword('Password').valid).toBe(false); // no numbers
  });
  
  // Test containsMaliciousContent
  test('containsMaliciousContent should detect malicious patterns', () => {
    expect(containsMaliciousContent('<script>')).toBe(true);
    expect(containsMaliciousContent('javascript:')).toBe(true);
    expect(containsMaliciousContent('SELECT * FROM')).toBe(true);
    expect(containsMaliciousContent('DROP TABLE')).toBe(true);
  });
  
  test('containsMaliciousContent should allow safe content', () => {
    expect(containsMaliciousContent('Hello world!')).toBe(false);
    expect(containsMaliciousContent('This is a normal message')).toBe(false);
  });
  
  // Test rate limiting
  test('loginRateLimiter should allow requests within limit', () => {
    const identifier = 'test-user-' + Date.now();
    for (let i = 0; i < 5; i++) {
      expect(loginRateLimiter.isAllowed(identifier)).toBe(true);
    }
  });
  
  test('loginRateLimiter should block requests after limit exceeded', () => {
    const identifier = 'test-user-blocked-' + Date.now();
    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      loginRateLimiter.isAllowed(identifier);
    }
    // Next attempt should be blocked
    expect(loginRateLimiter.isAllowed(identifier)).toBe(false);
  });
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All security tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the security functions.');
  }
}

// Run the tests
runTests();
