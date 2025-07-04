'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chatroom } from '@/types/database';
import { apiClient } from '@/lib/api-client';
import { 
  MessageCircle, 
  Plus, 
  Hash, 
  Lock, 
  Users, 
  Settings,
  X,
  Crown
} from 'lucide-react';

interface ChatroomSidebarProps {
  selectedChatroomId?: string | null;
  onSelectChatroom: (chatroomId: string | null) => void;
  onToggleSidebar?: () => void;
  showSidebar: boolean;
}

interface CreateChatroomForm {
  name: string;
  description: string;
  isStaffOnly: boolean;
}

export default function ChatroomSidebar({ 
  selectedChatroomId, 
  onSelectChatroom, 
  onToggleSidebar,
  showSidebar 
}: ChatroomSidebarProps) {
  const { user } = useAuth();
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateChatroomForm>({
    name: '',
    description: '',
    isStaffOnly: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (showSidebar) {
      loadChatrooms();
    }
  }, [showSidebar]);

  const loadChatrooms = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/chatrooms', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatrooms(data.chatrooms || []);
        } else {
          setError(data.error || 'Failed to load chatrooms');
        }
      } else {
        setError('Failed to load chatrooms');
      }
    } catch (error) {
      console.error('Error loading chatrooms:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setCreating(true);
      const response = await apiClient.post('/api/chatrooms', {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        is_staff_only: createForm.isStaffOnly,
      }, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Reset form and close modal
          setCreateForm({ name: '', description: '', isStaffOnly: false });
          setShowCreateForm(false);
          // Reload chatrooms
          await loadChatrooms();
          // Select the new chatroom
          if (data.chatroom) {
            onSelectChatroom(data.chatroom.id);
          }
        } else {
          setError(data.error || 'Failed to create chatroom');
        }
      } else {
        setError('Failed to create chatroom');
      }
    } catch (error) {
      console.error('Error creating chatroom:', error);
      setError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectChatroom = (chatroomId: string) => {
    onSelectChatroom(chatroomId);
  };

  const handleSelectGeneral = () => {
    onSelectChatroom(null); // null represents the general chat
  };

  if (!showSidebar) {
    return null;
  }

  return (
    <>
      <div className="bg-white border-r border-gray-200 w-64 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Chatrooms</h3>
            <div className="flex items-center space-x-2">
              {user?.is_admin && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Create new chatroom"
                >
                  <Plus size={18} />
                </button>
              )}
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded lg:hidden"
                  title="Close sidebar"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chatroom list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              <button
                onClick={loadChatrooms}
                className="text-blue-600 text-sm hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* General Chat */}
              <button
                onClick={handleSelectGeneral}
                className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-gray-50 ${
                  !selectedChatroomId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <Hash size={16} className="text-gray-500" />
                <span className="text-sm font-medium">General Chat</span>
              </button>

              {/* User's Chatrooms */}
              {chatrooms.map((chatroom) => (
                <button
                  key={chatroom.id}
                  onClick={() => handleSelectChatroom(chatroom.id)}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-gray-50 ${
                    selectedChatroomId === chatroom.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {chatroom.is_staff_only ? (
                      <Crown size={16} className="text-yellow-500" />
                    ) : (
                      <Hash size={16} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {chatroom.name}
                    </span>
                    {chatroom.description && (
                      <span className="text-xs text-gray-500 truncate block">
                        {chatroom.description}
                      </span>
                    )}
                  </div>
                  {chatroom.is_staff_only && (
                    <Lock size={12} className="text-gray-400" />
                  )}
                </button>
              ))}

              {chatrooms.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No chatrooms yet</p>
                  <p className="text-xs">Create one to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Chatroom Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Chatroom</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateChatroom} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter chatroom name"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter chatroom description"
                  rows={3}
                  maxLength={200}
                />
              </div>

              {user?.is_admin && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isStaffOnly"
                    checked={createForm.isStaffOnly}
                    onChange={(e) => setCreateForm({ ...createForm, isStaffOnly: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isStaffOnly" className="ml-2 text-sm text-gray-700">
                    Staff only chatroom
                  </label>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating || !createForm.name.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
