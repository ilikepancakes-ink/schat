import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Encrypts a message using AES encryption
 * @param message - The plain text message to encrypt
 * @returns The encrypted message as a string
 */
export function encryptMessage(message: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypts a message using AES decryption
 * @param encryptedMessage - The encrypted message to decrypt
 * @returns The decrypted plain text message
 */
export function decryptMessage(encryptedMessage: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, ENCRYPTION_KEY);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Generates a secure random key for encryption
 * @param length - The length of the key to generate (default: 32)
 * @returns A random key string
 */
export function generateEncryptionKey(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Validates that the encryption key is properly configured
 * @returns boolean indicating if the key is valid
 */
export function validateEncryptionKey(): boolean {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'default-key-change-in-production') {
    console.warn('Warning: Using default encryption key. Please set ENCRYPTION_KEY in environment variables.');
    return false;
  }
  
  if (ENCRYPTION_KEY.length < 16) {
    console.warn('Warning: Encryption key is too short. Recommended minimum length is 32 characters.');
    return false;
  }
  
  return true;
}

/**
 * Hash a password using bcrypt-like functionality with CryptoJS
 * @param password - The plain text password
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns The hashed password
 */
export function hashPassword(password: string, saltRounds: number = 12): string {
  const salt = CryptoJS.lib.WordArray.random(16).toString();
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: Math.pow(2, saltRounds)
  }).toString();
  
  return `${salt}:${hash}`;
}

/**
 * Verify a password against its hash
 * @param password - The plain text password
 * @param hash - The stored hash
 * @returns boolean indicating if the password matches
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, storedHash] = hash.split(':');
    const computedHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: Math.pow(2, 12) // Using default 12 rounds
    }).toString();
    
    return computedHash === storedHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
