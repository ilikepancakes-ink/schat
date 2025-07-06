'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Trash2, 
  Clock, 
  UserX, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  X,
  Settings
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PrivacySettingsProps {
  onClose: () => void;
}

interface PrivacyConfig {
  profileVisibility: 'public' | 'friends' | 'private';
  messageRetention: number; // days, 0 = forever
  allowDirectMessages: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  dataMinimization: boolean;
  anonymousMode: boolean;
  autoDeleteMessages: boolean;
  blockAnalytics: boolean;
}

export default function PrivacySettings({ onClose }: PrivacySettingsProps) {
  const { user } = useAuth();
  const [config, setConfig] = useState<PrivacyConfig>({
    profileVisibility: 'public',
    messageRetention: 0,
    allowDirectMessages: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
    dataMinimization: false,
    anonymousMode: false,
    autoDeleteMessages: false,
    blockAnalytics: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDataDeletion, setShowDataDeletion] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const response = await apiClient.get('/api/privacy/settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig({ ...config, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    setSaving(true);
    try {
      const response = await apiClient.put('/api/privacy/settings', config, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Privacy settings saved successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDataDeletion = async (type: 'messages' | 'profile' | 'all') => {
    const confirmText = type === 'all' 
      ? 'DELETE ALL MY DATA' 
      : type === 'messages' 
        ? 'DELETE MY MESSAGES' 
        : 'DELETE MY PROFILE';
    
    const userInput = prompt(
      `This action cannot be undone. Type "${confirmText}" to confirm:`
    );
    
    if (userInput !== confirmText) {
      alert('Deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      const response = await apiClient.delete('/api/privacy/data', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`${type === 'all' ? 'All data' : type} deleted successfully`);
          if (type === 'all' || type === 'profile') {
            // Logout user if profile/all data deleted
            window.location.href = '/';
          }
        }
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Failed to delete data');
    }
  };

  const updateConfig = (key: keyof PrivacyConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Eye className="mr-2" size={20} />
              Profile Visibility
            </h3>
            <div className="space-y-2">
              {[
                { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                { value: 'friends', label: 'Friends Only', desc: 'Only friends can see your profile' },
                { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
              ].map(option => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value={option.value}
                    checked={config.profileVisibility === option.value}
                    onChange={(e) => updateConfig('profileVisibility', e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message Retention */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="mr-2" size={20} />
              Message Retention
            </h3>
            <div className="space-y-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Auto-delete messages after (days, 0 = never):
                </span>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={config.messageRetention}
                  onChange={(e) => updateConfig('messageRetention', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </label>
              <p className="text-sm text-gray-500">
                Set to 0 to keep messages forever. Messages older than this will be automatically deleted.
              </p>
            </div>
          </div>

          {/* Privacy Toggles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lock className="mr-2" size={20} />
              Privacy Controls
            </h3>
            
            {[
              { key: 'allowDirectMessages', label: 'Allow Direct Messages', desc: 'Others can send you private messages' },
              { key: 'allowFriendRequests', label: 'Allow Friend Requests', desc: 'Others can send you friend requests' },
              { key: 'showOnlineStatus', label: 'Show Online Status', desc: 'Others can see when you\'re online' },
              { key: 'dataMinimization', label: 'Data Minimization', desc: 'Collect and store minimal data only' },
              { key: 'anonymousMode', label: 'Anonymous Mode', desc: 'Hide your identity in public areas' },
              { key: 'autoDeleteMessages', label: 'Auto-Delete Messages', desc: 'Automatically delete messages based on retention settings' },
              { key: 'blockAnalytics', label: 'Block Analytics', desc: 'Prevent usage analytics and tracking' },
            ].map(toggle => (
              <label key={toggle.key} className="flex items-center justify-between cursor-pointer">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{toggle.label}</div>
                  <div className="text-sm text-gray-500">{toggle.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={config[toggle.key as keyof PrivacyConfig] as boolean}
                  onChange={(e) => updateConfig(toggle.key as keyof PrivacyConfig, e.target.checked)}
                  className="ml-4 text-purple-600 focus:ring-purple-500 rounded"
                />
              </label>
            ))}
          </div>

          {/* Data Management */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Trash2 className="mr-2" size={20} />
              Data Management
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Danger Zone</h4>
                  <p className="text-sm text-red-700 mt-1">
                    These actions cannot be undone. Please be certain before proceeding.
                  </p>
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => handleDataDeletion('messages')}
                      className="block w-full text-left px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete All My Messages
                    </button>
                    <button
                      onClick={() => handleDataDeletion('profile')}
                      className="block w-full text-left px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete My Profile
                    </button>
                    <button
                      onClick={() => handleDataDeletion('all')}
                      className="block w-full text-left px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete All My Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Changes are saved automatically when you click Save
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePrivacySettings}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
