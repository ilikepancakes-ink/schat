'use client';

import React, { useState } from 'react';
import { Code, Copy, ChevronDown, ChevronRight, Shield, Users, MessageCircle, Settings, Lock, Activity } from 'lucide-react';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  adminOnly?: boolean;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: { field: string; type: string; required: boolean; description: string }[];
  responses: { status: number; description: string; example?: any }[];
}

interface ApiSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  endpoints: ApiEndpoint[];
}

const apiSections: ApiSection[] = [
  {
    title: 'Authentication',
    icon: <Shield className="h-5 w-5" />,
    description: 'User authentication and session management',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register a new user account',
        auth: false,
        requestBody: [
          { field: 'username', type: 'string', required: true, description: 'Unique username (3-20 characters)' },
          { field: 'password', type: 'string', required: true, description: 'Password (minimum 8 characters)' },
          { field: 'confirmPassword', type: 'string', required: true, description: 'Password confirmation' }
        ],
        responses: [
          { status: 201, description: 'User registered successfully', example: { success: true, message: 'User registered successfully', user: { id: 'uuid', username: 'john_doe' } } },
          { status: 400, description: 'Validation error or user already exists' },
          { status: 500, description: 'Internal server error' }
        ]
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate user and create session',
        auth: false,
        requestBody: [
          { field: 'username', type: 'string', required: true, description: 'Username or email' },
          { field: 'password', type: 'string', required: true, description: 'User password' }
        ],
        responses: [
          { status: 200, description: 'Login successful', example: { success: true, message: 'Login successful', user: { id: 'uuid', username: 'john_doe', is_admin: false } } },
          { status: 401, description: 'Invalid credentials' },
          { status: 429, description: 'Rate limit exceeded' }
        ]
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Get current user information',
        auth: true,
        responses: [
          { status: 200, description: 'User information retrieved', example: { success: true, user: { id: 'uuid', username: 'john_doe', is_admin: false } } },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'Logout user and invalidate session',
        auth: true,
        responses: [
          { status: 200, description: 'Logout successful' },
          { status: 401, description: 'Authentication required' }
        ]
      }
    ]
  },
  {
    title: 'Users',
    icon: <Users className="h-5 w-5" />,
    description: 'User management and profiles',
    endpoints: [
      {
        method: 'GET',
        path: '/api/users',
        description: 'Get list of all users',
        auth: true,
        responses: [
          { status: 200, description: 'Users retrieved successfully' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'GET',
        path: '/api/profile/{userId}',
        description: 'Get user profile by ID',
        auth: true,
        parameters: [
          { name: 'userId', type: 'string', required: true, description: 'User ID to fetch profile for' }
        ],
        responses: [
          { status: 200, description: 'Profile retrieved successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 404, description: 'User not found' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/profile/{userId}',
        description: 'Update user profile (own profile only)',
        auth: true,
        parameters: [
          { name: 'userId', type: 'string', required: true, description: 'User ID (must be current user)' }
        ],
        requestBody: [
          { field: 'display_name', type: 'string', required: false, description: 'Display name' },
          { field: 'bio', type: 'string', required: false, description: 'User biography' },
          { field: 'profile_picture_url', type: 'string', required: false, description: 'Profile picture URL' }
        ],
        responses: [
          { status: 200, description: 'Profile updated successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Can only update own profile' }
        ]
      },
      {
        method: 'POST',
        path: '/api/profile/upload-image',
        description: 'Upload profile picture',
        auth: true,
        requestBody: [
          { field: 'image', type: 'file', required: true, description: 'Image file (max 5MB, JPG/PNG)' }
        ],
        responses: [
          { status: 200, description: 'Image uploaded successfully' },
          { status: 400, description: 'Invalid file format or size' },
          { status: 401, description: 'Authentication required' }
        ]
      }
    ]
  },
  {
    title: 'Messages',
    icon: <MessageCircle className="h-5 w-5" />,
    description: 'Public chat messages and private messaging',
    endpoints: [
      {
        method: 'GET',
        path: '/api/messages',
        description: 'Get public chat messages with pagination',
        auth: true,
        parameters: [
          { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', required: false, description: 'Messages per page (default: 50, max: 100)' }
        ],
        responses: [
          { status: 200, description: 'Messages retrieved successfully' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'POST',
        path: '/api/messages',
        description: 'Send a public chat message',
        auth: true,
        requestBody: [
          { field: 'content', type: 'string', required: true, description: 'Message content (max 2000 characters)' }
        ],
        responses: [
          { status: 201, description: 'Message sent successfully' },
          { status: 400, description: 'Invalid message content' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'User is banned' },
          { status: 429, description: 'Rate limit exceeded' }
        ]
      },
      {
        method: 'GET',
        path: '/api/private-messages',
        description: 'Get private messages between users',
        auth: true,
        parameters: [
          { name: 'with_user_id', type: 'string', required: true, description: 'ID of the other user' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'limit', type: 'number', required: false, description: 'Messages per page' }
        ],
        responses: [
          { status: 200, description: 'Private messages retrieved' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'POST',
        path: '/api/private-messages',
        description: 'Send a private message',
        auth: true,
        requestBody: [
          { field: 'recipient_id', type: 'string', required: true, description: 'ID of message recipient' },
          { field: 'content', type: 'string', required: true, description: 'Message content' }
        ],
        responses: [
          { status: 201, description: 'Private message sent' },
          { status: 400, description: 'Invalid request' },
          { status: 401, description: 'Authentication required' }
        ]
      }
    ]
  },
  {
    title: 'Chatrooms',
    icon: <Users className="h-5 w-5" />,
    description: 'Chatroom management and messaging',
    endpoints: [
      {
        method: 'GET',
        path: '/api/chatrooms',
        description: 'Get all chatrooms the user is a member of',
        auth: true,
        responses: [
          { status: 200, description: 'Chatrooms retrieved successfully' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'GET',
        path: '/api/chatrooms/{id}/messages',
        description: 'Get messages for a specific chatroom',
        auth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Chatroom ID' },
          { name: 'page', type: 'number', required: false, description: 'Page number' },
          { name: 'limit', type: 'number', required: false, description: 'Messages per page' }
        ],
        responses: [
          { status: 200, description: 'Messages retrieved successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Not a member of this chatroom' }
        ]
      },
      {
        method: 'POST',
        path: '/api/chatrooms/{id}/messages',
        description: 'Send a message to a chatroom',
        auth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Chatroom ID' }
        ],
        requestBody: [
          { field: 'content', type: 'string', required: true, description: 'Message content' }
        ],
        responses: [
          { status: 201, description: 'Message sent successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Not a member or banned' }
        ]
      },
      {
        method: 'GET',
        path: '/api/chatrooms/{id}/invite-link',
        description: 'Get invite link for a chatroom',
        auth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Chatroom ID' }
        ],
        responses: [
          { status: 200, description: 'Invite link retrieved' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Not authorized to create invite links' }
        ]
      },
      {
        method: 'GET',
        path: '/api/chatrooms/invites',
        description: 'Get pending chatroom invites for current user',
        auth: true,
        responses: [
          { status: 200, description: 'Invites retrieved successfully' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'POST',
        path: '/api/chatrooms/join',
        description: 'Join a chatroom via invite link',
        auth: true,
        requestBody: [
          { field: 'invite_code', type: 'string', required: true, description: 'Chatroom invite code' }
        ],
        responses: [
          { status: 200, description: 'Successfully joined chatroom' },
          { status: 400, description: 'Invalid invite code' },
          { status: 401, description: 'Authentication required' }
        ]
      }
    ]
  },
  {
    title: 'Friends',
    icon: <Users className="h-5 w-5" />,
    description: 'Friend system and relationships',
    endpoints: [
      {
        method: 'GET',
        path: '/api/friends',
        description: 'Get user\'s friends and friend requests',
        auth: true,
        responses: [
          { status: 200, description: 'Friends retrieved successfully' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'POST',
        path: '/api/friends',
        description: 'Send a friend request',
        auth: true,
        requestBody: [
          { field: 'friend_id', type: 'string', required: true, description: 'ID of user to send friend request to' }
        ],
        responses: [
          { status: 201, description: 'Friend request sent' },
          { status: 400, description: 'Invalid request or already friends' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/friends/{id}',
        description: 'Accept or reject a friend request',
        auth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Friend request ID' }
        ],
        requestBody: [
          { field: 'action', type: 'string', required: true, description: 'Either "accept" or "reject"' }
        ],
        responses: [
          { status: 200, description: 'Friend request processed' },
          { status: 400, description: 'Invalid action' },
          { status: 401, description: 'Authentication required' },
          { status: 404, description: 'Friend request not found' }
        ]
      }
    ]
  },
  {
    title: 'Security',
    icon: <Lock className="h-5 w-5" />,
    description: 'Security features and vulnerability scanning',
    endpoints: [
      {
        method: 'GET',
        path: '/api/security/challenges',
        description: 'Get available security challenges',
        auth: true,
        parameters: [
          { name: 'category', type: 'string', required: false, description: 'Filter by challenge category' },
          { name: 'difficulty', type: 'string', required: false, description: 'Filter by difficulty level' }
        ],
        responses: [
          { status: 200, description: 'Challenges retrieved successfully' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'GET',
        path: '/api/security/vulnerability-scans',
        description: 'Get user\'s vulnerability scan results',
        auth: true,
        parameters: [
          { name: 'limit', type: 'number', required: false, description: 'Number of scans to return' }
        ],
        responses: [
          { status: 200, description: 'Scan results retrieved' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'POST',
        path: '/api/security/vulnerability-scans',
        description: 'Start a new vulnerability scan',
        auth: true,
        requestBody: [
          { field: 'target_url', type: 'string', required: true, description: 'URL to scan for vulnerabilities' },
          { field: 'scan_type', type: 'string', required: true, description: 'Type of scan to perform' }
        ],
        responses: [
          { status: 201, description: 'Scan started successfully' },
          { status: 400, description: 'Invalid scan parameters' },
          { status: 401, description: 'Authentication required' }
        ]
      },
      {
        method: 'POST',
        path: '/api/security-reports',
        description: 'Submit a security vulnerability report',
        auth: false,
        requestBody: [
          { field: 'title', type: 'string', required: true, description: 'Report title' },
          { field: 'description', type: 'string', required: true, description: 'Detailed description' },
          { field: 'severity', type: 'string', required: true, description: 'Severity level (low, medium, high, critical)' },
          { field: 'contact_email', type: 'string', required: false, description: 'Contact email for follow-up' }
        ],
        responses: [
          { status: 201, description: 'Report submitted successfully' },
          { status: 400, description: 'Invalid report data' },
          { status: 429, description: 'Rate limit exceeded' }
        ]
      }
    ]
  },
  {
    title: 'Admin',
    icon: <Settings className="h-5 w-5" />,
    description: 'Administrative functions (admin/site owner only)',
    endpoints: [
      {
        method: 'GET',
        path: '/api/admin/users',
        description: 'Get all users with admin details',
        auth: true,
        adminOnly: true,
        responses: [
          { status: 200, description: 'Users retrieved successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Admin access required' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/users/{id}',
        description: 'Update user permissions or ban status',
        auth: true,
        adminOnly: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'User ID to update' }
        ],
        requestBody: [
          { field: 'is_banned', type: 'boolean', required: false, description: 'Ban/unban user' },
          { field: 'is_admin', type: 'boolean', required: false, description: 'Grant/revoke admin privileges (site owner only)' }
        ],
        responses: [
          { status: 200, description: 'User updated successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Insufficient permissions' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/security-reports',
        description: 'Get all security reports',
        auth: true,
        adminOnly: true,
        responses: [
          { status: 200, description: 'Reports retrieved successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Admin access required' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/messages/{id}',
        description: 'Delete a message (admin only)',
        auth: true,
        adminOnly: true,
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Message ID to delete' }
        ],
        responses: [
          { status: 200, description: 'Message deleted successfully' },
          { status: 401, description: 'Authentication required' },
          { status: 403, description: 'Admin access required' },
          { status: 404, description: 'Message not found' }
        ]
      }
    ]
  }
];

export default function ApiDocumentation() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Authentication']));
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const toggleEndpoint = (endpointKey: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpointKey)) {
      newExpanded.delete(endpointKey);
    } else {
      newExpanded.add(endpointKey);
    }
    setExpandedEndpoints(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          API Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          Complete reference for the Schat API endpoints, authentication, and integration guides.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Base URL</h3>
          <code className="text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">
            https://your-domain.com
          </code>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Authentication</h3>
          <p className="text-yellow-800 dark:text-yellow-200">
            Most endpoints require authentication via HTTP-only cookies. Login first to receive the auth token.
          </p>
        </div>
      </div>

      {apiSections.map((section) => (
        <div key={section.title} className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              {section.icon}
              <div className="text-left">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{section.description}</p>
              </div>
            </div>
            {expandedSections.has(section.title) ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {expandedSections.has(section.title) && (
            <div className="bg-white dark:bg-gray-900">
              {section.endpoints.map((endpoint, index) => {
                const endpointKey = `${section.title}-${index}`;
                const isExpanded = expandedEndpoints.has(endpointKey);
                
                return (
                  <div key={endpointKey} className="border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => toggleEndpoint(endpointKey)}
                      className="w-full px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <code className="text-gray-900 dark:text-gray-100 font-mono">{endpoint.path}</code>
                        <span className="text-gray-600 dark:text-gray-300">{endpoint.description}</span>
                        {endpoint.auth && (
                          <div title="Authentication required">
                            <Lock className="h-4 w-4 text-yellow-500" />
                          </div>
                        )}
                        {endpoint.adminOnly && (
                          <div title="Admin only">
                            <Shield className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-800">
                        {/* Parameters */}
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Parameters</h4>
                            <div className="space-y-2">
                              {endpoint.parameters.map((param) => (
                                <div key={param.name} className="flex items-start space-x-3">
                                  <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                    {param.name}
                                  </code>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                      {param.type} {param.required && <span className="text-red-500">*</span>}
                                    </span>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{param.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Request Body */}
                        {endpoint.requestBody && endpoint.requestBody.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Request Body</h4>
                            <div className="space-y-2">
                              {endpoint.requestBody.map((field) => (
                                <div key={field.field} className="flex items-start space-x-3">
                                  <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                    {field.field}
                                  </code>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                      {field.type} {field.required && <span className="text-red-500">*</span>}
                                    </span>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Responses */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Responses</h4>
                          <div className="space-y-2">
                            {endpoint.responses.map((response, respIndex) => (
                              <div key={respIndex} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    response.status < 300 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    response.status < 400 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {response.status}
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{response.description}</span>
                                </div>
                                {response.example && (
                                  <div className="relative">
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                      <code>{JSON.stringify(response.example, null, 2)}</code>
                                    </pre>
                                    <button
                                      onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2))}
                                      className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
