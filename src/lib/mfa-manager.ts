import { supabaseAdmin } from './supabase';
import { UserMFASettings } from '@/types/database';
import { encryptMessage, decryptMessage, generateEncryptionKey } from './encryption';
import { logSecurityEvent } from './security-audit';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

/**
 * Multi-Factor Authentication manager for enhanced security
 * Supports TOTP, WebAuthn/FIDO2, SMS, and backup codes
 */

/**
 * Generate TOTP secret and QR code for user
 */
export async function setupTOTP(
  userId: string,
  username: string
): Promise<{ 
  success: boolean; 
  secret?: string; 
  qr_code?: string; 
  backup_codes?: string[];
  error?: string 
}> {
  try {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `SchoolChat (${username})`,
      issuer: 'SchoolChat Security',
      length: 32
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      generateEncryptionKey(8).toUpperCase()
    );

    // Encrypt sensitive data
    const encryptedSecret = encryptMessage(secret.base32);
    const encryptedBackupCodes = backupCodes.map(code => encryptMessage(code));

    // Store MFA settings
    const { error } = await supabaseAdmin
      .from('user_mfa_settings')
      .upsert({
        user_id: userId,
        totp_secret: encryptedSecret,
        backup_codes: encryptedBackupCodes,
        is_enabled: false, // User needs to verify setup first
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing MFA settings:', error);
      return { success: false, error: 'Failed to setup MFA' };
    }

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    await logSecurityEvent({
      user_id: userId,
      event_type: 'mfa_totp_setup_initiated',
      event_category: 'security',
      severity: 'info',
      resource_accessed: '/mfa/setup',
      action_details: {
        mfa_type: 'totp',
        backup_codes_generated: backupCodes.length
      },
      success: true
    });

    return {
      success: true,
      secret: secret.base32,
      qr_code: qrCodeUrl,
      backup_codes: backupCodes
    };

  } catch (error) {
    console.error('Error in setupTOTP:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Verify TOTP code and enable MFA
 */
export async function verifyAndEnableTOTP(
  userId: string,
  token: string,
  sourceIp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's MFA settings
    const { data: mfaSettings, error } = await supabaseAdmin
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !mfaSettings || !mfaSettings.totp_secret) {
      return { success: false, error: 'MFA not set up or invalid settings' };
    }

    // Decrypt TOTP secret
    const secret = decryptMessage(mfaSettings.totp_secret);

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) of drift
    });

    if (!verified) {
      await logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_verification_failed',
        event_category: 'authentication',
        severity: 'medium',
        source_ip: sourceIp,
        resource_accessed: '/mfa/verify',
        action_details: {
          mfa_type: 'totp',
          token_length: token.length
        },
        success: false,
        error_message: 'Invalid TOTP token'
      });

      return { success: false, error: 'Invalid verification code' };
    }

    // Enable MFA
    const { error: updateError } = await supabaseAdmin
      .from('user_mfa_settings')
      .update({
        is_enabled: true,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error enabling MFA:', updateError);
      return { success: false, error: 'Failed to enable MFA' };
    }

    await logSecurityEvent({
      user_id: userId,
      event_type: 'mfa_enabled',
      event_category: 'security',
      severity: 'info',
      source_ip: sourceIp,
      resource_accessed: '/mfa/enable',
      action_details: {
        mfa_type: 'totp'
      },
      success: true
    });

    return { success: true };

  } catch (error) {
    console.error('Error in verifyAndEnableTOTP:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Verify MFA token during login
 */
export async function verifyMFAToken(
  userId: string,
  token: string,
  tokenType: 'totp' | 'backup_code' = 'totp',
  sourceIp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's MFA settings
    const { data: mfaSettings, error } = await supabaseAdmin
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .single();

    if (error || !mfaSettings) {
      return { success: false, error: 'MFA not enabled for this user' };
    }

    let verified = false;

    if (tokenType === 'totp' && mfaSettings.totp_secret) {
      // Verify TOTP token
      const secret = decryptMessage(mfaSettings.totp_secret);
      verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2
      });

    } else if (tokenType === 'backup_code' && mfaSettings.backup_codes) {
      // Verify backup code
      const encryptedCodes = mfaSettings.backup_codes as string[];
      const decryptedCodes = encryptedCodes.map(code => {
        try {
          return decryptMessage(code);
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (decryptedCodes.includes(token.toUpperCase())) {
        verified = true;
        
        // Remove used backup code
        const remainingCodes = encryptedCodes.filter(encryptedCode => {
          try {
            return decryptMessage(encryptedCode) !== token.toUpperCase();
          } catch {
            return true;
          }
        });

        await supabaseAdmin
          .from('user_mfa_settings')
          .update({
            backup_codes: remainingCodes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    if (!verified) {
      await logSecurityEvent({
        user_id: userId,
        event_type: 'mfa_verification_failed',
        event_category: 'authentication',
        severity: 'medium',
        source_ip: sourceIp,
        resource_accessed: '/auth/mfa',
        action_details: {
          mfa_type: tokenType,
          token_length: token.length
        },
        success: false,
        error_message: `Invalid ${tokenType} token`
      });

      return { success: false, error: 'Invalid verification code' };
    }

    // Update last used timestamp
    await supabaseAdmin
      .from('user_mfa_settings')
      .update({
        last_used_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    await logSecurityEvent({
      user_id: userId,
      event_type: 'mfa_verification_success',
      event_category: 'authentication',
      severity: 'info',
      source_ip: sourceIp,
      resource_accessed: '/auth/mfa',
      action_details: {
        mfa_type: tokenType
      },
      success: true
    });

    return { success: true };

  } catch (error) {
    console.error('Error in verifyMFAToken:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(
  userId: string,
  verificationToken: string,
  sourceIp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify the user can disable MFA
    const verifyResult = await verifyMFAToken(userId, verificationToken, 'totp', sourceIp);
    
    if (!verifyResult.success) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Disable MFA
    const { error } = await supabaseAdmin
      .from('user_mfa_settings')
      .update({
        is_enabled: false,
        totp_secret: null,
        backup_codes: null,
        webauthn_credentials: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error disabling MFA:', error);
      return { success: false, error: 'Failed to disable MFA' };
    }

    await logSecurityEvent({
      user_id: userId,
      event_type: 'mfa_disabled',
      event_category: 'security',
      severity: 'medium',
      source_ip: sourceIp,
      resource_accessed: '/mfa/disable',
      action_details: {
        mfa_type: 'totp'
      },
      success: true
    });

    return { success: true };

  } catch (error) {
    console.error('Error in disableMFA:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user's MFA status and settings
 */
export async function getMFAStatus(userId: string): Promise<{
  enabled: boolean;
  methods: string[];
  backup_codes_remaining?: number;
  last_used?: string;
}> {
  try {
    const { data: mfaSettings, error } = await supabaseAdmin
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !mfaSettings) {
      return {
        enabled: false,
        methods: []
      };
    }

    const methods: string[] = [];
    if (mfaSettings.totp_secret && mfaSettings.is_enabled) {
      methods.push('totp');
    }
    if (mfaSettings.webauthn_credentials && (mfaSettings.webauthn_credentials as any[]).length > 0) {
      methods.push('webauthn');
    }
    if (mfaSettings.sms_phone) {
      methods.push('sms');
    }

    let backupCodesRemaining = 0;
    if (mfaSettings.backup_codes) {
      backupCodesRemaining = (mfaSettings.backup_codes as string[]).length;
    }

    return {
      enabled: mfaSettings.is_enabled,
      methods: methods,
      backup_codes_remaining: backupCodesRemaining,
      last_used: mfaSettings.last_used_at || undefined
    };

  } catch (error) {
    console.error('Error in getMFAStatus:', error);
    return {
      enabled: false,
      methods: []
    };
  }
}

/**
 * Generate new backup codes
 */
export async function generateNewBackupCodes(
  userId: string,
  verificationToken: string
): Promise<{ success: boolean; backup_codes?: string[]; error?: string }> {
  try {
    // Verify user can generate new codes
    const verifyResult = await verifyMFAToken(userId, verificationToken);
    
    if (!verifyResult.success) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      generateEncryptionKey(8).toUpperCase()
    );

    const encryptedBackupCodes = backupCodes.map(code => encryptMessage(code));

    // Update user's backup codes
    const { error } = await supabaseAdmin
      .from('user_mfa_settings')
      .update({
        backup_codes: encryptedBackupCodes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating backup codes:', error);
      return { success: false, error: 'Failed to generate new backup codes' };
    }

    await logSecurityEvent({
      user_id: userId,
      event_type: 'mfa_backup_codes_regenerated',
      event_category: 'security',
      severity: 'info',
      resource_accessed: '/mfa/backup-codes',
      action_details: {
        codes_generated: backupCodes.length
      },
      success: true
    });

    return {
      success: true,
      backup_codes: backupCodes
    };

  } catch (error) {
    console.error('Error in generateNewBackupCodes:', error);
    return { success: false, error: 'Internal server error' };
  }
}
