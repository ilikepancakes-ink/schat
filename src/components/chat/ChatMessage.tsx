'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Shield } from 'lucide-react';
import { parseMessageContent } from '@/lib/message-parser';
import LinkEmbed from './LinkEmbed';

interface ChatMessageProps {
  message: ChatMessageType;
  onDeleteMessage?: (messageId: string) => void;
  onUserClick?: (userId: string) => void;
}

export default function ChatMessage({ message, onDeleteMessage, onUserClick }: ChatMessageProps) {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.user_id;
  const canDelete = user?.is_admin && !message.is_deleted;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Parse message content for links
  const parsedMessage = parseMessageContent(message.content);

  if (message.is_deleted) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="text-gray-400 dark:text-gray-500 text-sm italic bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
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
            <button
              onClick={() => {
                console.log('Username clicked:', message.username, 'User ID:', message.user_id);
                onUserClick?.(message.user_id);
              }}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              {message.username}
            </button>
            {message.is_admin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                <Shield size={12} className="mr-1" />
                STAFF
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.created_at)}
            </span>
          </div>
        </div>

        {/* Message content */}
        <div className="relative group">
          <div
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              isOwnMessage
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            }`}
          >
            {/* Render message segments */}
            <div className="text-sm whitespace-pre-wrap break-words">
              {parsedMessage.segments.map((segment, index) => {
                if (segment.type === 'text') {
                  return (
                    <span key={index}>
                      {segment.content}
                    </span>
                  );
                } else if (segment.type === 'link') {
                  return (
                    <a
                      key={index}
                      href={segment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`underline hover:no-underline ${
                        isOwnMessage
                          ? 'text-blue-100 hover:text-white'
                          : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                      }`}
                    >
                      {segment.url}
                    </a>
                  );
                }
                return null;
              })}
            </div>
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

        {/* Link embeds */}
        {parsedMessage.hasLinks && (
          <div className="mt-2 space-y-2">
            {parsedMessage.segments
              .filter(segment => segment.type === 'link')
              .map((segment, index) => (
                <LinkEmbed
                  key={`${segment.url}-${index}`}
                  url={segment.url}
                  className="max-w-sm"
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
