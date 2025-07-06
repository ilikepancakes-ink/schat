'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatUser } from '@/types/database';
import { apiClient } from '@/lib/api-client';
import { X, Shield, Users, Activity, AlertTriangle } from 'lucide-react';
import UserManagement from './UserManagement';
import SystemStatus from './SystemStatus';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshUsers: () => void;
}

type TabType = 'users' | 'system' | 'logs';

export default function AdminPanel({ onClose, onRefreshUsers }: AdminPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.is_admin || user?.is_site_owner) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users || []);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string, reason?: string) => {
    try {
      const response = await apiClient.post('/api/admin/users',
        { action, userId, reason },
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadUsers();
          onRefreshUsers();
          return { success: true };
        } else {
          return { success: false, error: data.error };
        }
      } else {
        return { success: false, error: 'Network error' };
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      return { success: false, error: 'Network error' };
    }
  };

  if (!user?.is_admin && !user?.is_site_owner) {
    return null;
  }

  const tabs = [
    { id: 'users' as TabType, label: 'User Management', icon: Users },
    { id: 'system' as TabType, label: 'System Status', icon: Activity },
    { id: 'logs' as TabType, label: 'Admin Logs', icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'users' && (
            <UserManagement
              users={users}
              loading={loading}
              onUserAction={handleUserAction}
              onRefresh={loadUsers}
            />
          )}
          
          {activeTab === 'system' && (
            <SystemStatus />
          )}
          
          {activeTab === 'logs' && (
            <div className="p-6 text-center text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Admin logs feature coming soon...</p>
              <p className="text-sm mt-2">This will show audit trails of admin actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
