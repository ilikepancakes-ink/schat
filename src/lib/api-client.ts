/**
 * Enhanced API client with global 401 error handling and Discord webhook notifications
 */

// Discord webhook URL for 401 error notifications
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1390381287398969514/ha9zIh5rN42iNsjgcUzIa4gdoxdMyhOBdAhfo9_uVvPOL-fF-2gsEJN8c0urHv7QIoUf';

/**
 * Send a Discord webhook message for 401 errors
 */
async function sendDiscordWebhook(message: string): Promise<void> {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
      }),
    });
  } catch (error) {
    console.error('Failed to send Discord webhook:', error);
  }
}

/**
 * Enhanced fetch wrapper that handles 401 errors globally
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Check for 401 unauthorized errors
    if (response.status === 401) {
      const timestamp = new Date().toISOString();
      const message = `lol 401 error at ${timestamp}`;
      
      // Send Discord webhook notification (fire and forget)
      sendDiscordWebhook(message).catch(() => {
        // Silently fail if webhook fails
      });
    }
    
    return response;
  } catch (error) {
    // Re-throw the original error
    throw error;
  }
}

/**
 * Convenience methods for common HTTP operations
 */
export const apiClient = {
  get: (url: string, options: RequestInit = {}) => 
    apiRequest(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: any, options: RequestInit = {}) => 
    apiRequest(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: (url: string, data?: any, options: RequestInit = {}) => 
    apiRequest(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (url: string, options: RequestInit = {}) => 
    apiRequest(url, { ...options, method: 'DELETE' }),
  
  patch: (url: string, data?: any, options: RequestInit = {}) => 
    apiRequest(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
};

// Export the main function as default for backward compatibility
export default apiRequest;
