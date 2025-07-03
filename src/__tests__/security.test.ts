import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sanitizeInput,
  validateUsername,
  validatePassword,
  containsMaliciousContent,
  loginRateLimiter,
  messageRateLimiter,
} from '@/lib/security';
import {
  validateRegistrationData,
  validateLoginData,
  validateMessageContent,
  validateAdminAction,
  validateMessageDeletion,
  validatePagination,
} from '@/lib/validation';

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('should remove dangerous HTML attributes', () => {
      const malicious = '<div onclick="alert(1)">Content</div>';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).not.toContain('onclick');
    });

    it('should escape HTML content', () => {
      const safe = 'Hello <b>world</b>!';
      const sanitized = sanitizeInput(safe);
      expect(sanitized).toBe('Hello &lt;b&gt;world&lt;&#x2F;b&gt;!');
    });
  });

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(validateUsername('user123').valid).toBe(true);
      expect(validateUsername('test_user').valid).toBe(true);
      expect(validateUsername('User-Name').valid).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(validateUsername('').valid).toBe(false);
      expect(validateUsername('ab').valid).toBe(false); // too short
      expect(validateUsername('a'.repeat(51)).valid).toBe(false); // too long
      expect(validateUsername('user@name').valid).toBe(false); // invalid chars
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      expect(validatePassword('StrongPass123!').valid).toBe(true);
      expect(validatePassword('MySecure@Pass1').valid).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak').valid).toBe(false); // too short
      expect(validatePassword('password').valid).toBe(false); // no uppercase/numbers
      expect(validatePassword('PASSWORD').valid).toBe(false); // no lowercase/numbers
      expect(validatePassword('Password').valid).toBe(false); // no numbers
    });
  });

  describe('containsMaliciousContent', () => {
    it('should detect malicious patterns', () => {
      expect(containsMaliciousContent('<script>')).toBe(true);
      expect(containsMaliciousContent('javascript:')).toBe(true);
      expect(containsMaliciousContent('SELECT * FROM')).toBe(true);
      expect(containsMaliciousContent('DROP TABLE')).toBe(true);
    });

    it('should allow safe content', () => {
      expect(containsMaliciousContent('Hello world!')).toBe(false);
      expect(containsMaliciousContent('This is a normal message')).toBe(false);
    });
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limiter state before each test
    loginRateLimiter['attempts'].clear();
    messageRateLimiter['attempts'].clear();
  });

  describe('loginRateLimiter', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user';
      for (let i = 0; i < 5; i++) {
        expect(loginRateLimiter.isAllowed(identifier)).toBe(true);
      }
    });

    it('should block requests after limit exceeded', () => {
      const identifier = 'test-user';
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        loginRateLimiter.isAllowed(identifier);
      }
      // Next attempt should be blocked
      expect(loginRateLimiter.isAllowed(identifier)).toBe(false);
    });
  });

  describe('messageRateLimiter', () => {
    it('should allow messages within limit', () => {
      const identifier = 'test-user';
      for (let i = 0; i < 30; i++) {
        expect(messageRateLimiter.isAllowed(identifier)).toBe(true);
      }
    });

    it('should block messages after limit exceeded', () => {
      const identifier = 'test-user';
      // Use up all attempts
      for (let i = 0; i < 30; i++) {
        messageRateLimiter.isAllowed(identifier);
      }
      // Next attempt should be blocked
      expect(messageRateLimiter.isAllowed(identifier)).toBe(false);
    });
  });
});

describe('Input Validation', () => {
  describe('validateRegistrationData', () => {
    it('should accept valid registration data', () => {
      const data = {
        username: 'testuser',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!'
      };
      const result = validateRegistrationData(data);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('should reject mismatched passwords', () => {
      const data = {
        username: 'testuser',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!'
      };
      const result = validateRegistrationData(data);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('do not match');
    });
  });

  describe('validateLoginData', () => {
    it('should accept valid login data', () => {
      const data = { username: 'testuser', password: 'password123' };
      const result = validateLoginData(data);
      expect(result.valid).toBe(true);
    });

    it('should reject missing credentials', () => {
      const data = { username: 'testuser' };
      const result = validateLoginData(data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMessageContent', () => {
    it('should accept valid messages', () => {
      const data = { content: 'Hello, this is a normal message!' };
      const result = validateMessageContent(data);
      expect(result.valid).toBe(true);
    });

    it('should reject empty messages', () => {
      const data = { content: '   ' };
      const result = validateMessageContent(data);
      expect(result.valid).toBe(false);
    });

    it('should reject overly long messages', () => {
      const data = { content: 'a'.repeat(2001) };
      const result = validateMessageContent(data);
      expect(result.valid).toBe(false);
    });

    it('should reject malicious content', () => {
      const data = { content: '<script>alert("xss")</script>' };
      const result = validateMessageContent(data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAdminAction', () => {
    it('should accept valid admin actions', () => {
      const data = {
        action: 'ban',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Violation of terms'
      };
      const result = validateAdminAction(data);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid actions', () => {
      const data = {
        action: 'invalid_action',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };
      const result = validateAdminAction(data);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const data = {
        action: 'ban',
        userId: 'invalid-uuid'
      };
      const result = validateAdminAction(data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePagination', () => {
    it('should accept valid pagination', () => {
      const data = { page: 1, limit: 50 };
      const result = validatePagination(data);
      expect(result.valid).toBe(true);
      expect(result.sanitized?.offset).toBe(0);
    });

    it('should reject invalid page numbers', () => {
      const data = { page: 0, limit: 50 };
      const result = validatePagination(data);
      expect(result.valid).toBe(false);
    });

    it('should reject excessive limits', () => {
      const data = { page: 1, limit: 200 };
      const result = validatePagination(data);
      expect(result.valid).toBe(false);
    });
  });
});
