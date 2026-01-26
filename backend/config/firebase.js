// Firebase Admin SDK configuration
import admin from 'firebase-admin';
import { config } from './env.js';

let isInitialized = false;

export const initFirebase = async () => {
  if (isInitialized) {
    return {
      admin,
      auth: admin.auth(),
      firestore: admin.firestore(),
      storage: admin.storage()
    };
  }

  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      isInitialized = true;
      return {
        admin,
        auth: admin.auth(),
        firestore: admin.firestore(),
        storage: admin.storage()
      };
    }

    // Initialize Firebase Admin SDK
    // Option 1: Use service account from environment variables
    if (config.firebase.privateKey && config.firebase.clientEmail && config.firebase.projectId) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            privateKey: config.firebase.privateKey,
            clientEmail: config.firebase.clientEmail,
          }),
          projectId: config.firebase.projectId,
        });
        console.log('✅ Firebase Admin SDK initialized with environment variables');
      } catch (certError) {
        console.error('❌ Error initializing with service account credentials:', certError.message);
        throw certError;
      }
    }
    // Option 2: Use service account key file (if provided)
    else if (config.firebase.serviceAccountPath) {
      const serviceAccount = await import(config.firebase.serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount.default || serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized with service account file');
    }
    // Option 3: Try Application Default Credentials if projectId is available
    // This works if GOOGLE_APPLICATION_CREDENTIALS is set or in Google Cloud environments
    else if (config.firebase.projectId) {
      try {
        // Try with explicit applicationDefault credential
        admin.initializeApp({
          projectId: config.firebase.projectId,
          credential: admin.credential.applicationDefault(),
        });
        console.log('✅ Firebase Admin SDK initialized with Application Default Credentials');
      } catch (defaultCredError) {
        try {
          // Fallback: Initialize with just projectId (may use implicit credentials)
          admin.initializeApp({
            projectId: config.firebase.projectId,
          });
          console.log('✅ Firebase Admin SDK initialized with project ID');
        } catch (fallbackError) {
          console.warn('⚠️  Could not initialize Firebase Admin SDK with default credentials');
          console.warn('   Error:', fallbackError.message);
          console.warn('   For local development, you need service account credentials.');
          console.warn('   Add to backend/.env:');
          console.warn('     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
          console.warn('     FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"');
          console.warn('   OR use:');
          console.warn('     FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json');
          console.warn('   Admin SDK features (Firestore, token verification) will not be available');
          // Don't throw - allow app to run without Admin SDK
          return {
            admin: null,
            auth: null,
            firestore: null,
            storage: null
          };
        }
      }
    }
    // Option 4: Skip initialization if no credentials available
    else {
      console.warn('⚠️  Firebase Admin SDK not initialized - no credentials found');
      console.warn('   Admin SDK features (Firestore, token verification) will not be available');
      console.warn('   Auth REST API will still work for login/signup');
      return {
        admin: null,
        auth: null,
        firestore: null,
        storage: null
      };
    }

    isInitialized = true;
    return {
      admin,
      auth: admin.auth(),
      firestore: admin.firestore(),
      storage: admin.storage()
    };
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error.message);
    console.error('   Some features may not work. Check your Firebase configuration in backend/.env');
    // Don't throw - allow app to run, but Admin SDK won't be available
    return {
      admin: null,
      auth: null,
      firestore: null,
      storage: null
    };
  }
};

export const getFirebaseAuth = () => {
  if (!isInitialized || !admin.apps.length) {
    throw new Error('Firebase Auth not initialized. Call initFirebase() first.');
  }
  return admin.auth();
};

export const getFirestore = () => {
  if (!isInitialized || !admin.apps.length) {
    return null; // Return null instead of throwing, so controllers can handle gracefully
  }
  return admin.firestore();
};

export const getFirebaseStorage = () => {
  if (!isInitialized || !admin.apps.length) {
    return null; // Return null instead of throwing, so services can handle gracefully
  }
  try {
    return admin.storage();
  } catch (error) {
    console.warn('Firebase Storage not available:', error.message);
    return null;
  }
};

export default { initFirebase, getFirebaseAuth, getFirestore, getFirebaseStorage };
