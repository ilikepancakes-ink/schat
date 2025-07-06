'use client';

import React from 'react';
import { Code, Book, Shield, Zap, Users, MessageCircle, ArrowRight, Copy, ExternalLink, Lock, Activity, Globe } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperLandingPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const codeExamples = {
    auth: `// Authentication Example
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Logged in:', data.user);
}`,
    
    sendMessage: `// Send Message Example
const response = await fetch('/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include auth cookies
  body: JSON.stringify({
    content: 'Hello, world!'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Message sent:', data.message);
}`,

    getProfile: `// Get User Profile Example
const response = await fetch('/api/profile/user-id-here', {
  method: 'GET',
  credentials: 'include', // Include auth cookies
});

const data = await response.json();
if (data.success) {
  console.log('Profile:', data.profile);
}`
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Build with
              <span className="text-blue-600"> Schat API</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Integrate secure messaging, user management, and cybersecurity features into your applications with our comprehensive REST API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center justify-center"
              >
                View API Docs
                <Book className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth"
                className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center justify-center"
              >
                Get API Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Start Guide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get up and running with the Schat API in minutes. Follow these simple steps to start building.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Register Account</h3>
              <p className="text-gray-600 dark:text-gray-300">Create your developer account to get API access and authentication tokens.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authenticate</h3>
              <p className="text-gray-600 dark:text-gray-300">Use the login endpoint to authenticate and receive session cookies for API calls.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Start Building</h3>
              <p className="text-gray-600 dark:text-gray-300">Make API calls to send messages, manage users, and integrate security features.</p>
            </div>
          </div>

          {/* Code Examples */}
          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication</h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.auth)}
                  className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                <code>{codeExamples.auth}</code>
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Message</h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.sendMessage)}
                  className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                <code>{codeExamples.sendMessage}</code>
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Get User Profile</h3>
                <button
                  onClick={() => copyToClipboard(codeExamples.getProfile)}
                  className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                <code>{codeExamples.getProfile}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* API Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful API Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to build secure, feature-rich messaging and collaboration applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Real-time Messaging</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Send and receive messages in real-time with support for public channels, private messages, and chatrooms.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Public chat messages</li>
                <li>• Private messaging</li>
                <li>• Chatroom management</li>
                <li>• Message encryption</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Complete user system with profiles, authentication, friend relationships, and permission management.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• User registration & login</li>
                <li>• Profile management</li>
                <li>• Friend system</li>
                <li>• Role-based permissions</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-red-600 dark:text-red-400 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Security Features</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Advanced security tools including vulnerability scanning, security challenges, and audit logging.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Vulnerability scanning</li>
                <li>• Security challenges</li>
                <li>• Audit logs</li>
                <li>• Rate limiting</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy Controls</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Comprehensive privacy settings and data management tools for GDPR compliance and user control.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Privacy settings</li>
                <li>• Data export</li>
                <li>• Account deletion</li>
                <li>• GDPR compliance</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Activity className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Tools</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Powerful administrative features for user management, content moderation, and system monitoring.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• User administration</li>
                <li>• Content moderation</li>
                <li>• Security reports</li>
                <li>• System monitoring</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">High Performance</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Built for scale with efficient endpoints, caching, rate limiting, and optimized database queries.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Fast response times</li>
                <li>• Efficient pagination</li>
                <li>• Smart caching</li>
                <li>• Rate limiting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication & Security Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Enterprise-Grade Security
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Built with security-first principles for the cybersecurity community. Every endpoint is protected with multiple layers of security.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                    <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cookie-Based Authentication</h3>
                    <p className="text-gray-600 dark:text-gray-300">Secure HTTP-only cookies with automatic session management and CSRF protection.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rate Limiting</h3>
                    <p className="text-gray-600 dark:text-gray-300">Intelligent rate limiting to prevent abuse and ensure fair usage across all endpoints.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Audit Logging</h3>
                    <p className="text-gray-600 dark:text-gray-300">Comprehensive audit trails for all API operations with security event monitoring.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Authentication Flow</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-gray-700 dark:text-gray-300">POST to /api/auth/login with credentials</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-gray-700 dark:text-gray-300">Receive HTTP-only auth cookie</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-gray-700 dark:text-gray-300">Include credentials: 'include' in requests</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-gray-700 dark:text-gray-300">Access protected endpoints</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Building?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the developer community and start integrating Schat's powerful features today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              Read Full Documentation
              <Book className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/auth"
              className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              Get API Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
