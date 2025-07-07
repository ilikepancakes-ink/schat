'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Users, Calendar, User, ArrowLeft } from 'lucide-react';

interface ChatroomPreview {
  id: string;
  name: string;
  description: string;
  is_staff_only: boolean;
  created_at: string;
  users?: {
    username?: string;
    display_name?: string;
  };
}

export default function JoinChatroomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [chatroom, setChatroom] = useState<ChatroomPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const inviteCode = params.inviteCode as string;

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    fetchChatroomPreview();
  }, [inviteCode]);

  const fetchChatroomPreview = async () => {
    try {
      const response = await apiClient.get(`/api/chatrooms/join?code=${inviteCode}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatroom(data.chatroom);
        } else {
          setError(data.error || 'Failed to load chatroom');
        }
      } else {
        setError('Failed to load chatroom');
      }
    } catch (error) {
      console.error('Error fetching chatroom preview:', error);
      setError('Failed to load chatroom');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const response = await apiClient.post('/api/chatrooms/join', {
        inviteCode,
      }, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Redirect to the main chat page
          router.push('/');
        } else {
          setError(data.error || 'Failed to join chatroom');
        }
      } else {
        setError('Failed to join chatroom');
      }
    } catch (error) {
      console.error('Error joining chatroom:', error);
      setError('Failed to join chatroom');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !chatroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Go to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className="text-blue-600 text-6xl mb-4">💬</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Chatroom</h1>
          <p className="text-gray-600">You've been invited to join a chatroom</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{chatroom.name}</h2>
          
          {chatroom.description && (
            <p className="text-gray-600 mb-3">{chatroom.description}</p>
          )}

          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <User size={16} className="mr-2" />
              Created by {chatroom.users?.display_name || chatroom.users?.username || 'Unknown User'}
            </div>
            
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              {new Date(chatroom.created_at).toLocaleDateString()}
            </div>

            {chatroom.is_staff_only && (
              <div className="flex items-center text-amber-600">
                <Users size={16} className="mr-2" />
                Staff Only
              </div>
            )}
          </div>
        </div>

        {!user ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">You need to sign in to join this chatroom</p>
            <button
              onClick={() => router.push('/auth')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {joining ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Users size={20} className="mr-2" />
                  Join Chatroom
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
