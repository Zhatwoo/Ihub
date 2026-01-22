// Account management controller
// Handles client and admin account operations using Firestore

import { getFirestore, getFirebaseAuth } from '../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../utils/firestoreHelper.js';
import { config } from '../config/env.js';

/**
 * Get all client users
 */
export const getAllClientUsers = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const usersSnapshot = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .get();
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all client users error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database is not connected. Please configure Firebase Admin SDK credentials in backend/.env'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch client users'
    });
  }
};

/**
 * Get client user by ID
 */
export const getClientUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const userDoc = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Get client user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch user'
    });
  }
};

/**
 * Get user desk request
 */
export const getUserDeskRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Check if user exists first
    const userRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId);
    
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }
    
    const requestDoc = await userRef
      .collection('request')
      .doc('desk')
      .get();

    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk request not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: requestDoc.id,
        ...requestDoc.data(),
        userId
      }
    });
  } catch (error) {
    console.error('Get user desk request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk request'
    });
  }
};

/**
 * Get all desk requests
 */
export const getAllDeskRequests = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Get all client users
    const usersSnapshot = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .get();

    const requests = [];
    
    // For each user, check if they have a desk request
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const firstName = userData.firstName;
      
      if (!firstName) {
        continue; // Skip users without firstName
      }
      
      const requestDoc = await firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(firstName)
        .collection('request')
        .doc('desk')
        .get();

      if (requestDoc.exists) {
        requests.push({
          id: requestDoc.id,
          userId,
          firstName,
          ...requestDoc.data(),
          userInfo: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email
          }
        });
      }
    }

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get all desk requests error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database is not connected. Please configure Firebase Admin SDK credentials in backend/.env'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk requests'
    });
  }
};

/**
 * Get admin user by ID
 */
export const getAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const userDoc = await firestore
      .collection('accounts')
      .doc('admin')
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch admin user'
    });
  }
};

/**
 * Update admin user
 */
export const updateAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const userRef = firestore
      .collection('accounts')
      .doc('admin')
      .collection('users')
      .doc(userId);
    
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Admin user not found'
      });
    }

    await userRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedUser = await userRef.get();

    res.json({
      success: true,
      message: 'Admin user updated successfully',
      data: {
        id: updatedUser.id,
        ...updatedUser.data()
      }
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update admin user'
    });
  }
};

/**
 * Update desk request
 */
export const updateDeskRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Ensure user document exists before creating subcollection
    const userRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId);
    
    const userDoc = await userRef.get();
    
    // Create user document if it doesn't exist (with minimal info from request)
    if (!userDoc.exists) {
      await userRef.set({
        email: updateData.email || updateData.requestedBy?.email || '',
        firstName: updateData.firstName || updateData.requestedBy?.firstName || '',
        lastName: updateData.lastName || updateData.requestedBy?.lastName || '',
        companyName: updateData.company || updateData.companyName || updateData.requestedBy?.companyName || '',
        contact: updateData.contact || updateData.requestedBy?.contact || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    const requestRef = userRef
      .collection('request')
      .doc('desk');
    
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      // Create new request if it doesn't exist
      await requestRef.set({
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing request
      await requestRef.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const updatedRequest = await requestRef.get();

    res.json({
      success: true,
      message: 'Desk request saved successfully',
      data: {
        id: updatedRequest.id,
        userId,
        ...updatedRequest.data()
      }
    });
  } catch (error) {
    console.error('Update desk request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to save desk request'
    });
  }
};

/**
 * Delete desk request
 */
export const deleteDeskRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const requestRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('desk');
    
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk request not found'
      });
    }

    await requestRef.delete();

    res.json({
      success: true,
      message: 'Desk request deleted successfully'
    });
  } catch (error) {
    console.error('Delete desk request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete desk request'
    });
  }
};

/**
 * Create admin user
 * Uses Firebase Auth REST API (like signup) to avoid Admin SDK permission issues
 */
export const createAdminUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'admin' } = req.body;
    const firestore = getFirestore();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
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

    // Get Firebase API key from config
    const FIREBASE_API_KEY = config.firebase.apiKey;
    if (!FIREBASE_API_KEY) {
      console.error('❌ Firebase API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Firebase API key not configured. Please add FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY to backend/.env file and restart the server.'
      });
    }

    // Use Firebase Auth REST API to create user (like signup function)
    const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
    const signUpUrl = `${FIREBASE_AUTH_URL}:signUp?key=${FIREBASE_API_KEY}`;
    
    let response;
    let data;
    
    try {
      response = await fetch(signUpUrl, {
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

      data = await response.json();
    } catch (fetchError) {
      console.error('Firebase Auth API fetch error:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Network Error',
        message: 'Failed to connect to Firebase Authentication service. Please check your internet connection and Firebase configuration.'
      });
    }

    if (!response.ok) {
      let errorMessage = 'Failed to create admin user';
      
      if (data.error?.message) {
        const message = data.error.message;
        if (message.includes('EMAIL_EXISTS')) {
          errorMessage = 'This email is already registered';
        } else if (message.includes('INVALID_EMAIL')) {
          errorMessage = 'Invalid email address';
        } else if (message.includes('WEAK_PASSWORD')) {
          errorMessage = 'Password is too weak';
        } else if (message.includes('OPERATION_NOT_ALLOWED')) {
          errorMessage = 'Email/Password sign-up is currently disabled. Please enable it in Firebase Console > Authentication > Sign-in method > Email/Password.';
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

    // User created successfully, get UID from response
    const uid = data.localId;

    // Save admin data to Firestore (if available)
    const adminDoc = {
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      role: role || 'admin',
      createdAt: new Date().toISOString(),
    };

    // Try to save to Firestore if available
    if (firestore) {
      try {
        await firestore
          .collection('accounts')
          .doc('admin')
          .collection('users')
          .doc(uid)
          .set({
            ...adminDoc,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      } catch (firestoreError) {
        // Firestore not available - log warning but continue
        console.warn('⚠️  Firestore not available, admin data not saved to Firestore:', firestoreError.message);
        console.warn('   Admin user created in Firebase Auth but profile data not saved');
      }
    } else {
      console.warn('⚠️  Firestore not initialized, admin data not saved to Firestore');
    }

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        uid,
        email: data.email,
        ...adminDoc
      }
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    let errorMessage = 'Failed to create admin user';
    
    // Provide more specific error messages
    if (error.message) {
      errorMessage = error.message;
    }
    
    // Check if it's a network/fetch error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Failed to connect to Firebase. Please check your internet connection and Firebase configuration.';
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
