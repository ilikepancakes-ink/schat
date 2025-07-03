/**
 * Test script to verify 401 error handling and Discord webhook functionality
 * This is a temporary test file that can be removed after verification
 */

import { apiClient } from './lib/api-client';

async function test401Handler() {
  console.log('Testing 401 error handler...');
  
  try {
    // Make a request to an endpoint that should return 401 (without auth token)
    const response = await apiClient.get('/api/messages');
    
    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ 401 error detected - Discord webhook should have been sent');
      console.log('Check Discord channel for the message: "lol 401 error at <timestamp>"');
    } else {
      console.log('❌ Expected 401 but got:', response.status);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Export for potential use in other test files
export { test401Handler };

// Run test if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  test401Handler();
}
