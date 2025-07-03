'use client';

import React, { useState } from 'react';
import { ChatUser } from '@/types/database';
import { Shield, Ban, UserCheck, UserX, Crown, MoreVertical, RefreshCw } from 'lucide-react';

interface UserManagementProps {
  users: ChatUser[];
  loading: boolean;
  onUserAction: (action: string, userId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
}

export default function UserManagement({ users, loading, onUserAction, onRefresh }: UserManagementProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleUserAction = async (action: string, userId: string, username: string) => {
    const reason = prompt(`Enter reason for ${action.replace('_', ' ')} ${username}:`);
    if (reason === null) return;

    setActionLoading(userId);
    
    try {
      const result = await onUserAction(action, userId, reason);
      
      if (result.success) {
        alert(`Successfully ${action.replace('_', ' ')} ${username}`);
      } else {
        alert(result.error || `Failed to ${action.replace('_', ' ')} user`);
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setActionLoading(null);
      setSelectedUser(null);
    }
  };

  const getStatusBadge = (user: ChatUser) => {
    if (user.is_banned) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Ban size={10} className="mr-1" />
          Banned
        </span>
      );
    }
    
    if (user.is_admin) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Shield size={10} className="mr-1" />
          Admin
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        User
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600">Manage user permissions and access</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.is_admin).length}
          </div>
          <div className="text-sm text-green-600">Admins</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.is_banned).length}
          </div>
          <div className="text-sm text-red-600">Banned</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {users.filter(u => u.is_online).length}
          </div>
          <div className="text-sm text-gray-600">Online</div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        user.is_online ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm text-gray-900">
                        {user.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Note: We don't have created_at in ChatUser type, so showing placeholder */}
                    Recently
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                        disabled={actionLoading === user.id}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      >
                        {actionLoading === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <MoreVertical size={16} />
                        )}
                      </button>

                      {selectedUser === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setSelectedUser(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <div className="p-1">
                              {/* Ban/Unban */}
                              {user.is_banned ? (
                                <button
                                  onClick={() => handleUserAction('unban', user.id, user.username)}
                                  className="w-full flex items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md"
                                >
                                  <UserCheck size={16} className="mr-2" />
                                  Unban User
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction('ban', user.id, user.username)}
                                  className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  <UserX size={16} className="mr-2" />
                                  Ban User
                                </button>
                              )}

                              {/* Grant/Revoke Admin */}
                              {user.is_admin ? (
                                <button
                                  onClick={() => handleUserAction('revoke_admin', user.id, user.username)}
                                  className="w-full flex items-center px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-md"
                                >
                                  <Crown size={16} className="mr-2" />
                                  Revoke Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction('grant_admin', user.id, user.username)}
                                  className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                  <Crown size={16} className="mr-2" />
                                  Grant Admin
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
}
