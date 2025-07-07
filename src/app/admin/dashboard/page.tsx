'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { ChatUser } from '@/types/database';
import { Shield, Users, Activity, AlertTriangle, MessageCircle, ArrowLeft, Bug } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import SystemStatus from '@/components/admin/SystemStatus';
import SecurityReports from '@/components/admin/SecurityReports';

type TabType = 'users' | 'system' | 'security' | 'logs';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      
      if (!user.is_admin) {
        router.push('/');
        return;
      }
      
      loadUsers();
    }
  }, [user, authLoading, router]);

  const loadUsers = async () => {
    try {
      const response = await apiRequest('/api/admin/users', {
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
      const response = await apiRequest('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, userId, reason }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadUsers();
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin (handled in useEffect, but this is backup)
  if (!user?.is_admin) {
    return null;
  }

  const tabs = [
    { id: 'users' as TabType, label: 'User Management', icon: Users },
    { id: 'system' as TabType, label: 'System Status', icon: Activity },
    { id: 'security' as TabType, label: 'Security Reports', icon: Bug },
    { id: 'logs' as TabType, label: 'Admin Logs', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Chat</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-3">
              <Shield className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 flex items-center">
                {user?.username}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Shield size={10} className="mr-1" />
                  ADMIN
                </span>
              </div>
              <div className="text-xs text-gray-500">Administrator Access</div>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
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

        {activeTab === 'security' && (
          <SecurityReports />
        )}

        {activeTab === 'logs' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Logs</h3>
              <p className="text-gray-500 mb-4">This feature is coming soon...</p>
              <p className="text-sm text-gray-400">
                This will show audit trails of admin actions, user management history, and system events.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
