'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-200 relative">
      {/* Back button in top left */}
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle size={48} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Schat</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Ultra-private messaging platform</p>
        </div>

        {/* Auth Forms */}
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Zero-Knowledge • End-to-End Encrypted • Privacy-First</p>
        </div>
      </div>
    </div>
  );
}
