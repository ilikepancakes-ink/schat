'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, LogOut, Settings, Shield, Users, Hash, Menu, Lock } from 'lucide-react';

interface ChatHeaderProps {
  onToggleUserList: () => void;
  showUserList: boolean;
  onToggleChatroomSidebar: () => void;
  showChatroomSidebar: boolean;
  currentChatroomName: string;
  onOpenAdminPanel?: () => void;
  onOpenPrivacySettings?: () => void;
}

export default function ChatHeader({
  onToggleUserList,
  showUserList,
  onToggleChatroomSidebar,
  showChatroomSidebar,
  currentChatroomName,
  onOpenAdminPanel,
  onOpenPrivacySettings
}: ChatHeaderProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Logo, title, and current chatroom */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleChatroomSidebar}
            className={`p-2 rounded-lg transition-colors lg:hidden ${
              showChatroomSidebar ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Toggle chatroom sidebar"
          >
            <Menu size={20} />
          </button>

          <MessageCircle size={24} className="text-purple-600" />
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900">Schat</h1>
            <span className="text-gray-400">•</span>
            <div className="flex items-center space-x-1">
              <Hash size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {currentChatroomName}
              </span>
            </div>
          </div>
          <span className="text-sm text-gray-500 hidden lg:inline">
            Ultra-private messaging
          </span>
        </div>

        {/* Right side - User info and controls */}
        <div className="flex items-center space-x-3">
          {/* Toggle chatroom sidebar button (desktop) */}
          <button
            onClick={onToggleChatroomSidebar}
            className={`hidden lg:flex p-2 rounded-lg transition-colors ${
              showChatroomSidebar ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Toggle chatroom sidebar"
          >
            <Hash size={20} />
          </button>

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
                <div className="text-xs text-gray-500 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Online
                </div>
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
                      onClick={() => {
                        onOpenPrivacySettings?.();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    >
                      <Lock size={16} className="mr-2" />
                      Privacy Settings
                    </button>
                    {user?.is_admin && (
                      <a
                        href="/admin/dashboard"
                        className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Shield size={16} className="mr-2" />
                        Admin Dashboard
                      </a>
                    )}
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
