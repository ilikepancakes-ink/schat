/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/users/route';

// Mock the auth and database modules
jest.mock('@/lib/auth', () => ({
  validateSession: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  banUser: jest.fn(),
  unbanUser: jest.fn(),
  grantAdminPrivileges: jest.fn(),
  revokeAdminPrivileges: jest.fn(),
}));

jest.mock('@/lib/validation', () => ({
  validateAdminAction: jest.fn(),
}));

import { validateSession } from '@/lib/auth';
import { grantAdminPrivileges, revokeAdminPrivileges } from '@/lib/database';
import { validateAdminAction } from '@/lib/validation';

const mockValidateSession = validateSession as jest.MockedFunction<typeof validateSession>;
const mockGrantAdminPrivileges = grantAdminPrivileges as jest.MockedFunction<typeof grantAdminPrivileges>;
const mockRevokeAdminPrivileges = revokeAdminPrivileges as jest.MockedFunction<typeof revokeAdminPrivileges>;
const mockValidateAdminAction = validateAdminAction as jest.MockedFunction<typeof validateAdminAction>;

describe('Site Owner Admin Privilege Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any, token: string = 'valid-token') => {
    const request = new NextRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${token}`,
      },
    });
    return request;
  };

  describe('Grant Admin Privileges', () => {
    it('should allow site owner to grant admin privileges', async () => {
      // Mock site owner session
      mockValidateSession.mockResolvedValue({
        valid: true,
        user: {
          id: 'site-owner-id',
          username: 'siteowner',
          is_admin: false,
          is_site_owner: true,
          is_banned: false,
        },
      });

      mockValidateAdminAction.mockReturnValue({
        valid: true,
        sanitized: {
          action: 'grant_admin',
          userId: 'user-id',
          reason: 'Promoting to moderator',
        },
      });

      mockGrantAdminPrivileges.mockResolvedValue({
        success: true,
      });

      const request = createMockRequest({
        action: 'grant_admin',
        userId: 'user-id',
        reason: 'Promoting to moderator',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGrantAdminPrivileges).toHaveBeenCalledWith(
        'user-id',
        'site-owner-id',
        'Promoting to moderator'
      );
    });

    it('should deny regular admin from granting admin privileges', async () => {
      // Mock regular admin session
      mockValidateSession.mockResolvedValue({
        valid: true,
        user: {
          id: 'admin-id',
          username: 'admin',
          is_admin: true,
          is_site_owner: false,
          is_banned: false,
        },
      });

      mockValidateAdminAction.mockReturnValue({
        valid: true,
        sanitized: {
          action: 'grant_admin',
          userId: 'user-id',
          reason: 'Promoting to moderator',
        },
      });

      const request = createMockRequest({
        action: 'grant_admin',
        userId: 'user-id',
        reason: 'Promoting to moderator',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Site owner privileges required for admin management');
      expect(mockGrantAdminPrivileges).not.toHaveBeenCalled();
    });
  });

  describe('Revoke Admin Privileges', () => {
    it('should allow site owner to revoke admin privileges', async () => {
      // Mock site owner session
      mockValidateSession.mockResolvedValue({
        valid: true,
        user: {
          id: 'site-owner-id',
          username: 'siteowner',
          is_admin: false,
          is_site_owner: true,
          is_banned: false,
        },
      });

      mockValidateAdminAction.mockReturnValue({
        valid: true,
        sanitized: {
          action: 'revoke_admin',
          userId: 'admin-id',
          reason: 'Removing moderator privileges',
        },
      });

      mockRevokeAdminPrivileges.mockResolvedValue({
        success: true,
      });

      const request = createMockRequest({
        action: 'revoke_admin',
        userId: 'admin-id',
        reason: 'Removing moderator privileges',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRevokeAdminPrivileges).toHaveBeenCalledWith(
        'admin-id',
        'site-owner-id',
        'Removing moderator privileges'
      );
    });

    it('should deny regular admin from revoking admin privileges', async () => {
      // Mock regular admin session
      mockValidateSession.mockResolvedValue({
        valid: true,
        user: {
          id: 'admin-id',
          username: 'admin',
          is_admin: true,
          is_site_owner: false,
          is_banned: false,
        },
      });

      mockValidateAdminAction.mockReturnValue({
        valid: true,
        sanitized: {
          action: 'revoke_admin',
          userId: 'other-admin-id',
          reason: 'Removing moderator privileges',
        },
      });

      const request = createMockRequest({
        action: 'revoke_admin',
        userId: 'other-admin-id',
        reason: 'Removing moderator privileges',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Site owner privileges required for admin management');
      expect(mockRevokeAdminPrivileges).not.toHaveBeenCalled();
    });
  });

  describe('Other Admin Actions', () => {
    it('should allow regular admin to ban users', async () => {
      // Mock regular admin session
      mockValidateSession.mockResolvedValue({
        valid: true,
        user: {
          id: 'admin-id',
          username: 'admin',
          is_admin: true,
          is_site_owner: false,
          is_banned: false,
        },
      });

      mockValidateAdminAction.mockReturnValue({
        valid: true,
        sanitized: {
          action: 'ban',
          userId: 'user-id',
          reason: 'Violating community guidelines',
        },
      });

      // Mock banUser function
      const { banUser } = require('@/lib/database');
      banUser.mockResolvedValue({ success: true });

      const request = createMockRequest({
        action: 'ban',
        userId: 'user-id',
        reason: 'Violating community guidelines',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(banUser).toHaveBeenCalledWith(
        'user-id',
        'admin-id',
        'Violating community guidelines'
      );
    });
  });
});
