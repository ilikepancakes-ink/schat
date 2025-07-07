'use client';

import React, { useState, useRef } from 'react';
import { UserProfile as UserProfileType } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api-client';
import {
  X,
  MessageCircle,
  UserPlus,
  UserMinus,
  Shield,
  Calendar,
  Camera,
  Edit3,
  Save,
  XCircle
} from 'lucide-react';

interface UserProfileProps {
  profile: UserProfileType;
  onClose: () => void;
  onSendMessage?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
  onRemoveFriend?: (userId: string) => void;
  onUpdateProfile?: (updates: Partial<UserProfileType>) => void;
}

export default function UserProfile({ 
  profile, 
  onClose, 
  onSendMessage, 
  onAddFriend, 
  onRemoveFriend,
  onUpdateProfile 
}: UserProfileProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || ''
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user?.id === profile.id;
  const displayName = profile.display_name || profile.username;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile(editedProfile);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile({
      display_name: profile.display_name || '',
      bio: profile.bio || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiRequest('/api/profile/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && onUpdateProfile) {
          onUpdateProfile({ profile_picture_url: data.imageUrl });
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getFriendButtonText = () => {
    switch (profile.friend_status) {
      case 'accepted':
        return 'Remove Friend';
      case 'pending_sent':
        return 'Request Sent';
      case 'pending_received':
        return 'Accept Request';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Add Friend';
    }
  };

  const getFriendButtonIcon = () => {
    switch (profile.friend_status) {
      case 'accepted':
        return UserMinus;
      case 'pending_sent':
        return UserPlus;
      case 'pending_received':
        return UserPlus;
      default:
        return UserPlus;
    }
  };

  const handleFriendAction = () => {
    if (profile.friend_status === 'accepted' && onRemoveFriend) {
      onRemoveFriend(profile.id);
    } else if (onAddFriend) {
      onAddFriend(profile.id);
    }
  };

  console.log('🎭 UserProfile component rendering with profile:', profile);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-blue-500">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Profile</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                  title="Change profile picture"
                >
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Online Status */}
            {profile.is_online && (
              <div className="flex items-center mt-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Online
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.display_name}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter display name"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100">{displayName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <div className="flex items-center space-x-2">
                <p className="text-gray-900 dark:text-gray-100">@{profile.username}</p>
                {profile.is_admin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    <Shield size={12} className="mr-1" />
                    STAFF
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {profile.bio || 'No bio available'}
                </p>
              )}
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Member Since
              </label>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar size={16} className="mr-2" />
                {formatDate(profile.created_at)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isOwnProfile ? (
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors flex items-center justify-center"
                    >
                      <XCircle size={16} className="mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Edit3 size={16} className="mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Send Message Button */}
                <button
                  onClick={() => onSendMessage?.(profile.id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <MessageCircle size={16} className="mr-2" />
                  Send Message
                </button>

                {/* Friend Button */}
                {profile.friend_status !== 'blocked' && (
                  <button
                    onClick={handleFriendAction}
                    disabled={profile.friend_status === 'pending_sent'}
                    className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      profile.friend_status === 'accepted'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : profile.friend_status === 'pending_sent'
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {React.createElement(getFriendButtonIcon(), { size: 16, className: "mr-2" })}
                    {getFriendButtonText()}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
