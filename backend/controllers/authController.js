// Authentication Controller
// Handles login, signup, and token verification using Firebase Auth REST API and Admin SDK

import { getFirebaseAuth, getFirestore } from '../config/firebase.js';
import { config } from '../config/env.js';
import admin from 'firebase-admin';

// Get Firebase API key from environment
// Backend needs this to use Firebase Auth REST API
// Priority: env var > config > null
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 
                         process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
                         config.firebase?.apiKey;
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts`;

/**
 * Login user with email and password using Firebase Auth REST API
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    if (!FIREBASE_API_KEY) {
      console.error('❌ Firebase API key not configured');
      console.error('   Add to backend/.env: NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key');
      console.error('   Or: FIREBASE_API_KEY=your-api-key');
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Firebase API key not configured. Please add NEXT_PUBLIC_FIREBASE_API_KEY to backend/.env file and restart the server.',
        details: 'The backend needs the Firebase API key to authenticate users. Add it to your backend/.env file.'
      });
    }

    // Use Firebase Auth REST API to sign in
    const signInUrl = `${FIREBASE_AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`;
    
    const response = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle Firebase Auth errors
      let errorMessage = 'Invalid email or password';
      
      if (data.error?.message) {
        const message = data.error.message;
        if (message.includes('INVALID_PASSWORD') || message.includes('INVALID_EMAIL')) {
          errorMessage = 'Invalid email or password';
        } else if (message.includes('USER_DISABLED')) {
          errorMessage = 'This account has been disabled';
        } else if (message.includes('TOO_MANY_ATTEMPTS')) {
          errorMessage = 'Too many failed attempts. Please try again later';
        } else if (message.includes('OPERATION_NOT_ALLOWED')) {
          errorMessage = 'Email/Password sign-in is currently disabled. Please enable it in Firebase Console > Authentication > Sign-in method > Email/Password.';
        } else {
          errorMessage = message;
        }
      }

      return res.status(401).json({
        error: 'Unauthorized',
        message: errorMessage
      });
    }

    // Get user role from Firestore (if available)
    const uid = data.localId;
    let userData = null;
    let role = 'client';
    let redirectPath = '/client/home';

    // Try to get user role from Firestore if Admin SDK is initialized
    try {
      const firestore = getFirestore();
      // Check in client users
      const clientDoc = await firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(uid)
        .get();

      if (clientDoc.exists) {
        userData = clientDoc.data();
        role = userData.role || 'client';
        redirectPath = role === 'admin' ? '/admin' : '/client/home';
      } else {
        // Check in admin users
        const adminDoc = await firestore
          .collection('accounts')
          .doc('admin')
          .collection('users')
          .doc(uid)
          .get();

        if (adminDoc.exists) {
          userData = adminDoc.data();
          role = 'admin';
          redirectPath = '/admin';
        }
      }
    } catch (error) {
      // Firestore not available - use default role
      console.warn('⚠️  Firestore not available, using default client role:', error.message);
      role = 'client';
      redirectPath = '/client/home';
    }

    // Set HttpOnly cookies for tokens (more secure than localStorage)
    // For localhost development, don't set domain so cookies work across ports
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
      // Don't set domain for localhost - allows cookies to work across ports (3000 and 5000)
    };

    // Set idToken cookie
    res.cookie('idToken', data.idToken, cookieOptions);
    
    // Set refreshToken cookie (longer expiry)
    res.cookie('refreshToken', data.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Set user info cookie (non-sensitive data only)
    res.cookie('user', JSON.stringify({
      uid,
      email: data.email,
      role
    }), {
      ...cookieOptions,
      httpOnly: false // Allow frontend to read user info
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        uid,
        email: data.email,
        role,
        redirectPath,
        expiresIn: data.expiresIn,
        userData
        // Tokens are now in cookies, not in response
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An error occurred during login'
    });
  }
};

/**
 * Sign up new user using Firebase Auth REST API
 */
export const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, contact } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Password must be at least 6 characters long'
      });
    }

    if (!FIREBASE_API_KEY) {
      console.error('❌ Firebase API key not configured');
      console.error('   Add to backend/.env: NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key');
      console.error('   Or: FIREBASE_API_KEY=your-api-key');
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Firebase API key not configured. Please add NEXT_PUBLIC_FIREBASE_API_KEY to backend/.env file and restart the server.',
        details: 'The backend needs the Firebase API key to authenticate users. Add it to your backend/.env file.'
      });
    }

    // Use Firebase Auth REST API to sign up
    const signUpUrl = `${FIREBASE_AUTH_URL}:signUp?key=${FIREBASE_API_KEY}`;
    
    const response = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'An error occurred during signup';
      
      if (data.error?.message) {
        const message = data.error.message;
        if (message.includes('EMAIL_EXISTS')) {
          errorMessage = 'This email is already registered';
        } else if (message.includes('INVALID_EMAIL')) {
          errorMessage = 'Invalid email address';
        } else if (message.includes('WEAK_PASSWORD')) {
          errorMessage = 'Password is too weak';
        } else if (message.includes('OPERATION_NOT_ALLOWED')) {
          errorMessage = 'Email/Password sign-up is currently disabled. Please contact the administrator or enable Email/Password authentication in Firebase Console > Authentication > Sign-in method.';
        } else {
          errorMessage = message;
        }
      }

      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: errorMessage
      });
    }

    // Save user data to Firestore (if available)
    const uid = data.localId;

    const userDoc = {
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      companyName: companyName || '',
      contact: contact || '',
      createdAt: new Date().toISOString(),
      role: 'client', // All registrations are clients
    };

    // Try to save to Firestore if Admin SDK is initialized
    try {
      const firestore = getFirestore();
      await firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(uid)
        .set({
          ...userDoc,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      // Firestore not available - log warning but continue
      console.warn('⚠️  Firestore not available, user data not saved to Firestore:', error.message);
      console.warn('   User created in Firebase Auth but profile data not saved');
    }

    // Don't set cookies on signup - user needs to log in manually
    // This is more secure and gives user control over their session

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in to continue.',
      data: {
        uid,
        email: data.email,
        role: 'client',
        redirectPath: '/', // Redirect to landing page to log in
        // No tokens - user must log in manually
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An error occurred during signup'
    });
  }
};

/**
 * Verify Firebase ID token
 * Used by middleware to authenticate requests
 */
export const verifyToken = async (idToken) => {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    // If Admin SDK is not initialized, we can't verify tokens
    // This means the auth middleware won't work, but login/signup will still work
    if (error.message.includes('not initialized')) {
      throw new Error('Firebase Admin SDK not configured. Token verification unavailable.');
    }
    throw new Error('Invalid or expired token');
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (req, res) => {
  try {
    const { uid } = req.user; // From auth middleware

    // Get user from Auth (if Admin SDK is available)
    let user = null;
    let userData = null;
    let role = 'client';

    try {
      const auth = getFirebaseAuth();
      user = await auth.getUser(uid);
    } catch (error) {
      console.warn('⚠️  Firebase Admin Auth not available:', error.message);
    }

    // Get user data from Firestore (if available)
    try {
      const firestore = getFirestore();
      const clientDoc = await firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(uid)
        .get();

      if (clientDoc.exists) {
        userData = clientDoc.data();
        role = userData.role || 'client';
      } else {
        const adminDoc = await firestore
          .collection('accounts')
          .doc('admin')
          .collection('users')
          .doc(uid)
          .get();

        if (adminDoc.exists) {
          userData = adminDoc.data();
          role = 'admin';
        }
      }
    } catch (error) {
      console.warn('⚠️  Firestore not available:', error.message);
    }

    res.json({
      success: true,
      data: {
        uid: user?.uid || uid,
        email: user?.email || req.user.email,
        role,
        userData
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An error occurred'
    });
  }
};

/**
 * Logout user - Clear authentication cookies
 */
export const logout = async (req, res) => {
  try {
    // Clear all authentication cookies
    // Use same options as when setting cookies to ensure they're cleared properly
    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    };
    
    res.clearCookie('idToken', clearCookieOptions);
    res.clearCookie('refreshToken', clearCookieOptions);
    res.clearCookie('user', {
      ...clearCookieOptions,
      httpOnly: false
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'An error occurred during logout'
    });
  }
};
