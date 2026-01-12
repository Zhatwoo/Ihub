import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.authDomain !== 'undefined' &&
    firebaseConfig.projectId !== 'undefined' &&
    firebaseConfig.storageBucket !== 'undefined' &&
    firebaseConfig.messagingSenderId !== 'undefined' &&
    firebaseConfig.appId !== 'undefined'
  );
};

// Initialize Firebase only if config is valid and it hasn't been initialized
let app = null;

if (!isFirebaseConfigValid()) {
  const missingVars = [];
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain || firebaseConfig.authDomain === 'undefined') missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'undefined') missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket || firebaseConfig.storageBucket === 'undefined') missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId === 'undefined') missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId || firebaseConfig.appId === 'undefined') missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  
  // Log warning instead of throwing to prevent app crash
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ Firebase configuration is missing or invalid.\n' +
      `Missing environment variables: ${missingVars.join(', ')}\n\n` +
      'Please create a .env.local file in the root directory with the following variables:\n' +
      'NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key\n' +
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com\n' +
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id\n' +
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com\n' +
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id\n' +
      'NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id\n\n' +
      'You can find these values in your Firebase Console: Project Settings > General > Your apps'
    );
  }
} else {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    app = null;
  }
}

// Export Firebase services
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export default app;
