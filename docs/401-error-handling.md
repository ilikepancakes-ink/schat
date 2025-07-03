# 401/403 Error Handling with Discord Webhook

This document describes the implementation of global 401 and 403 error handling that sends Discord webhook notifications.

## Overview

The application now includes a global error handler that automatically sends a Discord webhook message whenever any API request returns a 401 Unauthorized or 403 Forbidden status code.

## Implementation

### API Client (`src/lib/api-client.ts`)

A new API client wrapper has been created that:
- Wraps the native `fetch()` function
- Intercepts all HTTP responses
- Detects 401 (Unauthorized) and 403 (Forbidden) status codes
- Sends Discord webhook notifications for both error types
- Provides convenience methods for common HTTP operations

### Discord Webhook

- **Webhook URL**: `https://discord.com/api/webhooks/1390381287398969514/ha9zIh5rN42iNsjgcUzIa4gdoxdMyhOBdAhfo9_uVvPOL-fF-2gsEJN8c0urHv7QIoUf`
- **Message Format**:
  - 401 errors: `"lol 401 error at <timestamp> on path <url>"`
  - 403 errors: `"lol 403 error at <timestamp> on path <url>"`
- **Timestamp Format**: ISO 8601 (e.g., `2024-01-15T10:30:45.123Z`)
- **URL Format**: The full URL path that caused the error (e.g., `/api/messages`, `/api/admin/users`)

### Example Messages

- `"lol 401 error at 2024-01-15T10:30:45.123Z on path /api/messages"`
- `"lol 403 error at 2024-01-15T10:30:45.123Z on path /api/admin/users"`
- `"lol 401 error at 2024-01-15T10:30:45.123Z on path /api/profile/abc123"`

### Updated Components

The following components have been updated to use the new API client:

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Login requests
   - Registration requests
   - Authentication checks
   - Logout requests

2. **ChatInterface** (`src/components/chat/ChatInterface.tsx`)
   - Message loading
   - Message sending
   - Message deletion
   - User management
   - Profile operations
   - Friend operations

3. **AdminPanel** (`src/components/admin/AdminPanel.tsx`)
   - User list loading
   - User actions (ban, unban, etc.)

## Usage

### Basic API Requests

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const response = await apiClient.get('/api/endpoint');

// POST request
const response = await apiClient.post('/api/endpoint', { data: 'value' });

// PUT request
const response = await apiClient.put('/api/endpoint', { data: 'value' });

// DELETE request
const response = await apiClient.delete('/api/endpoint');
```

### Advanced Usage

```typescript
import { apiRequest } from '@/lib/api-client';

// Custom request with full control
const response = await apiRequest('/api/endpoint', {
  method: 'PATCH',
  headers: {
    'Custom-Header': 'value',
  },
  body: JSON.stringify({ data: 'value' }),
});
```

## Error Handling

- 401 (Unauthorized) and 403 (Forbidden) errors are automatically detected and reported to Discord
- The original response is returned unchanged for application-level handling
- Webhook failures are silently ignored to prevent disrupting the main application flow
- All other errors are passed through normally

## Testing

A test file has been created at `src/test-401-handler.ts` to verify the functionality. This can be used to manually test both 401 and 403 error detection and Discord webhook integration.

## Security Considerations

- The Discord webhook URL is hardcoded in the client code
- Webhook failures do not affect the main application functionality
- No sensitive data is included in the Discord messages
- Only the error code (401/403), timestamp, and URL path are sent to Discord for privacy
- URL paths may contain route parameters but no query strings or sensitive data

## Future Enhancements

Potential improvements could include:
- Configurable webhook URLs via environment variables
- Different message formats for different error types
- Rate limiting for webhook notifications
- Additional error codes beyond 401
- Structured logging integration
