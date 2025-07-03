'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, LogOut, Settings, Shield, Users } from 'lucide-react';

interface ChatHeaderProps {
  onToggleUserList: () => void;
  showUserList: boolean;
  onOpenAdminPanel?: () => void;
}

export default function ChatHeader({ onToggleUserList, showUserList, onOpenAdminPanel }: ChatHeaderProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and title */}
        <div className="flex items-center space-x-3">
          <MessageCircle size={24} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">SchoolChat</h1>
          <span className="text-sm text-gray-500 hidden sm:inline">
            Secure messaging
          </span>
        </div>

        {/* Right side - User info and controls */}
        <div className="flex items-center space-x-3">
          {/* Toggle user list button */}
          <button
            onClick={onToggleUserList}
            className={`p-2 rounded-lg transition-colors ${
              showUserList 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Toggle user list"
          >
            <Users size={20} />
          </button>

          {/* Admin panel button */}
          {user?.is_admin && (
            <button
              onClick={onOpenAdminPanel}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              title="Admin Panel"
            >
              <Settings size={20} />
            </button>
          )}

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900 flex items-center">
                  {user?.username}
                  {user?.is_admin && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Shield size={10} className="mr-1" />
                      STAFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">Online</div>
              </div>
              
              {/* Avatar */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      {user?.username}
                      {user?.is_admin && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield size={8} className="mr-0.5" />
                          STAFF
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Secure session active</div>
                  </div>
                  
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
