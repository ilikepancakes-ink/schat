'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PrivacySettings from '@/components/privacy/PrivacySettings';

export default function PrivacyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-purple-600 hover:text-purple-800 transition-colors mb-4"
          >
            ← Back to Chat
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Settings</h1>
          <p className="text-gray-600 mt-2">
            Control your privacy and data settings for Schat
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <PrivacySettings onClose={() => router.push('/')} />
        </div>
      </div>
    </div>
  );
}
