'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage as ChatMessageType, ChatUser } from '@/types/database';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import UserList from './UserList';
import AdminPanel from '../admin/AdminPanel';

export default function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial data
  useEffect(() => {
    loadMessages();
    loadUsers();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
        } else {
          setError(data.error || 'Failed to load messages');
        }
      } else {
        setError('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!user?.is_admin) return;
    
    try {
      const response = await fetch('/api/admin/users', {
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
    }
  };

  const sendMessage = async (content: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message]);
        } else {
          throw new Error(data.error || 'Failed to send message');
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user?.is_admin) return;
    
    const reason = prompt('Enter reason for deleting this message:');
    if (reason === null) return;

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ messageId, reason }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mark message as deleted in local state
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, is_deleted: true, content: '[Message deleted]' }
                : msg
            )
          );
        } else {
          alert(data.error || 'Failed to delete message');
        }
      } else {
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Network error');
    }
  };

  const handleUserAction = async (action: string, userId: string, username: string) => {
    if (!user?.is_admin) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh users list
          await loadUsers();
          alert(`Successfully ${action.replace('_', ' ')} ${username}`);
        } else {
          alert(data.error || `Failed to ${action.replace('_', ' ')} user`);
        }
      } else {
        alert(`Failed to ${action.replace('_', ' ')} user`);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <ChatHeader
        onToggleUserList={() => setShowUserList(!showUserList)}
        showUserList={showUserList}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onDeleteMessage={user?.is_admin ? deleteMessage : undefined}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <MessageInput
            onSendMessage={sendMessage}
            disabled={user?.is_banned}
          />
        </div>

        {/* User list */}
        {showUserList && (
          <UserList
            users={users}
            onBanUser={(userId, username) => handleUserAction('ban', userId, username)}
            onUnbanUser={(userId, username) => handleUserAction('unban', userId, username)}
            onGrantAdmin={(userId, username) => handleUserAction('grant_admin', userId, username)}
            onRevokeAdmin={(userId, username) => handleUserAction('revoke_admin', userId, username)}
          />
        )}
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && user?.is_admin && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onRefreshUsers={loadUsers}
        />
      )}
    </div>
  );
}
