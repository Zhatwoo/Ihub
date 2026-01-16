import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Validate Firebase configuration
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(
  (varName) => {
    const value = process.env[varName];
    return !value || (typeof value === 'string' && value.trim() === '');
  }
);

// Only show error in development, and only once
if (missingVars.length > 0 && typeof window === 'undefined') {
  console.error(
    '❌ Missing Firebase environment variables:',
    missingVars.join(', ')
  );
  console.error(
    'Please check your .env.local file in the root directory and make sure it contains:'
  );
  requiredEnvVars.forEach((varName) => {
    console.error(`  ${varName}=your_value_here`);
  });
  console.error('\n⚠️  IMPORTANT: Restart your Next.js dev server after updating .env.local');
  console.error('   Stop the server (Ctrl+C) and run: npm run dev');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase only if it hasn't been initialized
let app;
try {
  if (missingVars.length === 0) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } else {
    // Create a dummy app to prevent crashes, but it won't work
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  if (error.code === 'auth/invalid-api-key') {
    console.error(
      '⚠️  Invalid Firebase API key. Please check your NEXT_PUBLIC_FIREBASE_API_KEY in .env.local'
    );
  }
  // Don't throw - allow app to continue with limited functionality
  if (typeof window === 'undefined') {
    console.error('⚠️  Firebase will not be available. Please fix your environment variables and restart the server.');
  }
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export default app;
