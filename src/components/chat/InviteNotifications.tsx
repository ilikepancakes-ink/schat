'use client';

import React from 'react';
import { ChatroomInvite } from '@/types/database';
import { X, Check, XCircle, AlertTriangle, Users } from 'lucide-react';

interface InviteNotificationsProps {
  invites: ChatroomInvite[];
  onResponse: (inviteId: string, action: 'accept' | 'decline' | 'report') => void;
  onClose: () => void;
}

export default function InviteNotifications({ 
  invites, 
  onResponse, 
  onClose 
}: InviteNotificationsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-full">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={20} />
            <h3 className="font-semibold">Chatroom Invites</h3>
            <span className="bg-blue-500 text-xs px-2 py-1 rounded-full">
              {invites.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Invites List */}
        <div className="max-h-96 overflow-y-auto">
          {invites.map((invite) => (
            <div key={invite.id} className="p-4 border-b border-gray-100 last:border-b-0">
              <div className="space-y-3">
                {/* Invite Info */}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {invite.chatroom_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Invited by {invite.invited_by_username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(invite.created_at)}
                  </p>
                </div>

                {/* Invite Message */}
                {invite.invite_message && (
                  <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                    "{invite.invite_message}"
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onResponse(invite.id, 'accept')}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Check size={16} />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => onResponse(invite.id, 'decline')}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <XCircle size={16} />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => onResponse(invite.id, 'report')}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    title="Report this invite"
                  >
                    <AlertTriangle size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">
            Invites will expire if not responded to within 7 days
          </p>
        </div>
      </div>
    </div>
  );
}
