import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';
import { hashPassword, verifyPassword } from './encryption';
import { AuthUser, LoginCredentials, RegisterCredentials } from '@/types/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin,
      isBanned: user.is_banned,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      username: decoded.username,
      is_admin: decoded.isAdmin,
      is_banned: decoded.isBanned,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(credentials: RegisterCredentials): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const { username, password, confirmPassword } = credentials;

    // Validation
    if (!username || !password || !confirmPassword) {
      return { success: false, error: 'All fields are required' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    if (username.length < 3 || username.length > 50) {
      return { success: false, error: 'Username must be between 3 and 50 characters' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        is_admin: false,
        is_banned: false,
      })
      .select('id, username, is_admin, is_banned')
      .single();

    if (error) {
      console.error('User creation error:', error);
      return { success: false, error: 'Failed to create user' };
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        is_admin: newUser.is_admin,
        is_banned: newUser.is_banned,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Login a user
 */
export async function loginUser(credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
  try {
    const { username, password } = credentials;

    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, password_hash, is_admin, is_banned')
      .eq('username', username)
      .single();

    if (error || !user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Check if user is banned
    if (user.is_banned) {
      return { success: false, error: 'Your account has been banned' };
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid username or password' };
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin,
      is_banned: user.is_banned,
    };

    // Generate token
    const token = generateToken(authUser);

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    return {
      success: true,
      user: authUser,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Logout a user by invalidating their session
 */
export async function logoutUser(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<{ valid: boolean; user?: AuthUser; error?: string }> {
  try {
    // First verify the JWT
    const user = verifyToken(token);
    if (!user) {
      return { valid: false, error: 'Invalid token' };
    }

    // Check if session exists in database and hasn't expired
    const { data: session, error } = await supabaseAdmin
      .from('user_sessions')
      .select('expires_at')
      .eq('token', token)
      .single();

    if (error || !session) {
      return { valid: false, error: 'Session not found' };
    }

    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('token', token);
      
      return { valid: false, error: 'Session expired' };
    }

    // Get fresh user data to check for bans or role changes
    const { data: freshUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, is_admin, is_banned')
      .eq('id', user.id)
      .single();

    if (userError || !freshUser) {
      return { valid: false, error: 'User not found' };
    }

    if (freshUser.is_banned) {
      // Invalidate session for banned user
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('token', token);
      
      return { valid: false, error: 'User is banned' };
    }

    return {
      valid: true,
      user: {
        id: freshUser.id,
        username: freshUser.username,
        is_admin: freshUser.is_admin,
        is_banned: freshUser.is_banned,
      },
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}
