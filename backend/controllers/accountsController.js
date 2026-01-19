// Account management controller
// Handles client and admin account operations using Firestore

import { getFirestore, getFirebaseAuth } from '../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

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
    
    const requestDoc = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
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
      const requestDoc = await firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('request')
        .doc('desk')
        .get();

      if (requestDoc.exists) {
        requests.push({
          id: requestDoc.id,
          userId,
          ...requestDoc.data()
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

    await requestRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedRequest = await requestRef.get();

    res.json({
      success: true,
      message: 'Desk request updated successfully',
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
      message: error.message || 'Failed to update desk request'
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
 */
export const createAdminUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'admin' } = req.body;
    const auth = getFirebaseAuth();
    const firestore = getFirestore();

    if (!firestore) {
      return sendFirestoreError(res);
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Create user in Firebase Auth
    const user = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Save admin data to Firestore
    const adminDoc = {
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      role: role || 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestore
      .collection('accounts')
      .doc('admin')
      .collection('users')
      .doc(user.uid)
      .set(adminDoc);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        uid: user.uid,
        email: user.email,
        ...adminDoc
      }
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    let errorMessage = 'Failed to create admin user';
    
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email is already registered';
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: errorMessage
    });
  }
};
