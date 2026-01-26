// Resend Configuration
// Initialize Resend instance for sending emails

import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

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
  console.error('');
  console.error('⚠️  RESEND_API_KEY is required but not found in environment variables.');
  console.error('   📝 Add to backend/.env: RESEND_API_KEY=re_xxxxxxxxxxxxx');
  console.error('   🔗 Get your API key from: https://resend.com/api-keys');
  console.error('   ⚠️  Email routes will not work until this is configured.');
  console.error('');
}

// Initialize Resend instance
let resendInstance;
try {
  if (apiKey) {
    resendInstance = new Resend(apiKey);
    
    // Validate the instance was created properly
    if (!resendInstance) {
      throw new Error('Resend constructor returned undefined');
    }
    
    if (typeof resendInstance.emails === 'undefined') {
      console.error('Resend instance structure:', Object.keys(resendInstance));
      throw new Error('Resend emails API is not available on the instance');
    }
    
    console.log('✅ Resend initialized successfully');
  } else {
    console.warn('⚠️  Resend not initialized - RESEND_API_KEY missing');
  }
} catch (error) {
  console.error('Failed to initialize Resend:', error);
  // Don't throw - allow server to start, but email features will fail gracefully
  resendInstance = null;
}

export const resend = resendInstance;

export default resend;
