'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, LogOut, Settings, Shield, Users, Hash, Menu, Lock } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        {/* Left side - Logo, title, and current chatroom */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleChatroomSidebar}
            className={`p-2 rounded-lg transition-colors lg:hidden ${
              showChatroomSidebar ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Toggle chatroom sidebar"
          >
            <Menu size={20} />
          </button>

          <MessageCircle size={24} className="text-purple-600" />
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Schat</h1>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <div className="flex items-center space-x-1">
              <Hash size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentChatroomName}
              </span>
            </div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden lg:inline">
            Ultra-private messaging
          </span>
        </div>

        {/* Right side - User info and controls */}
        <div className="flex items-center space-x-3">
          {/* Theme toggle */}
          <ThemeToggle className="hidden sm:flex" />

          {/* Toggle chatroom sidebar button (desktop) */}
          <button
            onClick={onToggleChatroomSidebar}
            className={`hidden lg:flex p-2 rounded-lg transition-colors ${
              showChatroomSidebar ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Toggle user list"
          >
            <Users size={20} />
          </button>

          {/* Admin panel button */}
          {user?.is_admin && (
            <button
              onClick={onOpenAdminPanel}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
              title="Admin Panel"
            >
              <Settings size={20} />
            </button>
          )}

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  {user?.username}
                  {user?.is_admin && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      <Shield size={10} className="mr-1" />
                      STAFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Online
                </div>
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      {user?.username}
                      {user?.is_admin && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          <Shield size={8} className="mr-0.5" />
                          STAFF
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Secure session active</div>
                  </div>
                  
                  <div className="p-1">
                    {/* Theme toggle for mobile */}
                    <div className="sm:hidden px-3 py-2">
                      <ThemeToggle showLabel={true} className="w-full justify-start" />
                    </div>

                    <button
                      onClick={() => {
                        onOpenPrivacySettings?.();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                    >
                      <Lock size={16} className="mr-2" />
                      Privacy Settings
                    </button>
                    {user?.is_admin && (
                      <a
                        href="/admin/dashboard"
                        className="w-full flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      >
                        <Shield size={16} className="mr-2" />
                        Admin Dashboard
                      </a>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
