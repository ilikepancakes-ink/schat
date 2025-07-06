'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import { parseCommand, isCommand, getCommandHelp } from '@/lib/command-parser';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onCommand?: (command: { type: string; args?: string[] }) => void;
  disabled?: boolean;
  currentChatroomId?: string;
}

export default function MessageInput({
  onSendMessage,
  onCommand,
  disabled = false,
  currentChatroomId
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommandHelp, setShowCommandHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if this is a command
      if (isCommand(message.trim())) {
        const command = parseCommand(message.trim());

        if (command.type === 'invitelink') {
          if (!currentChatroomId) {
            throw new Error('Invite links can only be generated in chatrooms');
          }
          onCommand?.({ type: 'invitelink' });
        } else if (command.type === 'privateshare') {
          if (!currentChatroomId) {
            throw new Error('Private sharing can only be used in chatrooms');
          }
          if (!command.args?.[0]) {
            throw new Error('Username is required for private sharing');
          }
          onCommand?.({ type: 'privateshare', args: command.args });
        }
      } else {
        // Regular message
        await onSendMessage(message.trim());
      }

      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Show error to user
      alert(error instanceof Error ? error.message : 'Failed to process message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-colors duration-200">
      {/* Command help tooltip */}
      {showCommandHelp && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <div className="font-medium text-blue-900 dark:text-blue-200 mb-1">Chat Commands:</div>
          <div className="text-blue-800 dark:text-blue-300 whitespace-pre-line">{getCommandHelp()}</div>
          <button
            onClick={() => setShowCommandHelp(false)}
            className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
          >
            Close
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "You are banned from sending messages" : "Type your message... (Press Enter to send, Shift+Enter for new line)"}
            disabled={disabled || isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200 placeholder-gray-500 dark:placeholder-gray-400"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            rows={1}
          />
        </div>

        {/* Help button */}
        <button
          type="button"
          onClick={() => setShowCommandHelp(!showCommandHelp)}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Show command help"
        >
          <HelpCircle size={20} />
        </button>

        <button
          type="submit"
          disabled={!message.trim() || isSubmitting || disabled}
          className="bg-blue-600 dark:bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="Send message"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Messages are encrypted end-to-end for your privacy
        {currentChatroomId && (
          <span className="ml-2">• Use &invitelink or &privateshare commands</span>
        )}
      </div>
    </div>
  );
}
