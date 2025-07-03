/**
 * Test script to verify 401 and 403 error handling and Discord webhook functionality
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
      console.log('Check Discord channel for the message: "lol 401 error at <timestamp> on path /api/messages"');
    } else {
      console.log('❌ Expected 401 but got:', response.status);
    }

    const data = await response.json();
    console.log('Response data:', data);

  } catch (error) {
    console.error('Error during test:', error);
  }
}

async function test403Handler() {
  console.log('Testing 403 error handler...');

  try {
    // Make a request to an admin endpoint that should return 403 (non-admin user)
    const response = await apiClient.get('/api/admin/users');

    console.log('Response status:', response.status);

    if (response.status === 403) {
      console.log('✅ 403 error detected - Discord webhook should have been sent');
      console.log('Check Discord channel for the message: "lol 403 error at <timestamp> on path /api/admin/users"');
    } else {
      console.log('❌ Expected 403 but got:', response.status);
    }

    const data = await response.json();
    console.log('Response data:', data);

  } catch (error) {
    console.error('Error during test:', error);
  }
}

async function testErrorHandlers() {
  console.log('Testing both 401 and 403 error handlers...');
  await test401Handler();
  console.log('---');
  await test403Handler();
}

// Export for potential use in other test files
export { test401Handler, test403Handler, testErrorHandlers };

// Run test if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testErrorHandlers();
}
