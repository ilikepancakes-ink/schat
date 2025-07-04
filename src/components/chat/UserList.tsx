'use client';

import React from 'react';
import { ChatUser } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Circle, Ban, UserCheck, UserX, Crown } from 'lucide-react';

interface UserListProps {
  users: ChatUser[];
  onBanUser?: (userId: string, username: string) => void;
  onUnbanUser?: (userId: string, username: string) => void;
  onGrantAdmin?: (userId: string, username: string) => void;
  onRevokeAdmin?: (userId: string, username: string) => void;
  onUserClick?: (userId: string) => void;
}

export default function UserList({
  users,
  onBanUser,
  onUnbanUser,
  onGrantAdmin,
  onRevokeAdmin,
  onUserClick
}: UserListProps) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.is_admin;

  const sortedUsers = [...users].sort((a, b) => {
    // Sort by: online status, admin status, then alphabetically
    if (a.is_online !== b.is_online) {
      return a.is_online ? -1 : 1;
    }
    if (a.is_admin !== b.is_admin) {
      return a.is_admin ? -1 : 1;
    }
    return a.username.localeCompare(b.username);
  });

  const handleUserAction = (action: string, userId: string, username: string) => {
    const reason = prompt(`Enter reason for ${action}:`);
    if (reason === null) return; // User cancelled
    
    switch (action) {
      case 'ban':
        onBanUser?.(userId, username);
        break;
      case 'unban':
        onUnbanUser?.(userId, username);
        break;
      case 'grant_admin':
        onGrantAdmin?.(userId, username);
        break;
      case 'revoke_admin':
        onRevokeAdmin?.(userId, username);
        break;
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 w-64 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Users ({users.length})
        </h3>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {sortedUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 ${
                user.id === currentUser?.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* Online status */}
                <Circle
                  size={8}
                  className={`${
                    user.is_online ? 'text-green-500 fill-current' : 'text-gray-300'
                  }`}
                />

                {/* Username */}
                <button
                  onClick={() => {
                    console.log('👤 Username clicked:', user.username, 'ID:', user.id);
                    console.log('👤 onUserClick function exists:', !!onUserClick);
                    onUserClick?.(user.id);
                  }}
                  className={`text-sm font-medium truncate hover:underline cursor-pointer text-left ${
                    user.is_banned ? 'text-red-500 line-through' : 'text-gray-900 hover:text-blue-600'
                  }`}
                  title={`View ${user.username}'s profile`}
                >
                  {user.username}
                  {user.id === currentUser?.id && ' (You)'}
                </button>

                {/* Admin badge */}
                {user.is_admin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Shield size={10} className="mr-0.5" />
                    STAFF
                  </span>
                )}

                {/* Banned indicator */}
                {user.is_banned && (
                  <Ban size={14} className="text-red-500" />
                )}
              </div>

              {/* Admin actions */}
              {isAdmin && user.id !== currentUser?.id && (
                <div className="flex items-center space-x-1">
                  {/* Ban/Unban */}
                  {user.is_banned ? (
                    <button
                      onClick={() => handleUserAction('unban', user.id, user.username)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Unban user"
                    >
                      <UserCheck size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction('ban', user.id, user.username)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Ban user"
                    >
                      <UserX size={14} />
                    </button>
                  )}

                  {/* Grant/Revoke Admin */}
                  {user.is_admin ? (
                    <button
                      onClick={() => handleUserAction('revoke_admin', user.id, user.username)}
                      className="p-1 text-orange-600 hover:bg-orange-100 rounded"
                      title="Revoke admin privileges"
                    >
                      <Crown size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction('grant_admin', user.id, user.username)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      title="Grant admin privileges"
                    >
                      <Crown size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <Circle size={6} className="text-green-500 fill-current" />
          <span>Online</span>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <Circle size={6} className="text-gray-300" />
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
}
