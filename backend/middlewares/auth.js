// Authentication middleware
// Verifies Firebase ID tokens from Authorization header

import { getFirebaseAuth } from '../config/firebase.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided. Please include Authorization: Bearer <token>' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token format' 
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
