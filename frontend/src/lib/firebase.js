// Firebase Client SDK - DEPRECATED
// This file is no longer used. All Firebase operations are handled by the backend.
// Keeping this file for backward compatibility, but it exports null values.

// All authentication and Firebase operations are now handled by the backend API.
// The frontend no longer needs Firebase Client SDK or Firebase environment variables.

export const auth = null;
export const db = null;
export const storage = null;

export const getDb = () => {
  throw new Error('Firebase Client SDK is deprecated. Use backend API instead.');
};

export const isFirebaseAvailable = () => false;

export default null;
