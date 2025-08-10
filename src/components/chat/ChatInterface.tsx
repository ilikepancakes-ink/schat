'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage as ChatMessageType, ChatUser, ChatroomInvite, FileAttachment } from '@/types/database';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import UserList from './UserList';
import ChatroomSidebar from './ChatroomSidebar';
import AdminPanel from '../admin/AdminPanel';
import UserProfile from '../profile/UserProfile';
import InviteNotifications from './InviteNotifications';
import PrivacySettings from '../privacy/PrivacySettings';
import InviteCodeDisplay from './InviteCodeDisplay';
import { UserProfile as UserProfileType } from '@/types/database';
import { apiClient } from '@/lib/api-client';
import { io, Socket } from 'socket.io-client';
import DMCallOverlay from '../call/DMCallOverlay';

import { MessageCircle, UserPlus } from 'lucide-react';
export default function ChatInterface() {
  const { user } = useAuth();
  console.log('Current user in ChatInterface:', user);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(true);
  const [showChatroomSidebar, setShowChatroomSidebar] = useState(true);
  const [selectedChatroomId, setSelectedChatroomId] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [error, setError] = useState('');
  const [lastMessageTime, setLastMessageTime] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfileType | null>(null);

  // Debug: Log selectedProfile changes
  useEffect(() => {
    console.log('🎭 selectedProfile state changed:', selectedProfile);
  }, [selectedProfile]);
  const [pendingInvites, setPendingInvites] = useState<ChatroomInvite[]>([]);
  const [showInviteNotifications, setShowInviteNotifications] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [currentChatroom, setCurrentChatroom] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; userId: string; username: string } | null>(null);
  const [callState, setCallState] = useState<{ open: boolean; mode: 'audio' | 'video' | null; role: 'caller' | 'callee' | null }>({ open: false, mode: null, role: null });

  // Close context menu on click elsewhere or escape
  useEffect(() => {
    if (!contextMenu?.visible) return;
    const handleClick = () => setContextMenu(null);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRoomRef = useRef<string | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial data
  useEffect(() => {
    loadMessages();
    loadUsers();
    loadPendingInvites();
  }, [selectedChatroomId]);

  // WebSocket connection
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    // Ensure server socket route is initialized
    fetch('/api/socket').catch(() => {});

    const socket = io({ path: '/api/socket', withCredentials: true, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Join current room if selected
      if (selectedChatroomId) {
        socket.emit('join_chatroom', selectedChatroomId);
      }
    });

    socket.on('new_message', (msg: any) => {
      // Only add messages for the current chatroom
      const currentRoom = currentRoomRef.current;
      if (!currentRoom || msg.chatroom_id !== currentRoom) return;
      const incoming: ChatMessageType = {
        id: msg.id,
        user_id: msg.user_id,
        username: msg.username,
        content: msg.content,
        created_at: msg.created_at,
        is_admin: !!msg.is_admin,
        is_deleted: !!msg.is_deleted,
        attachments: msg.attachments || [],
      };
      setMessages((prev: ChatMessageType[]) => [...prev, incoming]);
    });

    // Handle call invites
    const onCallSignal = (payload: any) => {
      const currentRoom = currentRoomRef.current;
      if (!currentRoom || payload.chatroomId !== currentRoom) return;
      if (payload.type === 'invite') {
        // Don't auto-handle if we're already in a call
        if (callState.open) return;
        const accept = window.confirm(`${payload.mode === 'video' ? 'Video' : 'Voice'} call from ${payload.fromUserId ? 'user' : ''}. Accept?`);
        if (accept) {
          setCallState({ open: true, mode: payload.mode, role: 'callee' });
          socket.emit('call:signal', { type: 'accept', chatroomId: payload.chatroomId });
        } else {
          socket.emit('call:signal', { type: 'end', chatroomId: payload.chatroomId });
        }
      }
    };
    socket.on('call:signal', onCallSignal);

    socket.on('user_joined', () => {});
    socket.on('user_left', () => {});

    return () => {
      socket.off('call:signal', onCallSignal);
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (selectedChatroomId) {
      currentRoomRef.current = selectedChatroomId;
      socket.emit('join_chatroom', selectedChatroomId);
      // Load initial messages for the room once
      loadMessages();
    } else {
      currentRoomRef.current = null;
    }
    return () => {
      if (socket && selectedChatroomId) {
        socket.emit('leave_chatroom', selectedChatroomId);
      }
    };
  }, [selectedChatroomId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const endpoint = selectedChatroomId
        ? `/api/chatrooms/${selectedChatroomId}/messages`
        : '/api/messages';

      const response = await apiClient.get(endpoint, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newMessages = data.messages || [];

          // Only update if there are new messages
          if (newMessages.length > 0) {
            const latestMessageTime = newMessages[newMessages.length - 1]?.created_at;
            if (latestMessageTime !== lastMessageTime) {
              setMessages(newMessages);
              setLastMessageTime(latestMessageTime);
            }
          } else if (newMessages.length === 0) {
            // Clear messages if switching to empty chatroom
            setMessages([]);
            setLastMessageTime('');
          }
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
    try {
      console.log('🔍 Loading users for user list...');
      const response = await apiClient.get('/api/users', {
        credentials: 'include',
      });

      console.log('🔍 Users API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Users API response data:', data);
        if (data.success) {
          setUsers(data.users || []);
          console.log('✅ Users loaded successfully:', data.users?.length || 0);
          console.log('🔍 User IDs in list:', data.users?.map((u: any) => ({ username: u.username, id: u.id })));
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const response = await apiClient.get('/api/chatrooms/invites', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPendingInvites(data.invites || []);
          setShowInviteNotifications(data.invites?.length > 0);
        }
      }
    } catch (error) {
      console.error('Error loading pending invites:', error);
    }
  };

  const handleInviteResponse = async (inviteId: string, action: 'accept' | 'decline' | 'report') => {
    try {
      const response = await apiClient.patch('/api/chatrooms/invites',
        { inviteId, action },
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove the invite from pending list
          setPendingInvites((prev: ChatroomInvite[]) => prev.filter((invite: ChatroomInvite) => invite.id !== inviteId));

          // If accepted, refresh chatrooms
          if (action === 'accept') {
            // Optionally switch to the joined chatroom
            // You might want to add this functionality
          }
        }
      }
    } catch (error) {
      console.error('Error responding to invite:', error);
    }
  };

  const sendMessage = async (content: string, attachments?: FileAttachment[]) => {
    try {
      const endpoint = selectedChatroomId
        ? `/api/chatrooms/${selectedChatroomId}/messages`
        : '/api/messages';

      const response = await apiClient.post(endpoint,
        { content, attachments },
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (!(data && data.success)) {
          throw new Error(data?.error || 'Failed to send message');
        }
        // Do not append to messages here; server broadcasts via WebSocket
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
      const response = await apiClient.delete('/api/admin/messages', {
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
          setMessages((prev: ChatMessageType[]) =>
            prev.map((msg: ChatMessageType) =>
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
      const response = await apiClient.post('/api/admin/users',
        { action, userId },
        { credentials: 'include' }
      );

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

  const handleCommand = async (command: { type: string; args?: string[] }) => {
    try {
      if (command.type === 'invitelink') {
        if (!selectedChatroomId) {
          alert('Invite links can only be generated in chatrooms');
          return;
        }

        const response = await apiClient.get(`/api/chatrooms/${selectedChatroomId}/invite-link`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Copy to clipboard and show success message
            await navigator.clipboard.writeText(data.inviteLink);
            alert(`Invite link copied to clipboard!\n\nChatroom: ${data.chatroomName}\nLink: ${data.inviteLink}`);
          } else {
            alert(data.error || 'Failed to generate invite link');
          }
        } else {
          alert('Failed to generate invite link');
        }
      } else if (command.type === 'privateshare') {
        if (!selectedChatroomId || !command.args?.[0]) {
          alert('Private sharing requires a chatroom and username');
          return;
        }

        const response = await apiClient.post(`/api/chatrooms/${selectedChatroomId}/private-share`, {
          username: command.args[0]
        }, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert(`Private invite sent to ${command.args[0]}!`);
          } else {
            alert(data.error || 'Failed to send private invite');
          }
        } else {
          alert('Failed to send private invite');
        }
      }
    } catch (error) {
      console.error('Error handling command:', error);
      alert('Failed to execute command');
    }
  };

  const handleUserClick = async (userId: string) => {
    console.log('🔍 handleUserClick called with userId:', userId);

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      console.error('❌ Invalid userId:', userId);
      setError('Invalid user ID');
      return;
    }

    try {
      console.log('📡 Making API call to /api/profile/' + userId);
      const response = await apiClient.get(`/api/profile/${userId}`, {
        credentials: 'include',
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('📡 API response data:', data);
        if (data.success && data.profile) {
          console.log('✅ Setting selectedProfile to:', data.profile);
          setSelectedProfile(data.profile);
          console.log('✅ selectedProfile state should now be set');
          // Clear any previous errors
          setError('');
        } else {
          console.error('❌ Profile API returned error:', data.error);
          setError(`Failed to load profile: ${data.error || 'No profile data'}`);
        }
      } else {
        console.error('❌ Profile API request failed with status:', response.status);
        let errorMessage = 'Server error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          // If user not found, try refreshing the user list
          if (response.status === 404 && errorMessage.includes('User not found')) {
            console.log('🔄 User not found, refreshing user list...');
            await loadUsers();
            errorMessage = 'User not found. User list has been refreshed.';
          }
        } catch (e) {
          console.log('Could not parse error response as JSON');
        }
        setError(`Failed to load profile: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setError('Failed to load profile: Network error');
    }
  };

  const handleSendMessage = async (userId: string) => {
    try {
      const response = await apiClient.post('/api/chatrooms/dm',
        { otherUserId: userId },
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Switch to the DM chatroom
          setSelectedChatroomId(data.chatroom.id);
          setSelectedProfile(null);

          // Optionally show a success message
          console.log(data.message || 'DM chatroom created');
        } else {
          console.error('Failed to create DM:', data.error);
        }
      } else {
        console.error('Failed to create DM chatroom');
      }
    } catch (error) {
      console.error('Error creating DM:', error);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      const response = await apiClient.post('/api/friends', {
        action: 'send_request',
        friendId: userId,
      }, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh profile to update friend status
          await handleUserClick(userId);
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    try {
      const response = await apiClient.post('/api/friends', {
        action: 'remove_friend',
        friendId: userId,
      }, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh profile to update friend status
          await handleUserClick(userId);
        }
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfileType>) => {
    if (!user || !selectedProfile) return;

    try {
      const response = await apiClient.put(`/api/profile/${selectedProfile.id}`,
        updates,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the selected profile with new data
          setSelectedProfile((prev: UserProfileType | null) => prev ? { ...prev, ...updates } as UserProfileType : null);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const fetchChatroomDetails = async (chatroomId: string) => {
    try {
      const response = await apiClient.get(`/api/chatrooms/${chatroomId}/invite-link`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentChatroom({
            id: chatroomId,
            name: data.chatroomName,
            inviteCode: data.inviteCode
          });
        }
      }
    } catch (error) {
      console.error('Error fetching chatroom details:', error);
    }
  };

  const handleSelectChatroom = (chatroomId: string | null) => {
    setSelectedChatroomId(chatroomId);
    setMessages([]); // Clear messages when switching chatrooms
    setLastMessageTime('');
    setLoading(true);
    setCurrentChatroom(null); // Clear current chatroom details

    if (chatroomId) {
      fetchChatroomDetails(chatroomId);
    }
  };

  const getCurrentChatroomName = () => {
    if (!selectedChatroomId || selectedChatroomId === null) {
      return 'Welcome to Schat';
    }
    // Prefer loaded chatroom name
    if (currentChatroom?.name) return currentChatroom.name;
    return `Chatroom ${selectedChatroomId.slice(0, 8)}...`;
  };

  const isCurrentDM = !!currentChatroom?.name && currentChatroom.name.startsWith('DM:');

  const handleStartCall = (mode: 'audio' | 'video') => {
    if (!selectedChatroomId || !socketRef.current) return;
    // Open overlay as caller and send invite
    setCallState({ open: true, mode, role: 'caller' });
    socketRef.current.emit('call:signal', { type: 'invite', chatroomId: selectedChatroomId, mode });
  };

  if (loading) {
    return (
      <React.Fragment>
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading chat...</p>
          </div>
        </div>
      </React.Fragment>
    );
  }

  if (error) {
    return (
      <React.Fragment>
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
      </React.Fragment>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <ChatHeader
        onToggleUserList={() => setShowUserList(!showUserList)}
        showUserList={showUserList}
        onToggleChatroomSidebar={() => setShowChatroomSidebar(!showChatroomSidebar)}
        showChatroomSidebar={showChatroomSidebar}
        currentChatroomName={getCurrentChatroomName()}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
        onOpenPrivacySettings={() => setShowPrivacySettings(true)}
        isDM={isCurrentDM}
        onStartVoiceCall={() => handleStartCall('audio')}
        onStartVideoCall={() => handleStartCall('video')}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chatroom Sidebar */}
        <ChatroomSidebar
          selectedChatroomId={selectedChatroomId}
          onSelectChatroom={handleSelectChatroom}
          onToggleSidebar={() => setShowChatroomSidebar(false)}
          showSidebar={showChatroomSidebar}
        />

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Invite Code Display */}
          {currentChatroom && currentChatroom.inviteCode && (
            <InviteCodeDisplay
              inviteCode={currentChatroom.inviteCode}
              chatroomName={currentChatroom.name}
            />
          )}

          {/* Messages or Welcome Screen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedChatroomId ? (
              // Welcome Screen
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                  <div className="text-6xl mb-6">💬</div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Welcome to Schat
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Connect with your community, create servers, and chat with friends in real-time.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get started by choosing an option from the sidebar:
                    </p>
                    <div className="flex flex-col space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Join the community server</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>Create your own server</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Join with an invite code</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onDeleteMessage={user?.is_admin ? deleteMessage : undefined}
                  onUserClick={handleUserClick}
                  onUserContextMenu={(uid, uname, e) => {
                    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, userId: uid, username: uname });
                  }}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input - only show when a chatroom is selected */}
          {selectedChatroomId && (
            <MessageInput
              onSendMessage={sendMessage}
              onCommand={handleCommand}


              currentChatroomId={selectedChatroomId || undefined}
              disabled={user?.is_banned}
            />
          )}
        </div>

        {/* User list */}
        {showUserList && (
          <UserList
            users={users}
            onBanUser={(userId, username) => handleUserAction('ban', userId, username)}
            onUnbanUser={(userId, username) => handleUserAction('unban', userId, username)}
            onGrantAdmin={(userId, username) => handleUserAction('grant_admin', userId, username)}
            onRevokeAdmin={(userId, username) => handleUserAction('revoke_admin', userId, username)}
            onUserClick={handleUserClick}
            onUserContextMenu={(uid, uname, e) => {
              setContextMenu({ visible: true, x: e.clientX, y: e.clientY, userId: uid, username: uname });
            }}
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

      {selectedProfile && (
        <>
          {console.log('🎭 Rendering UserProfile component with profile:', selectedProfile)}
          <UserProfile
            profile={selectedProfile}
            onClose={() => {
              console.log('🎭 UserProfile onClose called');
              setSelectedProfile(null);
            }}
            onSendMessage={handleSendMessage}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onUpdateProfile={handleUpdateProfile}
          />
        </>
      )}

      {/* Error display */}
      {error && (
        <div className="fixed top-4 left-4 bg-red-500 text-white p-4 rounded z-[110] text-sm max-w-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Username context menu */}
      {contextMenu?.visible && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => {
              handleSendMessage(contextMenu.userId);
              setContextMenu(null);
            }}
          >
            <MessageCircle size={16} className="mr-2" /> Direct Message {contextMenu.username}
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => {
              handleAddFriend(contextMenu.userId);
              setContextMenu(null);
            }}
          >
            <UserPlus size={16} className="mr-2" /> Add {contextMenu.username} as Friend
          </button>
        </div>
      )}


      {/* Debug info */}
      {selectedProfile && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded z-[110] text-sm font-bold">
          Profile loaded: {selectedProfile.username}
          <br />
          ID: {selectedProfile.id}
        </div>
      )}

      {/* Test buttons for debugging */}
      {user?.is_admin && (
        <div className="fixed bottom-4 right-4 space-y-2 z-[60]">
          <button
            onClick={() => {
              console.log('🧪 Test button clicked - setting dummy profile');
              setSelectedProfile({
                id: 'test-id',
                username: 'testuser',
                display_name: 'Test User',
                bio: 'This is a test profile',
                is_admin: false,
                is_site_owner: false,
                is_online: true,
                created_at: new Date().toISOString(),
                friend_status: 'none'
              });
            }}
            className="block bg-purple-500 text-white p-2 rounded text-xs"
          >
            Test Profile
          </button>
          <button
            onClick={async () => {
              console.log('🧪 Test API call with current user ID');
              if (user?.id) {
                await handleUserClick(user.id);
              }
            }}
            className="block bg-orange-500 text-white p-2 rounded text-xs"
          >
            Test API Call
          </button>
          <button
            onClick={async () => {
              console.log('🧪 Checking user list vs database');
              console.log('🧪 Current users in list:', users.map(u => ({ id: u.id, username: u.username })));

              // Try to call profile API for each user to see which ones fail
              for (const testUser of users.slice(0, 3)) {
                console.log(`🧪 Testing user: ${testUser.username} (${testUser.id})`);
                try {
                  const response = await apiClient.get(`/api/profile/${testUser.id}`, {
                    credentials: 'include',
                  });
                  console.log(`✅ ${testUser.username}: ${response.status}`);
                } catch (error) {
                  console.log(`❌ ${testUser.username}: Error`, error);
                }
              }
            }}
            className="block bg-yellow-500 text-white p-2 rounded text-xs"
          >
            Debug Users
          </button>
          <button
            onClick={async () => {
              console.log('🔧 Calling debug endpoint...');
              try {
                const response = await apiClient.get('/api/debug/users', {
                  credentials: 'include',
                });
                const data = await response.json();
                console.log('🔧 Debug endpoint response:', data);
                alert('Debug data logged to console. Check browser console for details.');
              } catch (error) {
                console.error('🔧 Debug endpoint error:', error);
                alert('Debug endpoint failed. Check console for details.');
              }
            }}
            className="block bg-purple-500 text-white p-2 rounded text-xs"
          >
            Debug DB
          </button>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacySettings && (
        <PrivacySettings
          onClose={() => setShowPrivacySettings(false)}
        />
      )}

      {/* DM Call Overlay */}
      {callState.open && callState.mode && callState.role && selectedChatroomId && socketRef.current && (
        <DMCallOverlay
          socket={socketRef.current}
          chatroomId={selectedChatroomId}
          mode={callState.mode}
          role={callState.role}
          onClose={() => setCallState({ open: false, mode: null, role: null })}
        />
      )}

      {/* Invite Notifications */}
      {showInviteNotifications && pendingInvites.length > 0 && (
        <InviteNotifications
          invites={pendingInvites}
          onResponse={handleInviteResponse}
          onClose={() => setShowInviteNotifications(false)}
        />
      )}
    </div>
  );
}
