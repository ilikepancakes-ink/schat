'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle, Paperclip, X, File, Image } from 'lucide-react';
import { parseCommand, isCommand, getCommandHelp } from '@/lib/command-parser';
import { fileIOClient, FileIOResponse } from '@/lib/api-client';
import { FileAttachment } from '@/types/database';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void;
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
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file size (max 100MB for file.io)
        if (file.size > 100 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 100MB)`);
        }

        // Upload to file.io with 7 days expiry and max 10 downloads
        const uploadResult: FileIOResponse = await fileIOClient.upload(file, {
          expires: '7d',
          maxDownloads: 10,
          autoDelete: true
        });

        const attachment: FileAttachment = {
          id: uploadResult.id,
          name: uploadResult.name,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType,
          url: uploadResult.link,
          key: uploadResult.key,
          expires: uploadResult.expires,
          maxDownloads: uploadResult.maxDownloads,
          downloads: uploadResult.downloads
        };

        return attachment;
      });

      const newAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('File upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file(s)');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image size={16} className="text-blue-500" />;
    }
    return <File size={16} className="text-gray-500" />;
  };

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
        await onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
      }

      setMessage('');
      setAttachments([]);

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

      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attachments ({attachments.length}):
          </div>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(attachment.mimeType)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.size)} • {attachment.mimeType}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove attachment"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
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

        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Attach file"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
          ) : (
            <Paperclip size={20} />
          )}
        </button>

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
          disabled={(!message.trim() && attachments.length === 0) || isSubmitting || disabled || isUploading}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Messages are encrypted end-to-end for your privacy
        {currentChatroomId && (
          <span className="ml-2">• Use &invitelink or &privateshare commands</span>
        )}
        <span className="ml-2">• Files uploaded via file.io (7 days, max 10 downloads)</span>
      </div>
    </div>
  );
}
