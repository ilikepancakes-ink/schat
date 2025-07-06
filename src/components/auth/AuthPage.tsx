'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { MessageCircle } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle size={48} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Schat</h1>
          <p className="text-gray-600 mt-2">Ultra-private messaging platform</p>
        </div>

        {/* Auth Forms */}
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Zero-Knowledge • End-to-End Encrypted • Privacy-First</p>
        </div>
      </div>
    </div>
  );
}
