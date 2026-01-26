import admin from 'firebase-admin';
import { getFirestore } from '../../../config/firebase.js';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

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
    
    const requestsSnapshot = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('desk')
      .collection('requests')
      .get();

    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: requests
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
 * Update desk request (create or update)
 */
export const updateDeskRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Ensure user document exists
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

    // Create desk request with unique ID
    // Path: /accounts/client/users/{userId}/request/desk/{deskRequestId}
    const requestRef = userRef.collection('request').doc('desk').collection('requests').doc();
    
    await requestRef.set({
      ...requestData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedRequest = await requestRef.get();

    res.json({
      success: true,
      message: 'Desk request created successfully',
      data: {
        id: updatedRequest.id,
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
    const { userId, requestId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    if (!userId || !requestId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'userId and requestId are required'
      });
    }
    
    const requestRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('desk')
      .collection('requests')
      .doc(requestId);
    
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
