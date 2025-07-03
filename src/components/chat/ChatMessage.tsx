'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Shield } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onDeleteMessage?: (messageId: string) => void;
}

export default function ChatMessage({ message, onDeleteMessage }: ChatMessageProps) {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.user_id;
  const canDelete = user?.is_admin && !message.is_deleted;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.is_deleted) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="text-gray-400 text-sm italic bg-gray-50 px-3 py-1 rounded-lg">
          Message deleted by admin
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Message header */}
        <div className={`flex items-center mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {message.username}
            </span>
            {message.is_admin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Shield size={12} className="mr-1" />
                STAFF
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
          </div>
        </div>

        {/* Message content */}
        <div className="relative group">
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>

          {/* Admin delete button */}
          {canDelete && (
            <button
              onClick={() => onDeleteMessage?.(message.id)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
