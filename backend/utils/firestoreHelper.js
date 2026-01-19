// Helper function to get Firestore with error handling
import { getFirestore } from '../config/firebase.js';

const FIRESTORE_ERROR_MESSAGE = 'Firestore database is not connected. Please add Firebase Admin SDK credentials to backend/.env:\n\nFIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"\nFIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@i-hub-18b78.iam.gserviceaccount.com"\n\nOR use:\nFIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json\n\nGet these from Firebase Console > Project Settings > Service Accounts';

/**
 * Get Firestore instance and return error response if not initialized
 * @returns {Object|null} Returns { firestore } or null if not initialized
 */
export const getFirestoreWithCheck = () => {
  const firestore = getFirestore();
  return firestore ? { firestore } : null;
};

/**
 * Send Firestore not initialized error response
 * @param {Object} res - Express response object
 * @returns {Object} Express response with 503 status
 */
export const sendFirestoreError = (res) => {
  return res.status(503).json({
    success: false,
    error: 'Service Unavailable',
    message: FIRESTORE_ERROR_MESSAGE
  });
};

export { FIRESTORE_ERROR_MESSAGE };
