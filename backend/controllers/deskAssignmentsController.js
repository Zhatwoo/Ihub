// Desk Assignments controller
// Handles desk assignment management operations using Firestore

import { getFirestore } from '../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

/**
 * Get all desk assignments
 */
export const getAllDeskAssignments = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get all desk assignments error:', error);
    
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
      message: error.message || 'Failed to fetch desk assignments'
    });
  }
};

/**
 * Get desk assignment by ID
 */
export const getDeskAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const assignmentDoc = await firestore.collection('desk-assignments').doc(assignmentId).get();

    if (!assignmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk assignment not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: assignmentDoc.id,
        ...assignmentDoc.data()
      }
    });
  } catch (error) {
    console.error('Get desk assignment by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk assignment'
    });
  }
};

/**
 * Create new desk assignment
 * If deskId is provided in assignmentData, use it as document ID
 */
export const createDeskAssignment = async (req, res) => {
  try {
    const assignmentData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // If desk field exists, use it as document ID (for direct assignment by desk tag)
    const docId = assignmentData.desk || null;
    
    let assignmentRef;
    if (docId) {
      // Use specific document ID (desk tag)
      assignmentRef = firestore.collection('desk-assignments').doc(docId);
      await assignmentRef.set({
        ...assignmentData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Let Firestore generate ID
      assignmentRef = await firestore.collection('desk-assignments').add({
        ...assignmentData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const newAssignment = await assignmentRef.get();

    res.status(201).json({
      success: true,
      message: 'Desk assignment created successfully',
      data: {
        id: newAssignment.id,
        ...newAssignment.data()
      }
    });
  } catch (error) {
    console.error('Create desk assignment error:', error);
    
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
      message: error.message || 'Failed to create desk assignment'
    });
  }
};

/**
 * Update desk assignment
 * Also supports create-if-not-exists behavior
 */
export const updateDeskAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const assignmentRef = firestore.collection('desk-assignments').doc(assignmentId);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
      // Create if doesn't exist
      await assignmentRef.set({
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing
      await assignmentRef.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const updatedAssignment = await assignmentRef.get();

    res.json({
      success: true,
      message: 'Desk assignment saved successfully',
      data: {
        id: updatedAssignment.id,
        ...updatedAssignment.data()
      }
    });
  } catch (error) {
    console.error('Update desk assignment error:', error);
    
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
      message: error.message || 'Failed to update desk assignment'
    });
  }
};

/**
 * Delete desk assignment
 */
export const deleteDeskAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const assignmentRef = firestore.collection('desk-assignments').doc(assignmentId);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk assignment not found'
      });
    }

    await assignmentRef.delete();

    res.json({
      success: true,
      message: 'Desk assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete desk assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete desk assignment'
    });
  }
};
