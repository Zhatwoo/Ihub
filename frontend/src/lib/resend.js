import { Resend } from 'resend';

// Get API key from environment variable
const apiKey = process.env.RESEND_API_KEY;

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Resend initialization:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
  });
}

if (!apiKey) {
  console.error('RESEND_API_KEY is required but not found in environment variables.');
  throw new Error('RESEND_API_KEY is required but not found. Please add it to your .env.local file and restart the dev server.');
}

// Initialize Resend instance
let resendInstance;
try {
  resendInstance = new Resend(apiKey);
  
  // Validate the instance was created properly
  if (!resendInstance) {
    throw new Error('Resend constructor returned undefined');
  }
  
  if (typeof resendInstance.emails === 'undefined') {
    console.error('Resend instance structure:', Object.keys(resendInstance));
    throw new Error('Resend emails API is not available on the instance');
  }
} catch (error) {
  console.error('Failed to initialize Resend:', error);
  throw error;
}

export const resend = resendInstance;
