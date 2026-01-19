// Environment configuration
// Validates and exports environment variables

import dotenv from 'dotenv';

dotenv.config();

// Variables that are required (no defaults)
// Note: PORT and NODE_ENV have defaults, so they're optional
const requiredEnvVars = [
  // TODO: Add Firebase Admin SDK environment variables when ready
  // 'FIREBASE_PROJECT_ID',
  // 'FIREBASE_PRIVATE_KEY',
  // 'FIREBASE_CLIENT_EMAIL'
];

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName] || process.env[varName].trim() === ''
);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  firebase: {
    // Project ID - try multiple sources with fallback for development
    projectId: process.env.FIREBASE_PROJECT_ID || 
               process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
               (process.env.NODE_ENV === 'development' ? 'i-hub-18b78' : null),
    // Firebase API Key - try multiple sources
    // Priority: FIREBASE_API_KEY > NEXT_PUBLIC_FIREBASE_API_KEY > hardcoded fallback (for development)
    apiKey: process.env.FIREBASE_API_KEY || 
            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
            (process.env.NODE_ENV === 'development' ? 'AIzaSyDfckUvR-aYsJeImRxV2D6TbQ11u-D7Gxk' : null),
    // For Firebase Admin, we need service account credentials
    // These can be set via environment variables or service account key file
    // Handle private key with proper newline replacement
    privateKey: process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
      : null,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.replace(/"/g, ''),
    // Alternative: path to service account key JSON file
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  }
};

export default config;
