// Authentication middleware
// Verifies Firebase ID tokens from Authorization header

import { getFirebaseAuth, getFirestore } from '../config/firebase.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header OR cookies (cookies are preferred for security)
    let idToken = null;
    
    // First, try to get from Authorization header (for API clients)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.split('Bearer ')[1];
    }
    
    // If no token in header, try to get from cookies (for browser requests)
    if (!idToken && req.cookies && req.cookies.idToken) {
      idToken = req.cookies.idToken;
    }
    
    if (!idToken) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided. Please log in again.' 
      });
    }

    // Verify the token using Firebase Admin SDK
    try {
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };

      // Fetch user role from Firestore
      try {
        const firestore = getFirestore();
        if (firestore) {
          // Check client users first
          const clientDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(decodedToken.uid)
            .get();
          
          if (clientDoc.exists) {
            const userData = clientDoc.data();
            req.user.role = userData.role || 'client';
          } else {
            // Check admin users
            const adminDoc = await firestore
              .collection('accounts')
              .doc('admin')
              .collection('users')
              .doc(decodedToken.uid)
              .get();
            
            if (adminDoc.exists) {
              req.user.role = 'admin';
            } else {
              req.user.role = 'client'; // Default if user not found in either collection
            }
          }
        } else {
          req.user.role = 'client'; // Default if Firestore not available
        }
      } catch (error) {
        console.warn('Could not fetch user role:', error.message);
        req.user.role = 'client'; // Default on error
      }

      next();
    } catch (error) {
      // If Admin SDK is not initialized, provide helpful error
      if (error.message.includes('not initialized')) {
        return res.status(503).json({ 
          error: 'Service Unavailable', 
          message: 'Firebase Admin SDK not configured. Please configure Firebase credentials in backend/.env' 
        });
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
};

export const isAdmin = (req, res, next) => {
  // TODO: Check if user has admin role
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }
  
  // Placeholder: Check admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }
  
  next();
};

export const isClient = (req, res, next) => {
  // TODO: Check if user has client role
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }
  
  // Placeholder: Check client role
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Forbidden', message: 'Client access required' });
  }
  
  next();
};
