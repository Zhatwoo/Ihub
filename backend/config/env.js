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
  // TODO: Add Firebase config when ready
  // firebase: {
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  //   privateKey: process.env.FIREBASE_PRIVATE_KEY,
  //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  // }
};

export default config;
