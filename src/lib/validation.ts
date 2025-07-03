import { sanitizeInput, validateUsername, validatePassword, containsMaliciousContent } from './security';

/**
 * Validation schemas and utilities for input validation
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

/**
 * Validate and sanitize user registration data
 */
export function validateRegistrationData(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const { username, password, confirmPassword } = data;

  // Validate username
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return { valid: false, error: usernameValidation.error };
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { valid: false, error: passwordValidation.error };
  }

  // Check password confirmation
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  // Check for malicious content
  if (containsMaliciousContent(username)) {
    return { valid: false, error: 'Username contains invalid characters' };
  }

  return {
    valid: true,
    sanitized: {
      username: sanitizeInput(username.trim()),
      password: password, // Don't sanitize password as it may contain special chars
      confirmPassword: confirmPassword, // Include confirmPassword for registerUser function
    },
  };
}

/**
 * Validate and sanitize user login data
 */
export function validateLoginData(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const { username, password } = data;

  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (username.length > 50) {
    return { valid: false, error: 'Username too long' };
  }

  if (password.length > 200) {
    return { valid: false, error: 'Password too long' };
  }

  // Check for malicious content
  if (containsMaliciousContent(username)) {
    return { valid: false, error: 'Username contains invalid characters' };
  }

  return {
    valid: true,
    sanitized: {
      username: sanitizeInput(username.trim()),
      password: password,
    },
  };
}

/**
 * Validate and sanitize message content
 */
export function validateMessageContent(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const { content } = data;

  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmedContent.length > 2000) {
    return { valid: false, error: 'Message too long (max 2000 characters)' };
  }

  // Check for malicious content
  if (containsMaliciousContent(trimmedContent)) {
    return { valid: false, error: 'Message contains invalid content' };
  }

  // Check for spam patterns
  if (isSpamContent(trimmedContent)) {
    return { valid: false, error: 'Message appears to be spam' };
  }

  return {
    valid: true,
    sanitized: {
      content: sanitizeInput(trimmedContent),
    },
  };
}

/**
 * Validate admin action data
 */
export function validateAdminAction(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const { action, userId, reason } = data;

  const validActions = ['ban', 'unban', 'grant_admin', 'revoke_admin'];
  
  if (!action || !validActions.includes(action)) {
    return { valid: false, error: 'Invalid action' };
  }

  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return { valid: false, error: 'Invalid user ID format' };
  }

  if (reason && typeof reason === 'string') {
    if (reason.length > 500) {
      return { valid: false, error: 'Reason too long (max 500 characters)' };
    }

    if (containsMaliciousContent(reason)) {
      return { valid: false, error: 'Reason contains invalid content' };
    }
  }

  return {
    valid: true,
    sanitized: {
      action,
      userId,
      reason: reason ? sanitizeInput(reason.trim()) : undefined,
    },
  };
}

/**
 * Validate message deletion data
 */
export function validateMessageDeletion(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const { messageId, reason } = data;

  if (!messageId || typeof messageId !== 'string') {
    return { valid: false, error: 'Message ID is required' };
  }

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(messageId)) {
    return { valid: false, error: 'Invalid message ID format' };
  }

  if (!reason || typeof reason !== 'string') {
    return { valid: false, error: 'Reason is required for message deletion' };
  }

  if (reason.length > 500) {
    return { valid: false, error: 'Reason too long (max 500 characters)' };
  }

  if (containsMaliciousContent(reason)) {
    return { valid: false, error: 'Reason contains invalid content' };
  }

  return {
    valid: true,
    sanitized: {
      messageId,
      reason: sanitizeInput(reason.trim()),
    },
  };
}

/**
 * Check if content appears to be spam
 */
function isSpamContent(content: string): boolean {
  const spamPatterns = [
    // Excessive repetition
    /(.)\1{10,}/g,
    // Excessive caps
    /[A-Z]{20,}/g,
    // Common spam phrases
    /\b(buy now|click here|free money|make money fast|urgent|act now)\b/gi,
    // Excessive special characters
    /[!@#$%^&*()]{10,}/g,
    // URLs in suspicious patterns
    /(https?:\/\/[^\s]+){3,}/gi,
  ];

  return spamPatterns.some(pattern => pattern.test(content));
}

/**
 * Validate request rate limiting data
 */
export function validateRateLimit(identifier: string, maxRequests: number = 100): ValidationResult {
  if (!identifier || typeof identifier !== 'string') {
    return { valid: false, error: 'Invalid identifier' };
  }

  if (identifier.length > 100) {
    return { valid: false, error: 'Identifier too long' };
  }

  if (containsMaliciousContent(identifier)) {
    return { valid: false, error: 'Invalid identifier format' };
  }

  return { valid: true, sanitized: { identifier: sanitizeInput(identifier) } };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(data: any): ValidationResult {
  const { page = 1, limit = 50 } = data || {};

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return { valid: false, error: 'Invalid page number' };
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { valid: false, error: 'Invalid limit (must be between 1 and 100)' };
  }

  return {
    valid: true,
    sanitized: {
      page: pageNum,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    },
  };
}
