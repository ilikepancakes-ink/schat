'use client';

import React, { useState } from 'react';
import { Copy, Check, Hash } from 'lucide-react';

interface InviteCodeDisplayProps {
  inviteCode: string;
  chatroomName: string;
}

export default function InviteCodeDisplay({ inviteCode, chatroomName }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite code:', error);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Hash size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Invite Code:
          </span>
          <code className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-mono">
            {inviteCode}
          </code>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm"
          title="Copy invite code"
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
